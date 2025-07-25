FeatureScript 2716; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present PTC Inc.

export import(path: "onshape/std/patternCommon.fs", version : "2716.0");

// Most patterns use these
export import(path : "onshape/std/boolean.fs", version : "2716.0");
export import(path : "onshape/std/containers.fs", version : "2716.0");
export import(path : "onshape/std/evaluate.fs", version : "2716.0");
export import(path : "onshape/std/feature.fs", version : "2716.0");
export import(path : "onshape/std/featureList.fs", version : "2716.0");
export import(path : "onshape/std/valueBounds.fs", version : "2716.0");

import(path : "onshape/std/formedUtils.fs", version : "2716.0");
import(path : "onshape/std/mathUtils.fs", version : "2716.0");
import(path : "onshape/std/sheetMetalPattern.fs", version : "2716.0");
import(path : "onshape/std/sheetMetalUtils.fs", version : "2716.0");
import(path : "onshape/std/topologyUtils.fs", version : "2716.0");

/** @internal */
export const PATTERN_OFFSET_BOUND = NONNEGATIVE_ZERO_INCLUSIVE_LENGTH_BOUNDS;

/** @internal */
export type PatternTransforms typecheck canBePatternTransforms;
/** @internal */
export predicate canBePatternTransforms(value)
{
    value is map;
    value.transforms is array;
    for (var transform in value.transforms)
    {
        transform is Transform;
    }
    value.instanceNames is array;
    for (var name in value.instanceNames)
    {
        name is string;
    }
    value.manipulatorPoints is array;
    for (var point in value.manipulatorPoints)
    {
        is3dLengthVector(point);
    }
}

/**
 * @internal
 * Predicate which is used by the 3 types of pattern features to specify the pattern type,
 * and further selection of the thing to operate on based on the pattern type chosen.
 *
 * @param definition : @autocomplete `definition`
 */
export predicate patternTypePredicate(definition is map)
{
    annotation { "Name" : "Pattern type" }
    definition.patternType is PatternType;

    if (definition.patternType == PatternType.PART)
    {
        booleanStepTypePredicate(definition);

        annotation { "Name" : "Entities to pattern", "Filter" : (EntityType.BODY || (BodyType.MATE_CONNECTOR && InContextObject.NO))
         && AllowMeshGeometry.YES && SketchObject.NO,
            "UIHint" : UIHint.PREVENT_CREATING_NEW_MATE_CONNECTORS }
        definition.entities is Query;
    }
    else if (definition.patternType == PatternType.FACE)
    {
        annotation { "Name" : "Faces to pattern",
                     "UIHint" : ["ALLOW_FEATURE_SELECTION", "SHOW_CREATE_SELECTION"],
                     "Filter" : EntityType.FACE && ConstructionObject.NO && SketchObject.NO && ModifiableEntityOnly.YES }
        definition.faces is Query;
    }
    else if (definition.patternType == PatternType.FEATURE)
    {
        annotation { "Name" : "Features to pattern" }
        definition.instanceFunction is FeatureList;
    }
}

/**
 * @internal
 * Preprocess the entities and instance function for pattern
 */
export function adjustPatternDefinitionEntities(context is Context, definition is map, isMirror is boolean) returns map
{
    if (isFacePattern(definition.patternType))
        definition.entities = definition.faces;
    else if (isFeaturePattern(definition.patternType) && isAtVersionOrLater(context, FeatureScriptVersionNumber.V666_FEATURE_PATTERN_ENTITIES))
        definition.entities = qNothing();

    checkPatternInput(context, definition, isMirror);

    return definition;
}

/**
 * @internal
 * Return center point of starting entities to compute initial manipulator point position
 */
export function getStartPoint(context is Context, startingEntities is Query) returns Vector
{
    const entityBox = evBox3d(context, {
                "topology" : startingEntities
            });

    return box3dCenter(entityBox);
}

/**
 * @internal
 * Return correct set of entities to compute initial manipulator point position
 */
