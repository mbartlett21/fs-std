FeatureScript 701; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present Onshape Inc.

import(path : "onshape/std/attributes.fs", version : "701.0");
import(path : "onshape/std/boolean.fs", version : "701.0");
import(path : "onshape/std/containers.fs", version : "701.0");
import(path : "onshape/std/evaluate.fs", version : "701.0");
import(path : "onshape/std/feature.fs", version : "701.0");
import(path : "onshape/std/holeAttribute.fs", version : "701.0");
import(path : "onshape/std/patternCommon.fs", version : "701.0");
import(path : "onshape/std/topologyUtils.fs", version : "701.0");
import(path : "onshape/std/sheetMetalAttribute.fs", version : "701.0");
import(path : "onshape/std/sheetMetalUtils.fs", version : "701.0");

/**
 * @internal
 * Apply pattern to sheet metal entities.
 */
export const sheetMetalGeometryPattern = defineSheetMetalFeature(function(context is Context, id is Id, definition is map)
    {
        const topLevelId = definition.topLevelId;

        var definitionFaces;
        if (isPartPattern(definition.patternType))
        {
            var solidBodyInput = qBodyType(qEntityFilter(definition.entities, EntityType.BODY), BodyType.SOLID);
            if (size(evaluateQuery(context, definition.entities)) != size(evaluateQuery(context, solidBodyInput)))
            {
                throw "Entries should be solid bodies";
            }

            // Part pattern in sheet metal is executed as a face pattern of the walls corresponding to the selected part.
            // We cannot body pattern the entire underlying sheet body because the selected part may only correspond to
            // a subset of the walls of the sheet body. This happens when the sheet metal has a rip or rips that leave the
            // underlying sheet body as one body, but builds out as multiple thickened sheet metal parts.
            definitionFaces = getSMDefinitionEntities(context, qOwnedByBody(definition.entities), EntityType.FACE);
        }
        else if (isFacePattern(definition.patternType))
        {
            // Short-circuit wall pattern
            throw regenError(ErrorStringEnum.SHEET_METAL_PARTS_PROHIBITED);

            definitionFaces = getSMDefinitionEntities(context, definition.entities);
            if (size(definitionFaces) !=
                    size(evaluateQuery(context, qEntityFilter(qUnion(definitionFaces), EntityType.FACE))))
            {
                throw "Entries should be sheet metal walls";
            }
        }
        else
        {
            throw regenError(ErrorStringEnum.SHEET_METAL_NO_FEATURE_PATTERN, ["patternType"]);
        }
        const definitionFacesQ = qUnion(definitionFaces);

        var modelIdToModelAndFaces = groupFacesByModelAttribute(context, definitionFaces);

        var attributeIdCounter = new box(0);
        var modifiedEntities = [];
        var deletedAttributes = [];
        for (var modelIdToModelAndFacesPair in modelIdToModelAndFaces)
        {
            // Pattern the faces of the given model
            const modelAttribute = modelIdToModelAndFacesPair.value.modelAttribute;
            const patternModelId = id + modelIdToModelAndFacesPair.key;
            const faces = qUnion(modelIdToModelAndFacesPair.value.faces);
            const patternResult = patternFacesForModel(context, topLevelId, patternModelId, definition, modelAttribute,
                    faces, attributeIdCounter);

            // Store the results for later use
            modifiedEntities = append(modifiedEntities, patternResult.modifiedEntities);
            deletedAttributes = concatenateArrays([deletedAttributes, patternResult.deletedAttributes]);
        }
        modifiedEntities = qUnion(modifiedEntities);

        // Build out final sheet metal
        try(updateSheetMetalGeometry(context, id + "smUpdate", {
                    "entities" : modifiedEntities,
                    "deletedAttributes" : deletedAttributes
                }));
        processSubfeatureStatus(context, topLevelId, {"subfeatureId" : id + "smUpdate", "propagateErrorDisplay" : true});
    }, {});

/**
 * Return a map from model id to a map of  {
 *         "modelAttribute" : the model attribute corresponding to the model
 *         "faces" : an array of the subset of input faces which belong to the model
 * }
 */
