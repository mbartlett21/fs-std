FeatureScript 2716; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present PTC Inc.

// Imports used in interface
export import(path : "onshape/std/query.fs", version : "2716.0");
export import(path : "onshape/std/tool.fs", version : "2716.0");

// Features using manipulators must export manipulator.fs.
export import(path : "onshape/std/manipulator.fs", version : "2716.0");

// Imports used internally
import(path : "onshape/std/containers.fs", version : "2716.0");
import(path : "onshape/std/evaluate.fs", version : "2716.0");
import(path : "onshape/std/feature.fs", version : "2716.0");
import(path : "onshape/std/primitives.fs", version : "2716.0");
import(path : "onshape/std/surfaceGeometry.fs", version : "2716.0");
import(path : "onshape/std/transform.fs", version : "2716.0");
import(path : "onshape/std/valueBounds.fs", version : "2716.0");
import(path : "onshape/std/vector.fs", version : "2716.0");
import(path : "onshape/std/sheetMetalUtils.fs", version : "2716.0");

export import(path : "onshape/std/extendendtype.gen.fs", version : "2716.0");
export import(path : "onshape/std/extendsheetshapetype.gen.fs", version : "2716.0");

/**
 * Bounding type used with extend.
 */
export enum ExtendBoundingType
{
    annotation { "Name" : "Blind" }
    BLIND,
    annotation { "Name" : "Up to face" }
    UP_TO_FACE,
    annotation { "Name" : "Up to part/surface" }
    UP_TO_BODY,
    annotation { "Name" : "Up to vertex" }
    UP_TO_VERTEX
}

const targetBounds = 100 * meter;


/**
 * Extends a surface body by calling [opExtendSheetBody].
 */