export function getReferencesForStartPoint(definition is map) returns Query
{
    if (isFacePattern(definition.patternType))  //added just to safeguard against someone not calling adjustPatternDefinitionEntities before this
        return definition.faces;
    else if (isFeaturePattern(definition.patternType))
    {
        const nonSketchObjects = qSketchFilter(qUnion([qCreatedBy(definition.instanceFunction, EntityType.BODY), qCreatedBy(definition.instanceFunction, EntityType.FACE)]), SketchObject.NO);
        const sketchEdges = qSketchFilter(qCreatedBy(definition.instanceFunction, EntityType.EDGE), SketchObject.YES);
        const sketchImprints = qUnion(mapArray(keys(definition.instanceFunction), id => qCreatedBy(id + "imprint")));

        return qSheetMetalFormFilter(qUnion([nonSketchObjects, qSubtraction(sketchEdges, sketchImprints)]), SMFormType.NO);
    }
    else return definition.entities;
}

/**
 * @internal
 * Return correct set of entities to compute remainder transform
 */
export function getReferencesForRemainderTransform(definition is map) returns Query
{
    if (isFacePattern(definition.patternType))  //added just to safeguard against someone not calling adjustPatternDefinitionEntities before this
        return definition.faces;
    else if (isFeaturePattern(definition.patternType) && !definition.fullFeaturePattern)
        return qCreatedBy(definition.instanceFunction);
    else return definition.entities;
}

/**
 * @internal
 * TODO: Is this worth exposing?
 */
export function computePatternOffset(context is Context, entity is Query, oppositeDir is boolean, distance is ValueWithUnits,
    withTransform is boolean, remainingTransform is Transform) returns map
{
    if (oppositeDir)
        distance = -distance;

    var direction = extractDirection(context, entity);
    if (direction == undefined)
        throw "Offset direction could not be computed";
    var offset = direction * distance;

    if (withTransform)
    {
        var remainingTransformForAxis = getRemainderPatternTransform(context, { "references" : entity });
        return { "offset" : (inverse(remainingTransform) * remainingTransformForAxis).linear * offset };
    }
    return { "offset" : offset };
}

/**
 * @internal
 * TODO: Is this worth exposing?
 */
export function computePatternAxis(context is Context, axisQuery is Query, withTransform is boolean, remainingTransform is Transform)
{
    const rawDirectionResult = try(evAxis(context, { "axis" : axisQuery }));
    if (rawDirectionResult != undefined && withTransform)
    {
        var remainingTransformForAxis = getRemainderPatternTransform(context, { "references" : axisQuery });
        return inverse(remainingTransform) * remainingTransformForAxis * rawDirectionResult;
    }
    else
        return rawDirectionResult;
}

/** @internal */
export function verifyPatternSize(context is Context, id is Id, instances is number)
{
    if (instances <= 2500)
        return; //Fine
    throw regenError(ErrorStringEnum.PATTERN_INPUT_TOO_MANY_INSTANCES);
}

/** @internal */
function checkPatternInput(context is Context, definition is map, isMirror is boolean)
{
    if (isFeaturePattern(definition.patternType))
    {
        if (size(definition.instanceFunction) == 0)
            throw regenError(isMirror ? ErrorStringEnum.MIRROR_SELECT_FEATURES : ErrorStringEnum.PATTERN_SELECT_FEATURES, ["instanceFunction"]);
    }
    else if (isQueryEmpty(context, definition.entities))
    {
        if (isFacePattern(definition.patternType))
            throw regenError(isMirror ? ErrorStringEnum.MIRROR_SELECT_FACES : ErrorStringEnum.PATTERN_SELECT_FACES, ["faces"]);
        else
            throw regenError(isMirror ? ErrorStringEnum.MIRROR_SELECT_PARTS : ErrorStringEnum.PATTERN_SELECT_PARTS, ["entities"]);
    }
}