function groupFacesByModelAttribute(context is Context, faces is array) returns map
{
    var modelIdToModelAndFaces = {};
    for (var face in faces)
    {
        const modelAttribute = try(getSmObjectTypeAttributes(context, qOwnerBody(face), SMObjectType.MODEL)[0]);
        if (modelAttribute == undefined)
            throw "Sheet metal face owner body should have an associated model attribute";
        const modelId = modelAttribute.attributeId;
        if (modelIdToModelAndFaces[modelId] == undefined)
            modelIdToModelAndFaces[modelId] = { "modelAttribute" : modelAttribute, "faces" : [face] };
        else
            modelIdToModelAndFaces[modelId].faces = append(modelIdToModelAndFaces[modelId].faces, face);
    }
    return modelIdToModelAndFaces;
}

/**
 * Create an array of maps containing a tracking query and hole attribute for each entity of `definitionTopology` which
 * has a hole attribute.
 */
function createHoleTrackingAndAttribute(context is Context, definitionTopology is Query) returns array
{
    var holeTrackingAndAttribute = [];
    const holeCandidates = qEntityFilter(definitionTopology, EntityType.EDGE);
    for (var entity in evaluateQuery(context, holeCandidates))
    {
        const attributes = getHoleAttributes(context, entity);
        if (size(attributes) != 0)
        {
            const attribute = attributes[0];
            holeTrackingAndAttribute = append(holeTrackingAndAttribute, {
                        "tracking" : startTracking(context, entity),
                        "attribute" : attribute
                    });
        }
    }
    return holeTrackingAndAttribute;
}

/**
 * Reapply hole attributes to patterned sheet metal entities.
 */
function reapplyHoleAttributes(context is Context, topLevelId is Id, holeTrackingAndAttribute is array, attributeIdCounter is box)
{
    for (var trackingAndAttribute in holeTrackingAndAttribute)
    {
        var newEdges = evaluateQuery(context, trackingAndAttribute.tracking);
        var attribute = trackingAndAttribute.attribute;
        for (var newEdge in newEdges)
        {
            attribute.attributeId = toAttributeId(topLevelId + attributeIdCounter[]);
            attributeIdCounter[] += 1;
            setAttribute(context, { "entities" : newEdge, "attribute" : attribute });
        }
    }
}

/**
 * Create an array of maps containing a tracking query and `objectType` attribute for each entity of `entities` which has an `objectType`
 * attribute. For CORNER objects, also returns the result of `evCornerType`. If `required` is set to `true`, enforce that
 * every entity of `entities` must have an `objectType` attribute.
 */
function createSMTrackingAndAttribute(context is Context, entities is Query, objectType is SMObjectType, required is boolean) returns array
{
    var smTrackingAndAttribute = [];
    for (var entity in evaluateQuery(context, entities))
    {
        const attributes = getSmObjectTypeAttributes(context, entity, objectType);
        if (size(attributes) != 0)
        {
            var attribute = attributes[0];
            if (objectType != SMObjectType.MODEL)
            {
                // Remove controllingFeatureId and parameterIdInFeature from the source attribute (making sure to apply
                // the adjusted attribute to the original `entity`), and store the adjusted attribute.
                attribute = sanitizeControllingInformation(context, attribute, true);
            }
            // Store the original corner type for corner attributes
            var cornerType = undefined;
            if (objectType == SMObjectType.CORNER)
            {
                cornerType = evCornerType(context, { "vertex" : entity }).cornerType;
            }

            smTrackingAndAttribute = append(smTrackingAndAttribute, {
                        "tracking" : startTracking(context, entity),
                        "attribute" : attribute,
                        "cornerType" : cornerType
                    });
        }
        else if (required)
        {
            throw "Supplied entities should have an " ~ objectType ~ " attribute.";
        }
    }
    return smTrackingAndAttribute;
}

/**
 * Use createSMTrackingAndAttribute to create a master map of SMObjectType -> smTrackingAndAttribute array for applicable
 * SMObjectTypes.
 */