annotation { "Feature Type Name" : "Move boundary", "Manipulator Change Function" : "extendManipulatorChange" }
export const extendSurface = defineFeature(function(context is Context, id is Id, definition is map)
    precondition
    {

        annotation { "Name" : "Surface or boundary edges", "Filter" : ((EntityType.BODY && BodyType.SHEET) ||
                                                               (EntityType.EDGE && EdgeTopology.ONE_SIDED)) &&
                                                                ConstructionObject.NO && SketchObject.NO && ModifiableEntityOnly.YES }
        definition.entities is Query;

        annotation { "Name" : "Tangent propagation", "Default" : true }
        definition.tangentPropagation is boolean;

        annotation { "Name" : "Move end condition" }
        definition.endCondition is ExtendBoundingType;
        if (definition.endCondition == ExtendBoundingType.BLIND)
        {
            annotation { "Name" : "Opposite direction", "UIHint" : UIHint.OPPOSITE_DIRECTION }
            definition.oppositeDirection is boolean;

            annotation { "Name" : "Distance" }
            isLength(definition.extendDistance, LENGTH_BOUNDS);
        }
        else if (definition.endCondition == ExtendBoundingType.UP_TO_BODY)
        {
            annotation { "Name" : "Target", "Filter" : EntityType.BODY && (BodyType.SOLID || BodyType.SHEET) && SketchObject.NO && AllowMeshGeometry.YES, "MaxNumberOfPicks" : 1 }
            definition.targetPart is Query;
        }
        else if (definition.endCondition == ExtendBoundingType.UP_TO_FACE)
        {
            annotation { "Name" : "Target", "Filter" : (EntityType.FACE && SketchObject.NO) || BodyType.MATE_CONNECTOR, "MaxNumberOfPicks" : 1 }
            definition.targetFace is Query;
        }
        else if (definition.endCondition == ExtendBoundingType.UP_TO_VERTEX)
        {
            annotation { "Name" : "Target", "Filter" : QueryFilterCompound.ALLOWS_VERTEX, "MaxNumberOfPicks" : 1 }
            definition.targetVertex is Query;
        }

        if (definition.endCondition == ExtendBoundingType.UP_TO_VERTEX || definition.endCondition == ExtendBoundingType.UP_TO_FACE || definition.endCondition == ExtendBoundingType.UP_TO_BODY)
        {
            annotation {"Name" : "Offset distance", "Column Name" : "Has offset", "UIHint" : [ "DISPLAY_SHORT", "FIRST_IN_ROW" ] }
            definition.hasOffset is boolean;

            if (definition.hasOffset)
            {
                annotation {"Name" : "Offset distance", "UIHint" : UIHint.DISPLAY_SHORT }
                isLength(definition.offset, LENGTH_BOUNDS);

                annotation {"Name" : "Opposite direction", "Column Name" : "Offset opposite direction", "UIHint" : UIHint.OPPOSITE_DIRECTION}
                definition.offsetOppositeDirection is boolean;
            }
        }

        annotation {"Name" : "Maintain curvature"}
        definition.maintainCurvature is boolean;
    }
    {
        verifyNoMesh(context, definition, "entities");

        if (definition.maintainCurvature)
            definition.extensionShape = ExtendSheetShapeType.SOFT;
        else
            definition.extensionShape = ExtendSheetShapeType.LINEAR;

        if (definition.endCondition == ExtendBoundingType.BLIND)
        {
            definition.endCondition = ExtendEndType.EXTEND_BLIND;

            if (definition.oppositeDirection)
            {
                definition.extendDistance *= -1;
            }
            try(addExtendManipulator(context, id, definition));
            if (definition.extendDistance > 0)
            {
                opExtendSheetBody(context, id, definition);
            }
            else //use edge change for trimming back
            {
                const trackedEdges = getTrackedEdges(context, definition);
                var edgeChangeOptions = [];

                for (var i = 0; i < size(trackedEdges); i += 1)
                {
                    var edge = trackedEdges[i];
                    edgeChangeOptions = append(edgeChangeOptions, { "edge" : edge,
                                "face" : qAdjacent(edge, AdjacencyType.EDGE, EntityType.FACE),
                                "offset" : definition.extendDistance });
                }

                if (edgeChangeOptions == [])
                {
                    throw regenError(ErrorStringEnum.EXTEND_SHEET_BODY_NO_BODY, ["entities"]);
                }

                trimEdges(context, id + "edgeChange", edgeChangeOptions);
            }
        }
        else //up to target => up to face,part,vertex
        {
            verifyNonemptyQuery(context, definition, "entities", ErrorStringEnum.EXTEND_SHEET_BODY_NO_BODY);
            if (definition.hasOffset)
            {
                definition.offset = definition.offset * (definition.offsetOppositeDirection ? -1 : 1);
            }
            var toDelete = [];
            definition.target = definition.targetPart;
            var errorEntityString = "targetPart";
            if (definition.endCondition == ExtendBoundingType.UP_TO_FACE)
            {
                verifyNonemptyQuery(context, definition, "targetFace", ErrorStringEnum.EXTEND_SHEET_BODY_NO_TARGET);
                definition.target = getTargetFromFace(context, id, definition);
                toDelete = append(toDelete, definition.target);
                errorEntityString = "targetFace";
            }
            else if (definition.endCondition == ExtendBoundingType.UP_TO_VERTEX)
            {
                verifyNonemptyQuery(context, definition, "targetVertex", ErrorStringEnum.EXTEND_SHEET_BODY_NO_TARGET);
                definition.target = getTargetFromVertex(context, id, definition);
                toDelete = append(toDelete, definition.target);
                errorEntityString = "targetVertex";
            }
            else if (definition.endCondition == ExtendBoundingType.UP_TO_BODY)
            {
                if (definition.hasOffset)
                {
                    verifyNonemptyQuery(context, definition, "targetPart", ErrorStringEnum.EXTEND_SHEET_BODY_NO_TARGET);
                    if (!isQueryEmpty(context, definition.targetPart->qBodyType(BodyType.SHEET)))
                    {
                        definition.targetFace = qOwnedByBody(definition.targetPart, EntityType.FACE);
                        definition.target = getTargetFromSurface(context, id, definition);
                    }
                    else if (!isQueryEmpty(context, definition.targetPart->qBodyType(BodyType.SOLID)))
                    {
                        definition.target = getOffsetBody(context, id, definition);
                    }
                    toDelete = append(toDelete, definition.target);
                    errorEntityString = "targetPart";
                }
            }

            if (isQueryEmpty(context, definition.target))
            {
                throw regenError(ErrorStringEnum.EXTEND_SHEET_BODY_NO_TARGET, [errorEntityString]);
            }
            const extendTargetType = definition.endCondition;
            definition.endCondition = ExtendEndType.EXTEND_TO_TARGET;

            try
            {
                extendToTarget(context, id, definition, extendTargetType);
                if (!isQueryEmpty(context, qUnion(toDelete)))
                {
                    opDeleteBodies(context, id + "deleteBodiesCleanup", { "entities" : qUnion(toDelete) });
                }
            }
            catch(e)
            {
                if (!isQueryEmpty(context, qUnion(toDelete)))
                {
                    opDeleteBodies(context, id + "deleteBodiesCleanup", { "entities" : qUnion(toDelete) });
                }
                throw e;
            }
        }
    }, { oppositeDirection : false, tangentPropagation : true, endCondition : ExtendBoundingType.BLIND, maintainCurvature : false, hasOffset : false, offsetOppositeDirection : false, offset : 0.0 });