/** @internal */
function processPatternBooleansIfNeededPreV1215(context is Context, id is Id, definition is map)
{
    if (isPartPattern(definition.patternType))
    {
        const reconstructOp = id => opPattern(context, id, definition);
        if (definition.operationType == NewBodyOperationType.ADD)
        {
            if (isAtVersionOrLater(context, FeatureScriptVersionNumber.V1204_FIX_BOOLEAN_PATTERN_OF_ONE))
            {
                if (!isQueryEmpty(context, qModifiableSurface(qUnion([definition.seed, qCreatedBy(id)]))))
                {
                    definition.defaultSurfaceScope = definition.defaultScope;
                    definition.booleanSurfaceScope = definition.booleanScope;
                    joinSurfaceBodiesWithAutoMatching(context, id, definition, false, reconstructOp);
                    // Pattern may have only one instance.
                    if (isQueryEmpty(context, qBodyType(qEntityFilter(definition.seed, EntityType.BODY), BodyType.SOLID)))
                    {
                       return;
                    }
                 }
            }
            else if (undefined != definition.surfaceJoinMatches && size(definition.surfaceJoinMatches) > 0)
            {
                joinSurfaceBodies(context, id, definition.surfaceJoinMatches, false, reconstructOp);
                if (isQueryEmpty(context, qBodyType(qCreatedBy(id, EntityType.BODY), BodyType.SOLID)))
                {
                    return;
                }
            }

        }
        processNewBodyIfNeeded(context, id, definition, reconstructOp);
    }
}

/** @internal */
export function processPatternBooleansIfNeeded(context is Context, id is Id, definition is map)
{
    if (!isAtVersionOrLater(context, FeatureScriptVersionNumber.V1215_BOOLEANS_OF_SURFACES))
    {
        processPatternBooleansIfNeededPreV1215(context, id, definition);
        return;
    }

    if (isPartPattern(definition.patternType))
    {
        if (definition.operationType == NewBodyOperationType.NEW)
        {
            return;
        }

        if (definition.operationType == NewBodyOperationType.REMOVE || definition.operationType == NewBodyOperationType.INTERSECT)
        {
            const qSurfaces = qModifiableSurface(qCreatedBy(id)); // No seed in mirror; BEL-131318
            if (!isQueryEmpty(context, qSurfaces))
            {
                throw regenError(ErrorStringEnum.SURFACES_NOT_SUPPORTED_BY_PATTERN_REMOVE_AND_INTERSECT, qSurfaces);
            }
        }

        const reconstructOp = id => opPattern(context, id, definition);

        // Seed is undefined in mirror unless operation is ADD. UX is thinking if this needs to change.
        const decomposedSeed = definition.seed == undefined ? qNothing() :
                qUnion([definition.seed, qContainedInCompositeParts(qBodyType(definition.seed, BodyType.COMPOSITE))]);

        if (definition.operationType == NewBodyOperationType.ADD)
        {
            const patternSurfaces = qModifiableSurface(qUnion([decomposedSeed, qCreatedBy(id)]));
            if (!isQueryEmpty(context, patternSurfaces))
            {
                // preserve original definition
                var definitionSurface = mergeMaps(definition, { seed : qModifiableSurface(decomposedSeed) });
                definitionSurface.defaultSurfaceScope = definition.defaultScope == undefined ? false : definition.defaultScope;
                definitionSurface.booleanSurfaceScope = definition.booleanScope == undefined ? qNothing() : definition.booleanScope;
                joinSurfaceBodiesWithAutoMatching(context, id, definitionSurface, false, reconstructOp);
                const featureError = getFeatureError(context, id);
                if (featureError != undefined)
                {
                    throw regenError(featureError, patternSurfaces);
                }
            }
        }

        // opBoolean is potentially called twice. If any of these two return error then the overall feature will fail.
        // If there are not failures but info/warnings then warning will naturally win over info.
        // In case of a tie solid wins. Error graphics will show potentially both
        const seedSolids = qBodyType(qEntityFilter(decomposedSeed, EntityType.BODY), BodyType.SOLID);
        const newSolids = qBodyType(qEntityFilter(qCreatedBy(id), EntityType.BODY), BodyType.SOLID);
        if (!isQueryEmpty(context, qUnion([seedSolids, newSolids])))  // mirror has no seed
        {
            const solidBooleanScope = definition.booleanScope == undefined ? qNothing() :
                        qBodyType(qEntityFilter(definition.booleanScope, EntityType.BODY), BodyType.SOLID);
            const definitionSolid = mergeMaps(definition, { seed : seedSolids, booleanScope : solidBooleanScope });
            processNewBodyIfNeeded(context, id, definitionSolid, reconstructOp);
        }
    }
}