function createSMTrackingAndAttributeByType(context is Context, definitionTopology is Query) returns map
{
    var smTrackingAndAttributeByType = {};
    smTrackingAndAttributeByType[SMObjectType.WALL] =
        createSMTrackingAndAttribute(context, qEntityFilter(definitionTopology, EntityType.FACE), SMObjectType.WALL, true);
    smTrackingAndAttributeByType[SMObjectType.JOINT] =
        createSMTrackingAndAttribute(context, qEntityFilter(definitionTopology, EntityType.EDGE), SMObjectType.JOINT, false);
    smTrackingAndAttributeByType[SMObjectType.CORNER] =
        createSMTrackingAndAttribute(context, qEntityFilter(definitionTopology, EntityType.VERTEX), SMObjectType.CORNER, false);

    return smTrackingAndAttributeByType;
}

/**
 * Reapply wall attributes to patterned sheet metal faces.  Return `oldWallIdToNewWallIdsByBody`: a mapping from
 * old wall ids -> body -> a set of new wall ids for all old wall ids that appear in a corner break attribute (used in
 * reapplyCornerAttributes)
 *
 * Should be called after sheet boolean for oldWallIdToNewWallIdsByBody to be correct.
 */
function reapplyWallAttributes(context is Context, topLevelId is Id, smTrackingAndAttributeByType is map, attributeIdCounter is box) returns map
{
    // Collect wallIds present in a corner break attributes.
    var oldWallIdToNewWallIdsByBody = {};
    for (var trackingAndAttribute in smTrackingAndAttributeByType[SMObjectType.CORNER])
    {
        const attribute = trackingAndAttribute.attribute;
        if (attribute.cornerBreaks != undefined)
        {
            for (var cornerBreak in attribute.cornerBreaks)
            {
                oldWallIdToNewWallIdsByBody[cornerBreak.value.wallId] = {};
            }
        }
    }

    // Apply wall attributes to patterned faces and augment oldWallIdToNewWallIdsByBody
    for (var trackingAndAttribute in smTrackingAndAttributeByType[SMObjectType.WALL])
    {
        // Filter the tracking query, otherwise the tracking query will also resolve to the extracted bodies
        var newFaces = evaluateQuery(context, qEntityFilter(trackingAndAttribute.tracking, EntityType.FACE));
        var attribute = trackingAndAttribute.attribute;
        const oldWallId = attribute.attributeId;
        for (var newFace in newFaces)
        {
            var newWallId;
            const existingWallAttribute = getWallAttribute(context, newFace);
            if (existingWallAttribute != undefined)
            {
                // If patterned face attaches back to sheet metal model, there will already be a wall attribute. Patterned
                // wall could have attached to any face of the sheet metal model; newWallId is not necessarily the same
                // as oldWallId.
                newWallId = existingWallAttribute.attributeId;
            }
            else
            {
                newWallId = toAttributeId(topLevelId + attributeIdCounter[]);
                attributeIdCounter[] += 1;

                // Apply new wall id
                attribute.attributeId = newWallId;
                setAttribute(context, { "entities" : newFace, "attribute" : attribute });
            }

            // Fill mapping from old wall ids to new wall ids if this wallId is required for corner break
            if (oldWallIdToNewWallIdsByBody[oldWallId] != undefined)
            {
                var body = evaluateQuery(context, qOwnerBody(newFace))[0];
                if (oldWallIdToNewWallIdsByBody[oldWallId][body] == undefined)
                    oldWallIdToNewWallIdsByBody[oldWallId][body] = {};
                oldWallIdToNewWallIdsByBody[oldWallId][body][newWallId] = true;
            }
        }
    }

    return oldWallIdToNewWallIdsByBody;
}

/**
 * Reapply joint attributes to patterned sheet metal edges.
 *
 * Should be called before sheet boolean so that the bend along a patterned edge is only given one bend attribute.
 * TODO: Investigate whether we should do this after the boolean and be smart about cases where we need one bend
 *       attribute or many.
 */