function extendToTarget(context is Context, id is Id, definition is map, extendTargetType is string)
{
    var edgesToExtend = [];
    var edgeChangeOptions = [];
    const trackedEdges = getTrackedEdges(context, definition);
    var bodyToCollision = {}; //keep track to avoid calling evCollusion more than once per body
    if (trackedEdges == [])
    {
      throw regenError(ErrorStringEnum.EXTEND_SHEET_BODY_NO_BODY, ["entities"]);
    }
    for (var i = 0; i < size(trackedEdges); i += 1)
    {
        var edge = trackedEdges[i];
        const ownerBody = evaluateQuery(context, qOwnerBody(edge))[0];
        if (bodyToCollision[ownerBody] == false ||
            (bodyToCollision[ownerBody] == undefined && evCollision(context, { "tools" : ownerBody, "targets" : qOwnerBody(definition.target) }) == []))
        {
            bodyToCollision[ownerBody] = false;
            //no collision, use extend
            edgesToExtend = append(edgesToExtend, edge);
        }
        else //it's a trim
        {
            bodyToCollision[ownerBody] = true;
            var targetFace = qOwnedByBody(definition.target, EntityType.FACE);
            if (size(evaluateQuery(context, targetFace)) > 1)
            {
                setErrorEntities(context, id, { "entities" : definition.target });
                if (extendTargetType == ExtendBoundingType.UP_TO_BODY)
                {
                    throw regenError(ErrorStringEnum.TRIM_TO_MULTI_FAILED_FOR_UPTO_BODY);
                }
                else
                {
                    throw regenError(ErrorStringEnum.TRIM_TO_MULTI_FAILED); //cannot trim to multi-face targets
                }
            }

            edgeChangeOptions = append(edgeChangeOptions, { "edge" : edge,
                        "face" : qAdjacent(edge, AdjacencyType.EDGE, EntityType.FACE),
                        "replaceFace" : targetFace });
        }
    }

    if (size(edgeChangeOptions) > 0)
    {
        trimEdges(context, id + "edgeChange", edgeChangeOptions);
    }
    else if (size(edgesToExtend) > 0)
    {
        definition.entities = qUnion(edgesToExtend);
        opExtendSheetBody(context, id + "extend", definition);
    }
}

function trimEdges(context is Context, id is Id, edgeChangeOptions is array)
{
    try silent
    {
        opEdgeChange(context, id + "edgeChange", { "edgeChangeOptions" : edgeChangeOptions });
    }
    catch
    {
        var edgesToTrim = [];
        for (var i = 0; i < size(edgeChangeOptions); i += 1)
        {
            edgesToTrim = append(edgesToTrim, edgeChangeOptions[i].edge);
        }
        setErrorEntities(context, id, { "entities" : qUnion(edgesToTrim) });
        throw regenError(ErrorStringEnum.TRIM_FAILED);
    }
}