/**
 * Applies the body, face, or feature pattern, given just transforms and instance names
 * @param definition {{
 *      @field patternType {PatternType}
 *      @field entities {Query} : @requiredif{`patternType` is not `FEATURE`} The faces or parts to pattern.
 *      @field instanceFunction {FeatureList} : @requiredif{`patternType` is `FEATURE`} The features to pattern.
 *      @field transforms {array} : An `array` of [Transform]s in which to place
 *              new instances.
 *      @field instanceNames {array} : An `array` of the same size as
 *              `transforms` with a `string` for each transform, used in later
 *              features to identify the entities created.
 * }}
 */
export function applyPattern(context is Context, id is Id, definition is map, remainingTransform is Transform)
{
    if (!isFeaturePattern(definition.patternType))
    {
        if (isAtVersionOrLater(context, FeatureScriptVersionNumber.V693_SM_PATTERN))
        {
            sheetMetalAwareGeometryPattern(context, id, definition, remainingTransform, false);
        }
        else
        {
            geometryPattern(context, id, definition, remainingTransform);
        }
    }
    else
    {
        if (definition.fullFeaturePattern)
        {
            if (containsSketch(context, definition.instanceFunction))
            {
                reportFeatureInfo(context, id, definition.sketchPatternInfo);
            }
            // Make it an array of functions
            definition.instanceFunction = valuesSortedById(context, definition.instanceFunction);

            var featureSuccessCount = 0;
            for (var i = 0; i < size(definition.transforms); i += 1)
            {
                var instanceId = id + definition.instanceNames[i];
                setFeaturePatternInstanceData(context, instanceId, {"transform" : definition.transforms[i]});
                for (var func in definition.instanceFunction)
                {
                    try
                    {
                        func(instanceId);
                        featureSuccessCount += 1;
                    }
                    catch (e)
                    {
                        if (e is map && try silent(e.message as ErrorStringEnum) == ErrorStringEnum.SHEET_METAL_NO_FEATURE_PATTERN)
                        {
                            throw regenError(ErrorStringEnum.SHEET_METAL_NO_FEATURE_PATTERN, ["instanceFunction"]);
                        }

                        if (e is map && try silent(e.message as ErrorStringEnum) == ErrorStringEnum.DERIVED_NO_SAME_SOURCE)
                        {
                            throw regenError(ErrorStringEnum.DERIVED_FULL_FEATURE_PATTERN, ["instanceFunction"]);
                        }
                    }
                }
                unsetFeaturePatternInstanceData(context, instanceId);
            }

            if (featureSuccessCount == 0 && expectedToCreateGeometry(context, definition)) // TODO: better error
                throw regenError(ErrorStringEnum.PATTERN_FEATURE_FAILED, ["instanceFunction"]);
        }
        else
        {
            if (isQueryEmpty(context, qCreatedBy(definition.instanceFunction)))
            {
                throw regenError(ErrorStringEnum.PATTERN_NO_GEOM_FROM_FEATURES, ["instanceFunction"]);
            }

            try
            {
                doFacePatternBasedFeaturePattern(context, id, definition, remainingTransform);
            }
            catch(e)
            {
                if (definition.fullFeaturePattern || queryContainsActiveSheetMetal(context, qCreatedBy(definition.instanceFunction)) )
                    throw e;
                else
                    throw regenError(ErrorStringEnum.PATTERN_SWITCH_TO_PER_INSTANCE, ["fullFeaturePattern"]);
            }
        }
    }
}