function reapplyJointAttributes(context is Context, topLevelId is Id, smTrackingAndAttributeByType is map, attributeIdCounter is box)
{
    for (var trackingAndAttribute in smTrackingAndAttributeByType[SMObjectType.JOINT])
    {
        var newEdges = evaluateQuery(context, trackingAndAttribute.tracking);
        var attribute = trackingAndAttribute.attribute;
        for (var newEdge in newEdges)
        {
            attribute.attributeId = toAttributeId(topLevelId + attributeIdCounter[]);
            attributeIdCounter[] += 1;
            setAttribute(context, { "entities" : newEdge, "attribute" : attribute });
        }
    }
}

/**
 * Find the new wallId from oldWallIdToNewWallIdsByBody given the old wall id, the body, and the surrounding wall ids of a vertex
 */
function mapToNewWallId(context is Context, oldWallId is string, body is Query, surroundingWallIds is array,
        oldWallIdToNewWallIdsByBody is map)
{
    if (oldWallIdToNewWallIdsByBody[oldWallId][body] != undefined)
    {
        for (var wallId in surroundingWallIds)
        {
            // Take the first matched wall id. This is deterministic from the evaluation of qVertexAdjacent
            if (oldWallIdToNewWallIdsByBody[oldWallId][body][wallId] != undefined)
            {
                return wallId;
            }
        }
    }
    return undefined;
}

/**
 * Create a set of corner breaks for the specified vertex based on the corner breaks of the seed vertex (if any) and the
 * breaks already existing on the vertex (if the patterned vertex is being merged into an existing vertex with corner
 * breaks).
 */
function adjustCornerBreaks(context is Context, vertex is Query, originalCornerBreaks, existingCornerBreaks,
        oldWallIdToNewWallIdsByBody is map) returns map
{
    var madeChanges = false;
    var adjustedCornerBreaks = [];
    var existingWallIds = {};
    if (existingCornerBreaks != undefined)
    {
        adjustedCornerBreaks = existingCornerBreaks;
        for (var cornerBreak in existingCornerBreaks)
        {
            existingWallIds[cornerBreak.value.wallId] = true;
        }
    }

    // Remap original corner breaks into adjustedCornerBreaks
    if (originalCornerBreaks != undefined)
    {
        var body = evaluateQuery(context, qOwnerBody(vertex))[0];
        const surroundingWalls = evaluateQuery(context, qVertexAdjacent(vertex, EntityType.FACE));
        const surroundingWallIds = mapArray(surroundingWalls, function(wall) {
                    return getWallAttribute(context, wall).attributeId;
                });
        for (var originalCornerBreak in originalCornerBreaks)
        {
            // Only remap corner breaks onto walls that were created or altered by this pattern
            const adjustedWallId = mapToNewWallId(context, originalCornerBreak.value.wallId, body, surroundingWallIds,
                    oldWallIdToNewWallIdsByBody);
            if (adjustedWallId != undefined && existingWallIds[adjustedWallId] == undefined)
            {
                var adjustedCornerBreak = originalCornerBreak;
                adjustedCornerBreak.value.wallId = adjustedWallId;
                adjustedCornerBreaks = append(adjustedCornerBreaks, adjustedCornerBreak);
                existingWallIds[adjustedWallId] = true;
                madeChanges = true;
            }
        }
    }

    return {
            "cornerBreaks" : adjustedCornerBreaks,
            "madeChanges" : madeChanges
    };
}

/**
 * Adjust a corner attribute from the seed vertex to fit the patterned vertex.  Apply the attribute if necessary.
 */