function extendTarget(context is Context, id is Id, surfaceDefinition is map, definition is map) returns Query
{
    var newTarget;
    if (surfaceDefinition is Plane)
    {
        var offsetSurface = surfaceDefinition;
        if (definition.hasOffset)
        {
            offsetSurface.origin = surfaceDefinition.origin + definition.offset * surfaceDefinition.normal;
        }
        opPlane(context, id + "plane", { "plane" : offsetSurface,
                            "width" : targetBounds, "height" : targetBounds });
        newTarget = qCreatedBy(id + "plane", EntityType.BODY);
    }
    else if (surfaceDefinition is Cylinder)
    {
        var cyl = surfaceDefinition;
        if (definition.hasOffset)
        {
            cyl.radius = surfaceDefinition.radius + definition.offset;
        }
        if (cyl.radius < 0.0)
        {
            throw regenError(ErrorStringEnum.EXTEND_OFFSET_FAILED);
        }
        fCylinder(context, id + "cylinder", { "topCenter" : cyl.coordSystem.origin + targetBounds * cyl.coordSystem.zAxis,
                    "bottomCenter" : cyl.coordSystem.origin - targetBounds * cyl.coordSystem.zAxis,
                    "radius" : cyl.radius });
        const capFaces = qUnion([qCapEntity(id + "cylinder", CapType.START, EntityType.FACE),
                               qCapEntity(id + "cylinder", CapType.END, EntityType.FACE)]);
        opDeleteFace(context, id + "deleteCaps", {"deleteFaces": capFaces, "leaveOpen" : true, "includeFillet" :false, "capVoid" :false});
        newTarget = qCreatedBy(id + "cylinder", EntityType.BODY);
    }
    return newTarget;
}

function getTrackedEdges(context is Context, definition is map) returns array
{
    var selectedEdges = qEntityFilter(definition.entities, EntityType.EDGE);
    if (definition.tangentPropagation)
    {
        selectedEdges = qUnion([selectedEdges, qTangentConnectedEdges(selectedEdges)]);
    }
    var allEdges = qEdgeTopologyFilter(qUnion([selectedEdges, qOwnedByBody(definition.entities, EntityType.EDGE)]), EdgeTopology.ONE_SIDED);

    var trackedEdges = [];
    for (var edge in evaluateQuery(context, allEdges))
    {
        trackedEdges = append(trackedEdges, qUnion([edge, startTracking(context, edge)]));
    }
    return trackedEdges;
}

function getTargetFromFace(context is Context, id is Id, definition is map) returns Query
{
    try
    {
        const mateConnectorCSys = try silent(evMateConnector(context, { "mateConnector" : definition.targetFace }));
        if (mateConnectorCSys != undefined)
        {
            var mateConnectorPlane = plane(mateConnectorCSys);
            if (definition.hasOffset)
            {
                mateConnectorPlane.origin = mateConnectorPlane.origin + definition.offset * mateConnectorPlane.normal;
            }
            opPlane(context, id + "plane", { "plane" : mateConnectorPlane,  "width" : targetBounds, "height" : targetBounds });
            return qCreatedBy(id + "plane", EntityType.BODY);
        }
        else
        {
            var targetFace = definition.targetFace;
            var surface = evSurfaceDefinition(context, { "face" : targetFace });
            if (surface is Plane || surface is Cylinder)
            {
                return extendTarget(context, id, surface, definition);
            }
            else
            {
                if (!definition.hasOffset)
                {
                    opExtractSurface(context, id + "extractFace", { "faces" : definition.targetFace });
                    return qCreatedBy(id + "extractFace", EntityType.BODY);
                }
                else
                {
                    opExtractSurface(context, id + "extractFace", { "faces" : definition.targetFace, "offset" : definition.offset,
            "useFacesAroundToTrimOffset" : false});
                    return qCreatedBy(id + "extractFace", EntityType.BODY);
                }
            }
        }
    }
    catch (error)
    {
        setErrorEntities(context, id, { "entities" : definition.targetFace });
        if (definition.hasOffset && error == ErrorStringEnum.DIRECT_EDIT_OFFSET_FACE_FAILED)
        {
            throw regenError(ErrorStringEnum.EXTEND_OFFSET_FAILED);
        }
        else
        {
            throw regenError(ErrorStringEnum.EXTEND_TO_FACE_FAILED);
        }
    }
}