function doFacePatternBasedFeaturePattern(context is Context, id is Id, definition is map, remainingTransform is Transform)
{
    //since we have a combination of face and part patterns below this is a safer way of applying remaining transform
    for (var i = 0; i < size(definition.transforms); i+= 1)
    {
        definition.transforms[i] *= remainingTransform;
    }

    //first gather bodies created
    const allBodies = qCreatedBy(definition.instanceFunction, EntityType.BODY);
    const allSheets = qBodyType(allBodies, BodyType.SHEET);
    const allSolids = qBodyType(allBodies, BodyType.SOLID);
    const allFormedArtifactBodies = allBodies->qSheetMetalFormFilter(SMFormType.YES);
    const allComposites = qBodyType(allBodies, BodyType.COMPOSITE);
    const allBodiesInComposites = qContainedInCompositeParts(allComposites);
    const allWiresPointsAndComposites = qSubtraction(allBodies, qUnion([allSolids, allSheets, allFormedArtifactBodies]));

    // handle sketch regions
    var toDelete = [];
    var sketchSheets = [];
    var originalSketchSheets = [];
    for (var idToFunction in definition.instanceFunction)
    {
        const potentialSketchRegions = evaluateQuery(context, qSketchRegion(idToFunction.key));
        if (size(potentialSketchRegions) > 0)
        {
            const result = getSketchSheetBodiesToPattern(context, id, idToFunction.key);
            if (result.isUpdated)
            {
                sketchSheets = concatenateArrays([sketchSheets, result.bodiesToPattern]);
                toDelete = concatenateArrays([toDelete, result.bodiesToPattern]);
                originalSketchSheets = concatenateArrays([originalSketchSheets, result.originalSketchSheets]);
            }
        }
    }

    //handle parts to pattern
    const separatedSolids = separateSheetMetalQueries(context, allSolids);
    var partsToPattern = qUnion([separatedSolids.sheetMetalQueries, allWiresPointsAndComposites, qUnion(sketchSheets)]);
    if (!isQueryEmpty(context, partsToPattern))
    {
        definition.entities = partsToPattern;
        definition.patternType = PatternType.PART;
        try(sheetMetalAwareGeometryPattern(context, id + "parts", definition, identityTransform(), true));
        //don't transfer status to support partial results
        @transferSubfeatureErrorDisplay(context, id, {"subfeatureId" : id + "parts"});
    }

    //handle faces to pattern
    const allCreatedFaces = qCreatedBy(definition.instanceFunction, EntityType.FACE);
    //skip faces from sheets, sheetMetalQueries, and constituents of composites already handled
    const allFacesToSkip = qOwnedByBody(qUnion([qUnion(originalSketchSheets), separatedSolids.sheetMetalQueries, allBodiesInComposites]), EntityType.FACE);
    const facesToPattern = qSubtraction(allCreatedFaces, allFacesToSkip);
    if (!isQueryEmpty(context, facesToPattern))
    {
        definition.entities = facesToPattern;
        //these two options are only used in sheetMetalGeometryPattern
        definition.patternType = PatternType.FACE;
        definition.filterVertices = true; // instead of erroring out filter the unnecessary selections
        try(sheetMetalAwareGeometryPattern(context, id + "faces", definition, identityTransform(), true));
        //don't transfer status to support partial results
        @transferSubfeatureErrorDisplay(context, id, {"subfeatureId" : id + "faces"});
    }

    // An error occurs if we're expecting to create something (instance count > 1) but get nothing.
    if (expectedToCreateGeometry(context, definition) && isQueryEmpty(context, qCreatedBy(id)))
    {
        throw regenError(ErrorStringEnum.PATTERN_FEATURE_FAILED, ["instanceFunction"]);
    }

    //Part of sketch region fix
    if (size(toDelete) > 0)
    {
        opDeleteBodies(context, id + "deleteBodies1", {
            "entities" : qUnion(toDelete)
        });
    }
}

/**
 * When we try to face pattern all faces created by sketches we pick up imprint faces as well. This is
 * a way to avoid patterning those faces
 */