function adjustAndApplyCornerAttribute(context is Context, topLevelId is Id, originalAttribute is SMAttribute,
        originalCornerType is SMCornerType, newVertex is Query, oldWallIdToNewWallIdsByBody is map, attributeIdCounter is box)
{
    var newAttribute = {};
    var applyAttribute = false;

    const existingAttribute = getCornerAttribute(context, newVertex);

    // Apply corner overrides if corner matches original corner
    const cornerType = evCornerType(context, { "vertex" : newVertex }).cornerType;
    if (cornerType != SMCornerType.NOT_A_CORNER && cornerType == originalCornerType)
    {
        // Null out unrelated info.  It would be harder to grab a positive copy of the corner override info because it
        // can manifest as a number of different fields depending on what type of override is present.
        var attributeCopy = originalAttribute;
        attributeCopy.attributeId = undefined;
        attributeCopy.objectType = undefined;
        attributeCopy.cornerBreaks = undefined;

        newAttribute = mergeMaps(attributeCopy, newAttribute);
        applyAttribute = true;
    }
    else if (existingAttribute != undefined && existingAttribute.cornerStyle != undefined)
    {
        // If there was an existing corner override and we can't take corner override from the patterned attribute,
        // remove the existing override and return to default corner geometry.
        applyAttribute = true;
        // TODO: check if the existing override is still valid, and keep it if it is
    }

    // Decide what corner breaks the new attribute needs
    const existingCornerBreaks = existingAttribute == undefined ? undefined : existingAttribute.cornerBreaks;
    const cornerBreakReturn = adjustCornerBreaks(context, newVertex, originalAttribute.cornerBreaks, existingCornerBreaks,
            oldWallIdToNewWallIdsByBody);
    if (size(cornerBreakReturn.cornerBreaks) > 0)
    {
        newAttribute.cornerBreaks = cornerBreakReturn.cornerBreaks;
    }
    applyAttribute = applyAttribute || cornerBreakReturn.madeChanges;

    // Only apply attribute if it has content
    if (applyAttribute)
    {
        // We found an existing corner override, and the corner override from the pattern could not be applied, and
        // there are no corner breaks
        if (size(newAttribute) == 0)
        {
            removeAttributes(context, { "entities" : newVertex, "attributePattern" : existingAttribute });
        }
        else
        {
            newAttribute.objectType = SMObjectType.CORNER;
            newAttribute.attributeId = toAttributeId(topLevelId + attributeIdCounter[]);
            attributeIdCounter[] += 1;
            if (existingAttribute != undefined)
            {
                replaceSMAttribute(context, existingAttribute, newAttribute as SMAttribute);
            }
            else
            {
                setAttribute(context, { "entities" : newVertex, "attribute" : newAttribute as SMAttribute });
            }
        }
    }
}

/**
 * Reapply corner attributes to patterned sheet metal vertices. Must be done after applying model attributes to bodies
 * and calling fixJointAttributes or classifying corner types will fail.
 * oldWallIdToNewWallIdsByBody is calculated during reapplyWallAttributes.
 */
function reapplyCornerAttributes(context is Context, topLevelId is Id, smTrackingAndAttributeByType is map,
        oldWallIdToNewWallIdsByBody is map, attributeIdCounter is box)
{
    for (var trackingAndAttribute in smTrackingAndAttributeByType[SMObjectType.CORNER])
    {
        const originalAttribute = trackingAndAttribute.attribute;
        var newVertices = evaluateQuery(context, trackingAndAttribute.tracking);
        for (var newVertex in newVertices)
        {
            adjustAndApplyCornerAttribute(context, topLevelId, trackingAndAttribute.attribute,
                    trackingAndAttribute.cornerType, newVertex, oldWallIdToNewWallIdsByBody, attributeIdCounter);
        }
    }
}

/**
 * Pattern the faces of one sheet metal model.  Return a map containing modified entities and deleted attributes.
 */