function getTargetFromVertex(context is Context, id is Id, definition is map) returns Query
{
    try
    {
        const returnMap = getExtendDirection(context, definition.entities, false); //use edge with min detId
        if (returnMap.extendDirection != undefined)
        {
            const vertexPoint = evVertexPoint(context, { "vertex" : definition.targetVertex });
            const plane = plane(vertexPoint, returnMap.extendDirection);
            var offsetSurface = plane;
            if (definition.hasOffset)
            {
                offsetSurface.origin = plane.origin + definition.offset * plane.normal;
            }
            opPlane(context, id + "plane", { "plane" : offsetSurface,
                        "width" : targetBounds, "height" : targetBounds });
            return qCreatedBy(id + "plane", EntityType.BODY);
        }
        else
        {
            throw regenError(ErrorStringEnum.EXTEND_TO_VERTEX_FAILED);
        }
    }
    catch
    {
        setErrorEntities(context, id, { "entities" : definition.targetVertex });
        if (definition.hasOffset)
        {
            throw regenError(ErrorStringEnum.EXTEND_OFFSET_FAILED);
        }
        else
        {
            throw regenError(ErrorStringEnum.EXTEND_TO_VERTEX_FAILED);
        }
    }
}

function getTargetFromSurface(context is Context, id is Id, definition is map) returns Query
{
    try
    {
        if (!definition.hasOffset)
        {
            opExtractSurface(context, id + "extractFace", { "faces" : definition.targetFace });
            return qCreatedBy(id + "extractFace", EntityType.BODY);
        }
        else
        {
            opExtractSurface(context, id + "extractFace", { "faces" : definition.targetFace, "offset" : definition.offset,
            "useFacesAroundToTrimOffset" : false});
            return qCreatedBy(id + "extractFace", EntityType.BODY);
        }
    }
    catch
    {
        setErrorEntities(context, id, { "entities" : definition.targetPart });
        throw regenError(ErrorStringEnum.EXTEND_OFFSET_FAILED);
    }
}

function getOffsetBody(context is Context, id is Id, definition is map) returns Query
{
    // unable to perform intermediate transform operation on
    // active sheet metal parts, so check for it before getting the offset body
    if (queryContainsActiveSheetMetal(context, definition.targetPart))
    {
        setErrorEntities(context, id, { "entities" : definition.targetPart });
        throw regenError(ErrorStringEnum.SHEET_METAL_ACTIVE_MODEL_CANNOT_OFFSET);
    }

    try
    {
        const suffix = "offsetTempBody";
        const transformMatrix = identityTransform();
        opPattern(context, id + suffix,
            { "entities" : definition.targetPart,
                    "transforms" : [transformMatrix],
                    "instanceNames" : ["1"] });

        var faceQuery = qCreatedBy(id + suffix, EntityType.FACE);

        const tempMoveFaceSuffix = "offsetMoveFace";
        const moveFaceDefinition = {
                "moveFaces" : faceQuery,
                "moveFaceType" : MoveFaceType.OFFSET,
                "offsetDistance" : definition.offset,
                "reFillet" : definition.reFillet };

        opOffsetFace(context, id + tempMoveFaceSuffix, moveFaceDefinition);
        return qCreatedBy(id + suffix, EntityType.BODY);
    }
    catch
    {
        setErrorEntities(context, id, { "entities" : definition.targetPart });
        throw regenError(ErrorStringEnum.EXTEND_OFFSET_FAILED);
    }
}