function getSketchSheetBodiesToPattern(context is Context, id is Id, sketchId is Id)
{
    var result = { "bodiesToPattern" : [], "isUpdated" : false, "originalSketchSheets" : []};

    var allSketchSheets = qCreatedBy(sketchId + "imprint", EntityType.BODY);
    if (isQueryEmpty(context, allSketchSheets))
    {
        return result;
    }

    const allFacesCreated = qCreatedBy(sketchId + "imprint", EntityType.FACE);
    const facesToBeDeleted = qSubtraction(allFacesCreated, qSketchRegion(sketchId));
    if (isQueryEmpty(context, facesToBeDeleted))
    {
        return result;
    }

    const facesOnOwner = qOwnedByBody(qOwnerBody(facesToBeDeleted), EntityType.FACE);
    if (size(evaluateQuery(context, facesOnOwner)) == size(evaluateQuery(context, facesToBeDeleted)))
    {
        //if all faces of a sheet are to be deleted then skip copying it altogether  (BEL-94096)
        allSketchSheets = qSubtraction(allSketchSheets, qOwnerBody(facesToBeDeleted));
    }

    const trackedFaces =  startTracking(context, facesToBeDeleted);
    const copyId = id + "copiedSheets";
    opPattern(context, copyId, {
            "entities" : allSketchSheets,
            "transforms" : [identityTransform()],
            "instanceNames" : ["copy"]
    });

    const facesToDelete =  qIntersection([qCreatedBy(id  + "copiedSheets", EntityType.FACE), trackedFaces]);
    if (!isQueryEmpty(context, facesToDelete))
    {
        opDeleteFace(context, id + "delface", {
                "deleteFaces" : facesToDelete,
                "includeFillet" : false,
                "capVoid" : false,
                "leaveOpen" : true });
    }
    result.bodiesToPattern = evaluateQuery(context, qCreatedBy(id + "copiedSheets", EntityType.BODY));
    result.originalSketchSheets = evaluateQuery(context, qCreatedBy(sketchId, EntityType.BODY));
    result.isUpdated = true;
    return result;
}

/**
 * Perform a face or body pattern as described by the definition, then transform and boolean the result if necessary.
 */
function geometryPattern(context is Context, id is Id, definition is map, remainingTransform is Transform)
{
    opPattern(context, id, definition);
    transformResultIfNecessary(context, id, remainingTransform);

    processPatternBooleansIfNeeded(context, id, definition);
}

/**
 * Split the input entities of the pattern and perform face and body patterns for standard entities and sheet metal entities.
 */
function sheetMetalAwareGeometryPattern(context is Context, id is Id, definition is map, remainingTransform is Transform, allowPartialResults is boolean)
{
    var separatedQueries = separateSheetMetalQueries(context, definition.entities);
    var hasNonSheetMetalQueries = !isQueryEmpty(context, separatedQueries.nonSheetMetalQueries);
    var hasSheetMetalQueries = !isQueryEmpty(context, separatedQueries.sheetMetalQueries);

    if (hasNonSheetMetalQueries)
    {
        definition.entities = separatedQueries.nonSheetMetalQueries;
        try
        {
            geometryPattern(context, id, definition, remainingTransform);
        }
        catch (e)
        {
            if (!allowPartialResults)
            {
                throw e;
            }
        }
    }
    if (hasSheetMetalQueries)
    {
        definition.entities = separatedQueries.sheetMetalQueries;
        definition.topLevelId = id;
        try
        {
            sheetMetalGeometryPattern(context, id + "smPattern", definition);
        }
        catch (e)
        {
            if (!allowPartialResults)
            {
                throw e;
            }
        }
    }
}

/** @internal */
export function tooFewPatternInstances(context is Context, instanceCount is number) returns boolean
{
    return instanceCount < 1 || (instanceCount < 2 && !isAtVersionOrLater(context, FeatureScriptVersionNumber.V1128_PATTERN_OF_ONE));
}

function expectedToCreateGeometry(context is Context, definition is map) returns boolean
{
    return !isAtVersionOrLater(context, FeatureScriptVersionNumber.V1128_PATTERN_OF_ONE) || definition.transforms != [];
}