function patternFacesForModel(context is Context, topLevelId is Id, id is Id, definition is map,
        modelAttribute is SMAttribute, faces is Query, attributeIdCounter is box) returns map
{
    const modelId = modelAttribute.attributeId;
    var allBodiesOfModel = qAttributeQuery(asSMAttribute({
                "objectType" : SMObjectType.MODEL,
                "attributeId" : modelId
            }));

    const originalEntities = evaluateQuery(context, qOwnedByBody(allBodiesOfModel));
    const initialAssociationAttributes = getAttributes(context, {
                "entities" : qUnion(originalEntities),
                "attributePattern" : {} as SMAssociationAttribute });

    // Collect attributes preset on the underlying sheet bodies of the seeds
    const facesAndSurrounding = qUnion([
                faces,                                    // Faces
                qEdgeAdjacent(faces, EntityType.EDGE),    // Edges
                qVertexAdjacent(faces, EntityType.VERTEX) // Vertices
            ]);
    const smTrackingAndAttributeByType = createSMTrackingAndAttributeByType(context, facesAndSurrounding);
    const holeTrackingAndAttribute = createHoleTrackingAndAttribute(context, facesAndSurrounding);

    // Extracted the selected faces into isolated sheet bodies. Connected selected faces will stay connected as a single
    // body with multiple faces.
    const extractId = id + "extractFaces";
    opExtractSurface(context, extractId, { "faces" : faces });

    // Pattern the sheet bodies
    var definitionForOp = definition;
    definitionForOp.entities = qCreatedBy(extractId, EntityType.BODY);
    const isMirror = (definition.patternType == MirrorType.FACE) || (definition.patternType == MirrorType.PART);
    definitionForOp.patternType = isMirror ? MirrorType.PART : PatternType.PART;
    const patternId = id + "pattern";
    opPattern(context, patternId, definitionForOp);
    const createdBodies = qCreatedBy(patternId, EntityType.BODY);

    // Delete the seed extracted body
    opDeleteBodies(context, id + "deleteBodies", { "entities" : qCreatedBy(extractId, EntityType.BODY)});

    // Assign necessary attributes for created sheets to be built out as sheet metal
    // Assign these attributes before the patterned bodies are booleaned back onto owner sheet model
    reapplyJointAttributes(context, topLevelId, smTrackingAndAttributeByType, attributeIdCounter);
    reapplyHoleAttributes(context, topLevelId, holeTrackingAndAttribute, attributeIdCounter);

    // Apply booleans based on options set in the definition.
    // Face patterns should always boolean, user has control of part pattern boolean.
    booleanSMBodiesIfNecessary(context, topLevelId, id + "boolean", createdBodies, allBodiesOfModel, definition);

    // Apply model attribute to bodies that did not manage to boolean
    if (size(evaluateQuery(context, createdBodies)) > 0)
    {
        setAttribute(context, { "entities" : createdBodies, "attribute" : modelAttribute });
        allBodiesOfModel = qUnion([allBodiesOfModel, createdBodies]);
    }

    // Assign association attributes and gather modified entities
    const toUpdate = assignSMAttributesToNewOrSplitEntities(context, allBodiesOfModel, originalEntities, initialAssociationAttributes);

    fixJointAttributes(context, id, qEntityFilter(toUpdate.modifiedEntities, EntityType.EDGE), attributeIdCounter);

    // Wall attributes and corner attributes mut be applied after booleaning bodies, applying model attributes and
    // fixing joint attributes.  See function headers for details.
    const oldWallIdToNewWallIdsByBody = reapplyWallAttributes(context, topLevelId, smTrackingAndAttributeByType, attributeIdCounter);
    reapplyCornerAttributes(context, topLevelId, smTrackingAndAttributeByType, oldWallIdToNewWallIdsByBody, attributeIdCounter);

    return {
        "modifiedEntities" : toUpdate.modifiedEntities,
        "deletedAttributes" : toUpdate.deletedAttributes
    };
}

/**
 * Boolean bodies onto master sheet body if necessary
 */