//manipulator related:
const EXTEND_MANIPULATOR = "extendManipulator";

function addExtendManipulator(context is Context, id is Id, definition is map)
{
    const useLastSelectedEdge = true;
    const returnMap = try silent(getExtendDirection(context, definition.entities, useLastSelectedEdge));
    if (returnMap != undefined && returnMap.extendDirection != undefined)
    {
        addManipulators(context, id, { (EXTEND_MANIPULATOR) :
                        linearManipulator({ "base" : returnMap.origin,
                                "direction" : returnMap.extendDirection,
                                "offset" : definition.extendDistance,
                                "primaryParameterId" : "extendDistance" }) });
    }
}


function getFirstLaminarEdge(context is Context, query is Query)
{
    const laminarEdges = qEdgeTopologyFilter(query, EdgeTopology.ONE_SIDED);
    const laminarQ = evaluateQuery(context, laminarEdges);
    if (laminarQ == [])
    {
        throw regenError(ErrorStringEnum.EXTEND_NON_LAMINAR, ["entities"]);
    }
    return laminarQ[0];
}

function getEdgeToUse(context is Context, entities is Query, useLastSelected is boolean)
{
    const resolvedEntities = evaluateQuery(context, entities);
    var edgeToUse = undefined;
    if (@size(resolvedEntities) > 0)
    {
        if (useLastSelected) //used in manipulator attachment
        {
            edgeToUse = resolvedEntities[@size(resolvedEntities) - 1];
            if (!isQueryEmpty(context, qEntityFilter(edgeToUse, EntityType.BODY)))
            {
                edgeToUse = getFirstLaminarEdge(context, qOwnedByBody(edgeToUse, EntityType.EDGE));
            }
        }
        else //use edge with min deterministic id, used in feature regen
        {
            const edges = evaluateQuery(context, qEntityFilter(entities, EntityType.EDGE));
            if (size(edges) > 0)
            {
                edgeToUse = edges[0];
            }
            else
            {
                //if there are no edges, use the laminar edge with min det id
                edgeToUse = getFirstLaminarEdge(context, qOwnedByBody(qEntityFilter(entities, EntityType.BODY), EntityType.EDGE));
            }
        }
    }
    return edgeToUse;

}

function getExtendDirection(context is Context, entities is Query, useLastSelectedEdge is boolean)
{
    var returnMap = {};
    const edgeToUse = getEdgeToUse(context, entities, useLastSelectedEdge);
    if (edgeToUse != undefined)
    {
        var faceNormal;
        const faces = evaluateQuery(context, qAdjacent(edgeToUse, AdjacencyType.EDGE, EntityType.FACE));
        if (size(faces) == 1)
        {
            const midParam = .5;
            const tangentLine = evEdgeTangentLine(context, { "edge" : edgeToUse, "face" : faces[0], "parameter" : midParam });
            returnMap.origin = tangentLine.origin;

            const edgeDirection = tangentLine.direction;
            const faceTangentPlane = evFaceTangentPlaneAtEdge(context, {
                        "face" : faces[0],
                        "edge" : edgeToUse,
                        "parameter" : midParam,
                        "usingFaceOrientation" : true
                    });
            faceNormal = faceTangentPlane.normal;

            if (faceNormal != undefined)
            {
                returnMap.extendDirection = cross(edgeDirection, faceNormal);
                if (isAtVersionOrLater(context, FeatureScriptVersionNumber.V2083_EXTEND_FS_FIX))
                {
                    returnMap.extendDirection = normalize(returnMap.extendDirection);
                }
            }
        }
    }
    return returnMap;
}

/**
 * @internal
 */
export function extendManipulatorChange(context is Context, definition is map, newManipulators is map) returns map
{
    try
    {
        if (newManipulators[EXTEND_MANIPULATOR] is map)
        {
            const newValue = newManipulators[EXTEND_MANIPULATOR].offset;

            definition.extendDistance = abs(newValue);
            definition.oppositeDirection = newValue.value < 0;
        }
    }
    return definition;
}