function booleanSMBodiesIfNecessary(context is Context, topLevelId is Id, id is Id, bodiesToAttach is Query,
        allBodiesOfModel is Query, definition is map)
{
    var needsBoolean = false;
    var booleanScope;
    if (isFacePattern(definition.patternType))
    {
        // Always attempt to boolean the face pattern
        needsBoolean = true;
        booleanScope = allBodiesOfModel;
    }
    else if (isPartPattern(definition.patternType))
    {
        // NEW will continue with needsBoolean = false
        // ADD should boolean as appropriate
        // REMOVE and INTERSECT should fail
        if (definition.operationType == NewBodyOperationType.ADD)
        {
            needsBoolean = true;
            if (definition.defaultScope)
            {
                booleanScope = allBodiesOfModel;
            }
            else
            {
                if (size(evaluateQuery(context, definition.booleanScope)) == 0)
                {
                    setErrorEntities(context, topLevelId, { "entities" : bodiesToAttach });
                    throw regenError(ErrorStringEnum.BOOLEAN_NEED_ONE_SOLID, ["booleanScope"]);
                }
                if (queryContainsNonSheetMetal(context, definition.booleanScope))
                {
                    var nonSheetMetal = separateSheetMetalQueries(context, definition.booleanScope).nonSheetMetalQueries;
                    setErrorEntities(context, topLevelId, { "entities" : qUnion([bodiesToAttach, nonSheetMetal]) });
                    throw regenError(ErrorStringEnum.SHEET_METAL_ADD_WRONG_MODEL, ["booleanScope"]);
                }
                var booleanScopeArr = getSMDefinitionEntities(context, definition.booleanScope);
                booleanScope = qUnion(booleanScopeArr);
                var scopeFromCorrectModel = qIntersection([booleanScope, allBodiesOfModel]);
                if (size(booleanScopeArr) != size(evaluateQuery(context, scopeFromCorrectModel)))
                {
                    var scopeFromIncorrectModel = qSubtraction(booleanScope, scopeFromCorrectModel);
                    setErrorEntities(context, topLevelId, { "entities" : qUnion([bodiesToAttach, scopeFromIncorrectModel]) });
                    throw regenError(ErrorStringEnum.SHEET_METAL_ADD_WRONG_MODEL, ["booleanScope"]);
                }
            }
        }
        else if (definition.operationType == NewBodyOperationType.REMOVE || definition.operationType == NewBodyOperationType.INTERSECT)
        {
             setErrorEntities(context, topLevelId, { "entities" : bodiesToAttach });
             throw regenError(ErrorStringEnum.SHEET_METAL_PATTERN_DISABLED_BOOLEANS, ["entities", "operationType"]);
        }
    }

    if (needsBoolean)
    {
        // Boolean patterned sheet bodies back onto master body
        try
        {
            opBoolean(context, id, {
                        "tools" : bodiesToAttach,
                        "targets" : booleanScope,
                        "targetsAndToolsNeedGrouping" : true,
                        "operationType" : BooleanOperationType.UNION,
                        "allowSheets" : true
                    });
        }
        catch (error)
        {
            // Error entities will show boolean bodies and error edges.
            setErrorEntities(context, topLevelId, { "entities" : bodiesToAttach });
            processSubfeatureStatus(context, topLevelId, {"subfeatureId" : id, "propagateErrorDisplay" : true});
            throw error;
        }
    }
}

/**
 * Remove any inappropriate joint attributes
 * Add rip attributes to blank two sided edges
 */
function fixJointAttributes(context is Context, topLevelId is Id, edges is Query, attributeIdCounter is box)
{
    for (var edge in evaluateQuery(context, edges))
    {
        const attribute = getJointAttribute(context, edge);
        var hasAttribute = (attribute != undefined);

        if (hasAttribute && !isEntityAppropriateForAttribute(context, edge, attribute))
        {
            // We do not need to log these removals as deletedAttributes in updateSheetMetalGeometry(...) because any
            // attributes we find and delete here are just patterned copied attributes that have not been logged with
            // a previous updateSheetMetalGeometry(...)
            removeAttributes(context, { "entities" : edge, "attributePattern" : attribute });
            hasAttribute = false;
        }
        if (!hasAttribute && edgeIsTwoSided(context, edge))
        {
            const newRip = createRipAttribute(context, edge, toAttributeId(topLevelId + attributeIdCounter[]), SMJointStyle.EDGE, {});
            if (isEntityAppropriateForAttribute(context, edge, newRip))
            {
                setAttribute(context, {
                            "entities" : edge,
                            "attribute" : newRip
                        });
                attributeIdCounter[] += 1;
            }
        }
    }
}