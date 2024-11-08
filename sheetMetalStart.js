FeatureScript 9999; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present Onshape Inc.


export import(path : "onshape/std/query.fs", version : "");

import(path : "onshape/std/attributes.fs", version : "");
import(path : "onshape/std/boundingtype.gen.fs", version : "");
import(path : "onshape/std/box.fs", version : "");
import(path : "onshape/std/containers.fs", version : "");
import(path : "onshape/std/coordSystem.fs", version : "");
import(path : "onshape/std/curveGeometry.fs", version : "");
import(path : "onshape/std/error.fs", version : "");
import(path : "onshape/std/evaluate.fs", version : "");
import(path : "onshape/std/feature.fs", version : "");
import(path : "onshape/std/geomOperations.fs", version : "");
import(path : "onshape/std/manipulator.fs", version : "");
import(path : "onshape/std/math.fs", version : "");
import(path : "onshape/std/modifyFillet.fs", version : "");
import(path : "onshape/std/sheetMetalAttribute.fs", version : "");
import(path : "onshape/std/sheetMetalUtils.fs", version : "");
import(path : "onshape/std/sketch.fs", version : "");
import(path : "onshape/std/smreliefstyle.gen.fs", version : "");
import(path : "onshape/std/string.fs", version : "");
import(path : "onshape/std/surfaceGeometry.fs", version : "");
import(path : "onshape/std/tool.fs", version : "");
import(path : "onshape/std/topologyUtils.fs", version : "");
import(path : "onshape/std/valueBounds.fs", version : "");
import(path : "onshape/std/vector.fs", version : "");

/**
 * Method of initializing sheet metal model
 */
export enum SMProcessType
{
    annotation { "Name" : "Convert" }
    CONVERT,
    annotation { "Name" : "Extrude" }
    EXTRUDE,
    annotation { "Name" : "Thicken" }
    THICKEN
}

/**
 * Bounding type used with SMProcessType.EXTRUDE
 */
export enum SMExtrudeBoundingType
{
    annotation { "Name" : "Blind" }
    BLIND,
    annotation { "Name" : "Symmetric" }
    SYMMETRIC
}

/**
 * Default corner relief style setting
 */
export enum SMCornerStrategyType
{
    annotation { "Name" : "Sized rectangle" }
    SIZED_RECTANGLE,
    annotation { "Name" : "Rectangle" }
    RECTANGLE,
    annotation { "Name" : "Sized round" }
    SIZED_ROUND,
    annotation { "Name" : "Round" }
    ROUND,
    annotation { "Name" : "Closed" }
    CLOSED,
    annotation { "Name" : "Simple" }
    SIMPLE
}

/**
 * Default bend relief style setting
 */
export enum SMBendStrategyType
{
    annotation { "Name" : "Rectangle" }
    RECTANGLE,
    annotation { "Name" : "Obround" }
    OBROUND,
    annotation { "Name" : "Tear" }
    TEAR
}

/**
 * Corner relief scale bounds
 */
export const CORNER_RELIEF_SCALE_BOUNDS =
{
    (unitless) : [1.0, 1.5, 2.0]
} as RealBoundSpec;

/**
 * Bend relief scale bounds
 */
export const BEND_RELIEF_SCALE_BOUNDS =
{
    (unitless) : [0.0625, 1.0625, 2.0]
} as RealBoundSpec;

/**
 * Create and activate a sheet metal model by converting existing parts, extruding sketch curves or thickening.
 * All operations on an active sheet metal model will automatically be represented in the flat pattern and the table.
 * Sheet metal models may consist of multiple parts. Multiple sheet metal models can be active.
 */
annotation { "Feature Type Name" : "Sheet metal model",
             "Manipulator Change Function" : "sheetMetalStartManipulatorChange",
             "Filter Selector" : "allparts",
             "Editing Logic Function" : "sheetMetalStartEditLogic" }
export const sheetMetalStart = defineSheetMetalFeature(function(context is Context, id is Id, definition is map)
     precondition
    {
        annotation { "Name" : "Entities", "UIHint" : "ALWAYS_HIDDEN", "Filter" : (EntityType.BODY && (BodyType.SOLID || BodyType.SHEET)) ||
            ((EntityType.FACE || EntityType.EDGE) && SketchObject.YES && ConstructionObject.NO) }
        definition.initEntities is Query;

        annotation { "Name" : "Process", "UIHint" : "HORIZONTAL_ENUM" }
        definition.process is SMProcessType;

        // First the entities
        if (definition.process == SMProcessType.CONVERT)
        {
            annotation { "Name" : "Parts and surfaces to convert",
                        "Filter" : EntityType.BODY && (BodyType.SOLID || BodyType.SHEET) && SketchObject.NO && ConstructionObject.NO }
            definition.partToConvert is Query;

            annotation { "Name" : "Faces to exclude", "Filter" : EntityType.FACE && ConstructionObject.NO && SketchObject.NO }
            definition.facesToExclude is Query;
        }
        else if (definition.process == SMProcessType.EXTRUDE)
        {
            annotation { "Name" : "Sketch curves to extrude",
                        "Filter" : SketchObject.YES && ConstructionObject.NO && ModifiableEntityOnly.YES && EntityType.EDGE }
            definition.sketchCurves is Query;

            annotation { "Name" : "Arcs to extrude as bends",
                        "Filter" : SketchObject.YES && ConstructionObject.NO && ModifiableEntityOnly.YES && (EntityType.EDGE && GeometryType.ARC) }
            definition.bendArcs is Query;

            annotation { "Name" : "End type" }
            definition.endBound is SMExtrudeBoundingType;

            annotation { "Name" : "Depth" }
            isLength(definition.depth, NONNEGATIVE_LENGTH_BOUNDS);

            if (definition.endBound == SMExtrudeBoundingType.BLIND)
            {
                annotation { "Name" : "Opposite direction", "UIHint" : "OPPOSITE_DIRECTION", "Default" : false }
                definition.oppositeExtrudeDirection is boolean;
            }
        }
        else if (definition.process == SMProcessType.THICKEN)
        {
            annotation { "Name" : "Faces or sketch regions to thicken",
                        "Filter" : ConstructionObject.NO && (GeometryType.PLANE || GeometryType.CYLINDER || GeometryType.EXTRUDED) }
            definition.regions is Query;

            annotation { "Name" : "Tangent propagation", "Default" : false }
            definition.tangentPropagation is boolean;
        }

        if (definition.process == SMProcessType.THICKEN || definition.process == SMProcessType.CONVERT)
        {
            annotation { "Name" : "Edges or cylinders to bend",
                         "Filter" : ((EntityType.EDGE && EdgeTopology.TWO_SIDED && GeometryType.LINE) ||
                                     (EntityType.FACE && GeometryType.CYLINDER)) && SketchObject.NO }
            definition.bends is Query;

            annotation { "Name" : "Clearance from input" }
            isLength(definition.clearance, NONNEGATIVE_ZERO_DEFAULT_LENGTH_BOUNDS);

            annotation { "Name" : "Clearance includes bends" }
            definition.bendsIncluded is boolean;
        }

        if (definition.process == SMProcessType.CONVERT)
        {
            annotation { "Name" : "Keep input parts" }
            definition.keepInputParts is boolean;
        }

        // Then some common parameters
        annotation { "Name" : "Thickness", "UIHint" : "REMEMBER_PREVIOUS_VALUE" }
        isLength(definition.thickness, SM_THICKNESS_BOUNDS);

        annotation { "Name" : "Opposite direction", "UIHint" : "OPPOSITE_DIRECTION" }
        definition.oppositeDirection is boolean;

        annotation { "Name" : "Bend radius", "UIHint" : "REMEMBER_PREVIOUS_VALUE" }
        isLength(definition.radius, SM_BEND_RADIUS_BOUNDS);

        annotation { "Name" : "Bend K Factor", "UIHint" : "REMEMBER_PREVIOUS_VALUE" }
        isReal(definition.kFactor, K_FACTOR_BOUNDS);

        annotation { "Name" : "Rolled K Factor", "UIHint" : "REMEMBER_PREVIOUS_VALUE" }
        isReal(definition.kFactorRolled, ROLLED_K_FACTOR_BOUNDS);

        annotation { "Name" : "Minimal gap", "UIHint" : "REMEMBER_PREVIOUS_VALUE" }
        isLength(definition.minimalClearance, SM_MINIMAL_CLEARANCE_BOUNDS);

        annotation { "Name" : "Corner relief type",
                     "Default" : SMCornerStrategyType.SIMPLE,
                     "UIHint" : ["SHOW_LABEL", "REMEMBER_PREVIOUS_VALUE"] }
        definition.defaultCornerStyle is SMCornerStrategyType;

        if (definition.defaultCornerStyle == SMCornerStrategyType.RECTANGLE ||
            definition.defaultCornerStyle == SMCornerStrategyType.ROUND)
        {
            annotation { "Name" : "Corner relief scale", "UIHint" : "REMEMBER_PREVIOUS_VALUE" }
            isReal(definition.defaultCornerReliefScale, CORNER_RELIEF_SCALE_BOUNDS);
        }

        if (definition.defaultCornerStyle == SMCornerStrategyType.SIZED_ROUND)
        {
            annotation { "Name" : "Corner relief diameter", "UIHint" : "REMEMBER_PREVIOUS_VALUE" }
            isLength(definition.defaultRoundReliefDiameter, SM_RELIEF_SIZE_BOUNDS);
        }

        if (definition.defaultCornerStyle == SMCornerStrategyType.SIZED_RECTANGLE)
        {
            annotation { "Name" : "Corner relief width", "UIHint" : "REMEMBER_PREVIOUS_VALUE" }
            isLength(definition.defaultSquareReliefWidth, SM_RELIEF_SIZE_BOUNDS);
        }

        annotation { "Name" : "Bend relief type",
                     "Default" : SMBendStrategyType.OBROUND,
                     "UIHint" : ["SHOW_LABEL", "REMEMBER_PREVIOUS_VALUE"] }
        definition.defaultBendReliefStyle is SMBendStrategyType;


        if (definition.defaultBendReliefStyle == SMBendStrategyType.OBROUND ||
            definition.defaultBendReliefStyle == SMBendStrategyType.RECTANGLE)
        {
            annotation { "Name" : "Bend relief depth scale", "UIHint" : "REMEMBER_PREVIOUS_VALUE" }
            isReal(definition.defaultBendReliefDepthScale, CORNER_RELIEF_SCALE_BOUNDS);
            annotation { "Name" : "Bend relief width scale", "UIHint" : "REMEMBER_PREVIOUS_VALUE" }
            isReal(definition.defaultBendReliefScale, BEND_RELIEF_SCALE_BOUNDS);
        }
    }
    {
        definition.supportRolled = isAtVersionOrLater(context, FeatureScriptVersionNumber.V727_SM_SUPPORT_ROLLED);
        // tangentPropagation is meaningful only for Thicken option
        definition.tangentPropagation = (definition.tangentPropagation && definition.process == SMProcessType.THICKEN);
        if (definition.process == SMProcessType.CONVERT)
        {
            checkNotInFeaturePattern(context, definition.partToConvert, ErrorStringEnum.SHEET_METAL_NO_FEATURE_PATTERN);
            convertExistingPart(context, id, definition);
        }
        else if (definition.process == SMProcessType.EXTRUDE)
        {
            checkNotInFeaturePattern(context, definition.sketchCurves, ErrorStringEnum.SHEET_METAL_NO_FEATURE_PATTERN);
            extrudeSheetMetal(context, id, definition);
        }
        else if (definition.process == SMProcessType.THICKEN)
        {
            checkNotInFeaturePattern(context, definition.regions, ErrorStringEnum.SHEET_METAL_NO_FEATURE_PATTERN);
            thickenToSheetMetal(context, id, definition);
        }
    }, { "kFactor" : 0.45,
      "kFactorRolled" : 0.5,
      "minimalClearance" : 2e-5 * meter,
      "oppositeDirection" : false,
      "initEntities" : qNothing(),
      "bendArcs" : qNothing(),
      "defaultCornerStyle" :  SMCornerStrategyType.SIMPLE,
      "defaultCornerReliefScale" : 1.5,
      "defaultRoundReliefDiameter" : 0 * meter,
      "defaultSquareReliefWidth" : 0 * meter,
      "defaultBendReliefStyle" :  SMBendStrategyType.OBROUND,
      "defaultBendReliefDepthScale" : 1.5,
      "defaultBendReliefScale" : 1.0625,
      "bendsIncluded" : false,
      "clearance" : 0 * meter,
      "keepInputParts" : false,
      "tangentPropagation" : false
    });

function finalizeSheetMetalGeometry(context is Context, id is Id, entities is Query)
{
    try
    {
        updateSheetMetalGeometry(context, id, { "entities" : entities });
    }
    catch (e)
    {
        var messageAsEnum = try silent(e.message as ErrorStringEnum);
        if (messageAsEnum == ErrorStringEnum.BOOLEAN_INVALID)
        {
            // I can't think of anything more useful to tell the user right now. Analyzing such cases
            // may make it clearer when it can happen
            throw regenError(ErrorStringEnum.SHEET_METAL_REBUILD_ERROR);
        }
        else if (messageAsEnum == ErrorStringEnum.BAD_GEOMETRY ||
                messageAsEnum == ErrorStringEnum.THICKEN_FAILED)
        {
            throw regenError(ErrorStringEnum.SHEET_METAL_CANNOT_THICKEN);
        }
        else if (messageAsEnum == ErrorStringEnum.SHEET_METAL_NO_FEATURE_PATTERN)
        {
            throw regenError(ErrorStringEnum.SHEET_METAL_NO_FEATURE_PATTERN);
        }
        else
        {
            throw regenError(ErrorStringEnum.SHEET_METAL_REBUILD_ERROR);
        }
    }
}

/*
 * Methods for CONVERT
 */

function convertExistingPart(context is Context, id is Id, definition is map)
{
    if (size(evaluateQuery(context, definition.partToConvert)) < 1)
    {
        throw regenError(ErrorStringEnum.CANNOT_RESOLVE_ENTITIES, ["partToConvert"]);
    }

    var associationAttributes = getAttributes(context, {
            "entities" : definition.partToConvert,
            "attributePattern" : {} as SMAssociationAttribute
        });
    if (size(associationAttributes) != 0)
    {
        throw regenError(ErrorStringEnum.SHEET_METAL_INPUT_BODY_SHOULD_NOT_BE_SHEET_METAL, ["partToConvert"]);
    }

    var facesOnUnknownBodies = evaluateQuery(context, qSubtraction(qOwnerBody(definition.facesToExclude), definition.partToConvert));
    if (size(facesOnUnknownBodies) > 0)
    {
        reportFeatureWarning(context, id, ErrorStringEnum.FACES_NOT_OWNED_BY_PARTS);
    }
    var edgesOnUnknownBodies = evaluateQuery(context, qSubtraction(qOwnerBody(definition.bends), definition.partToConvert));
    if (size(edgesOnUnknownBodies) > 0)
    {
        reportFeatureWarning(context, id, ErrorStringEnum.EDGES_NOT_OWNED_BY_PARTS);
    }

    var complimentFacesQ = qSubtraction(qOwnedByBody(definition.partToConvert, EntityType.FACE), definition.facesToExclude);

    var nFacesToExclude = size(evaluateQuery(context, definition.facesToExclude));
    var nComplimentFaces = size(evaluateQuery(context, complimentFacesQ));
    var nBends = size(evaluateQuery(context, definition.bends));

    if (definition.supportRolled == true)
    {
        throwOnUnsupportedFaces(context, complimentFacesQ, ["partToConvert", "facesToExclude"]);
    }
    else
    {
        // Let's be careful to screen out unwanted faces here, i.e. anything that isn't planar
        var planarFaces = qGeometry(complimentFacesQ, GeometryType.PLANE);
        var badFaces = qSubtraction(complimentFacesQ, planarFaces);
        if (size(evaluateQuery(context, badFaces)) > 0)
        {
            throw regenError(ErrorStringEnum.SHEET_METAL_CONVERT_PLANE, ["partToConvert", "facesToExclude"], badFaces);
        }
    }

    var bendsQ = convertFaces(context, id, definition, complimentFacesQ, true);
    definition.remindToSelectBends = (nBends == 0 && nFacesToExclude > 0 && nComplimentFaces > 1);
    annotateConvertedFaces(context, id, definition, bendsQ);
}

function convertFaces(context is Context, id is Id, definition, faces is Query, trimWithFacesAround is boolean) returns Query
{
    var surfaceId = id + "extractSurface";
    var bendsQ = startTracking(context, { "subquery" : definition.bends });
    var offset = computeSurfaceOffset(context, definition);

    try
    {
        opExtractSurface(context, surfaceId, {
                    "faces" : faces,
                    "offset" : offset,
                    "useFacesAroundToTrimOffset" : trimWithFacesAround,
                    "tangentPropagation" : definition.tangentPropagation });
    }
    catch
    {
        throw regenError(ErrorStringEnum.SHEET_METAL_CANNOT_THICKEN, ["partToConvert", "facesToExclude", "regions"]);
    }

    return bendsQ;
}

function annotateConvertedFaces(context is Context, id is Id, definition, bendsQuery is Query)
{
    try
    {
        var thicknessDirection = getThicknessDirection(context, definition);
        annotateSmSurfaceBodies(context, id, {
                    "surfaceBodies" : qCreatedBy(id, EntityType.BODY),
                    "bendEdgesAndFaces" : bendsQuery,
                    "specialRadiiBends" : [],
                    "defaultRadius" : definition.radius,
                    "controlsThickness" : true,
                    "thickness" : definition.thickness,
                    "thicknessDirection" : thicknessDirection,
                    "minimalClearance" : definition.minimalClearance,
                    "kFactor" : definition.kFactor,
                    "kFactorRolled" : definition.kFactorRolled,
                    "defaultTwoCornerStyle" : getDefaultTwoCornerStyle(definition),
                    "defaultThreeCornerStyle" : getDefaultThreeCornerStyle(definition),
                    "defaultBendReliefStyle" : getDefaultBendReliefStyle(definition),
                    "defaultCornerReliefScale" : definition.defaultCornerReliefScale,
                    "defaultRoundReliefDiameter" : definition.defaultRoundReliefDiameter,
                    "defaultSquareReliefWidth" : definition.defaultSquareReliefWidth,
                    "defaultBendReliefDepthScale" : definition.defaultBendReliefDepthScale,
                    "defaultBendReliefScale" : definition.defaultBendReliefScale}, 0);
        if (getFeatureError(context, id) != undefined)
        {
            return;
        }
    }
    catch
    {
        throw regenError(ErrorStringEnum.SHEET_METAL_REBUILD_ERROR);
    }

    if (!definition.keepInputParts)
    {
        try
        {
            opDeleteBodies(context, id + "deleteBodies", {
                        "entities" : definition.partToConvert
                    });
        }
        catch
        {
            throw regenError(ErrorStringEnum.REGEN_ERROR);
        }
    }

    finalizeSheetMetalGeometry(context, id, qUnion([qCreatedBy(id, EntityType.FACE), qCreatedBy(id, EntityType.EDGE)]));
    if (definition.remindToSelectBends)
    {
        if (!featureHasNonTrivialStatus(context, id))
        {
            reportFeatureInfo(context, id, ErrorStringEnum.SHEET_METAL_START_SELECT_BENDS, ["bends"]);
        }
    }
}

function computeSurfaceOffset(context is Context, definition is map) returns ValueWithUnits
{
    var wallClearance = definition.clearance;
    if (definition.bendsIncluded)
    {
        var edges = evaluateQuery(context, qEntityFilter(definition.bends, EntityType.EDGE));
        if (size(edges) > 0)
        {
            for (var edge in edges)
            {
                var adjacentWalls = qSubtraction(qEdgeAdjacent(edge, EntityType.FACE), definition.facesToExclude);
                if (size(evaluateQuery(context, adjacentWalls)) == 0)
                {
                    continue;
                }
                var convexity = evEdgeConvexity(context, { "edge" : edge });
                if (definition.oppositeDirection)
                {
                    if (convexity != EdgeConvexityType.CONCAVE)
                    {
                        continue;
                    }
                }
                else
                {
                    if (convexity != EdgeConvexityType.CONVEX)
                    {
                        continue;
                    }
                }
                var eAngle = edgeAngle(context, edge);
                var cHalfAngle = cos(eAngle * 0.5);
                var clearance = definition.radius * (1 - cHalfAngle) + definition.clearance * cHalfAngle;
                if (clearance > wallClearance)
                {
                    wallClearance = clearance;
                }
            }
        }
    }
    var offset = wallClearance;
    if (!isAtVersionOrLater(context, FeatureScriptVersionNumber.V629_SM_MODEL_FRONT_N_BACK))
    {
       offset += 0.5 * definition.thickness;
    }
    if (definition.oppositeDirection)
    {
        offset = -offset;
    }
    return offset;
}

/*
 * Methods for EXTRUDE
 */

const DEPTH_MANIPULATOR = "depthManipulator";

function extrudeSheetMetal(context is Context, id is Id, definition is map)
{
    definition.trackingBendArcs = (definition.supportRolled == true) ? startTracking(context, definition.bendArcs) : qNothing();
    const sheetQuery = extrudeSketchCurves(context, id, definition);
    const createdSheetBodies = evaluateQuery(context, sheetQuery);
    if (size(createdSheetBodies) == 0)
    {
        throw regenError(ErrorStringEnum.EXTRUDE_SURF_NO_CURVE, ["sketchCurves"]);
    }

    if (!isAtVersionOrLater(context, FeatureScriptVersionNumber.V629_SM_MODEL_FRONT_N_BACK))
    {
        // Regardless of whether the sheets were created by curves or regions
        // we want to offset the sheet by half the thickness
        var oppositeOffset = definition.oppositeDirection;
        if (definition.oppositeExtrudeDirection == true)
        {
            oppositeOffset = !oppositeOffset;
        }
       offsetSheets(context, id, sheetQuery, definition.thickness, oppositeOffset);
    }
    const facesAndEdges = addSheetMetalDataToSheet(context, id, sheetQuery, definition);
    finalizeSheetMetalGeometry(context, id, facesAndEdges);
}

function offsetSheets(context is Context, id is Id, sheetQuery is Query, thickness is ValueWithUnits, oppositeDirection is boolean)
{
    try
    {
        opOffsetFace(context, id + "offsetFaces", {
                    "moveFaces" : qOwnedByBody(sheetQuery, EntityType.FACE),
                    "offsetDistance" : thickness * 0.5 * (oppositeDirection ? -1 : 1)
                });
    }
    catch
    {
        throw regenError(ErrorStringEnum.SHEET_METAL_TOO_THICK, ["thickness"]);
    }
}

function thickenToSheetMetal(context is Context, id is Id, definition is map)
{
    const evaluatedFaceQueries = evaluateQuery(context, definition.regions);
    const faceQueryCount = size(evaluatedFaceQueries);
    if (faceQueryCount == 0)
    {
        throw regenError(ErrorStringEnum.CANNOT_RESOLVE_ENTITIES, ["regions"]);
    }

    if (isAtVersionOrLater(context, FeatureScriptVersionNumber.V534_INFORM_IN_CONTEXT_SM_THICKEN))
    {
        if (faceQueryCount > 1)
        {
          const modifiable = size(evaluateQuery(context, qModifiableEntityFilter(definition.regions)));
          if (modifiable != faceQueryCount)
          {
            reportFeatureInfo(context, id, ErrorStringEnum.SHEET_METAL_THICKEN_IN_CONTEXT_INFO, ["regions"]);
          }
        }
    }

    var sketchPlaneToFacesMap = {};
    var facesToConvert = [];
    var index = 0;
    for (var evaluatedFace in evaluatedFaceQueries)
    {
        var key = try silent(evOwnerSketchPlane(context, { "entity" : evaluatedFace }));
        if (key == undefined)
        {
            facesToConvert = append(facesToConvert, evaluatedFace);
        }
        else
        {
            if (sketchPlaneToFacesMap[key] == undefined)
            {
                sketchPlaneToFacesMap[key] = [evaluatedFace];
            }
            else
            {
                sketchPlaneToFacesMap[key] = append(sketchPlaneToFacesMap[key], evaluatedFace);
            }
        }
    }

    index = 0;
    for (var entry in sketchPlaneToFacesMap)
    {
        var faceQueryArray = entry.value;

        definition.regions = qUnion(faceQueryArray);
        convertRegion(context, id + unstableIdComponent(index), definition);
        index += 1;
    }

    if (definition.supportRolled == true)
    {
        throwOnUnsupportedFaces(context, qUnion(facesToConvert), ["regions"]);
    }
    var bendsQ = qNothing();
    var nFaces = size(facesToConvert);
    var nBends = size(evaluateQuery(context, definition.bends));
    if (nFaces != 0)
    {
        var useFacesAround = !isAtVersionOrLater(context, FeatureScriptVersionNumber.V525_SM_THICKEN_NO_NEIGHBORS);
        facesToConvert = append(facesToConvert, qEntityFilter(definition.bends, EntityType.FACE));
        bendsQ = convertFaces(context, id, definition, qUnion(facesToConvert), useFacesAround);
    }
    definition.keepInputParts = true;
    definition.remindToSelectBends = (nFaces > 1 && nBends == 0);
    annotateConvertedFaces(context, id, definition, bendsQ);
}

function convertRegion(context is Context, id is Id, definition is map)
{
    const extrudeId = id + "extrude";
    const sign = definition.oppositeDirection ? -1 : 1;
    var startDepth = definition.clearance;
    if (isAtVersionOrLater(context, FeatureScriptVersionNumber.V629_SM_MODEL_FRONT_N_BACK))
    {
        if (!definition.oppositeDirection)
            startDepth += definition.thickness;
    }
    else
    {
        startDepth += 0.5 * definition.thickness;
    }

    try
    {
        opExtrude(context, extrudeId, {
                    "entities" : definition.regions,
                    "direction" : sign * evPlane(context, { "face" : definition.regions }).normal,
                    "endBound" : BoundingType.BLIND,
                    "endDepth" : startDepth + definition.thickness,
                    "startBound" : BoundingType.BLIND,
                    "startDepth" : -startDepth
                });
    }
    catch
    {
        throw regenError(ErrorStringEnum.SHEET_METAL_CANNOT_THICKEN, ["regions"]);
    }
    try
    {
        var createdQuery = qCreatedBy(extrudeId, EntityType.BODY);
        var isStartCap = true;
        opExtractSurface(context, id + "extract", { "faces" : qEntityFilter(qCapEntity(extrudeId, isStartCap), EntityType.FACE) });
        opDeleteBodies(context, id + "deleteBodies", {
                    "entities" : createdQuery
                });
    }
    catch
    {
        throw regenError(ErrorStringEnum.SHEET_METAL_REBUILD_ERROR);
    }
}

function extrudeSketchCurves(context is Context, id is Id, definition is map) returns Query
{
    var sketchCurves = (definition.supportRolled == true) ? qUnion([definition.bendArcs, definition.sketchCurves]) :
                                                    qGeometry(definition.sketchCurves, GeometryType.LINE);
    sketchCurves = qConstructionFilter(sketchCurves, ConstructionObject.NO);
    const resolvedEntities = evaluateQuery(context, sketchCurves);
    if (size(resolvedEntities) > 0)
    {
        const extrudeAxis = getExtrudeDirection(context, resolvedEntities[0]);
        addExtrudeManipulator(context, id, definition, extrudeAxis);
        const extrudeId = id + "extrude";

        definition.entities = sketchCurves;
        definition.direction = extrudeAxis.direction;
        if (definition.oppositeExtrudeDirection)
            definition.direction *= -1;

        if (definition.depth != undefined && definition.depth < 0)
        {
            definition.depth *= -1;
            if (definition.endBound == SMExtrudeBoundingType.BLIND)
                definition.direction *= -1;
        }

        definition.startBound = BoundingType.BLIND;
        definition.startDepth = 0;
        definition.endDepth = definition.depth;
        definition.isStartBoundOpposite = false;

        if (definition.endBound == SMExtrudeBoundingType.SYMMETRIC)
        {
            definition.endBound = BoundingType.BLIND;
            definition.startDepth = definition.depth * -0.5;
            definition.endDepth = definition.depth * 0.5;
        }

        opExtrude(context, extrudeId, definition);
        return qCreatedBy(extrudeId, EntityType.BODY);
    }
    return qNothing();
}

function getExtrudeDirection(context is Context, entity is Query)
{
    const tangentAtEdge = evEdgeTangentLine(context, { "edge" : entity, "parameter" : 0.5 });
    const entityPlane = evOwnerSketchPlane(context, { "entity" : entity });
    var direction = entityPlane.normal;
    return line(tangentAtEdge.origin, direction);
}

function addExtrudeManipulator(context is Context, id is Id, definition is map, extrudeAxis is Line)
{
    var offset = definition.depth;
    if (definition.endBound == SMExtrudeBoundingType.SYMMETRIC)
        offset *= 0.5;
    if (definition.oppositeExtrudeDirection)
        offset *= -1;
    addManipulators(context, id, { (DEPTH_MANIPULATOR) :
                    linearManipulator(extrudeAxis.origin,
                        extrudeAxis.direction,
                        offset,
                        definition.entities) });
}

function addSheetMetalDataToSheet(context is Context, id is Id, surfaceBodies is Query, definition is map) returns Query
{
    var sharpEdges = [];
    for (var edge in evaluateQuery(context, qOwnedByBody(surfaceBodies, EntityType.EDGE)))
    {
        if (!edgeIsTwoSided(context, edge))
        {
            continue;
        }
        var convexity = evEdgeConvexity(context, { "edge" : edge });
        if (convexity == EdgeConvexityType.CONVEX || convexity == EdgeConvexityType.CONCAVE)
        {
            sharpEdges = append(sharpEdges, edge);
        }
    }

    var thicknessDirection = getThicknessDirection(context, definition);
    var surfaceData =
    {
        "defaultRadius" : definition.radius,
        "surfaceBodies" : surfaceBodies,
        "bendEdgesAndFaces" : qUnion([qUnion(sharpEdges), definition.trackingBendArcs]),
        "specialRadiiBends" : [],
        "thickness" : definition.thickness,
        "thicknessDirection" : thicknessDirection,
        "controlsThickness" : true,
        "minimalClearance" : definition.minimalClearance,
        "kFactor" : definition.kFactor,
        "kFactorRolled" : definition.kFactorRolled,
        "defaultTwoCornerStyle" : getDefaultTwoCornerStyle(definition),
        "defaultThreeCornerStyle" : getDefaultThreeCornerStyle(definition),
        "defaultBendReliefStyle" : getDefaultBendReliefStyle(definition),
        "defaultCornerReliefScale" : definition.defaultCornerReliefScale,
        "defaultRoundReliefDiameter" : definition.defaultRoundReliefDiameter,
        "defaultSquareReliefWidth" : definition.defaultSquareReliefWidth,
        "defaultBendReliefDepthScale" : definition.defaultBendReliefDepthScale,
        "defaultBendReliefScale" : definition.defaultBendReliefScale
    };

    try
    {
        annotateSmSurfaceBodies(context, id, surfaceData, 0);
        if (getFeatureError(context, id) != undefined)
        {
            return qNothing();
        }
    }
    catch
    {
        throw regenError(ErrorStringEnum.SHEET_METAL_CANNOT_THICKEN);
    }

    return qUnion([qOwnedByBody(surfaceData.surfaceBodies, EntityType.FACE), qUnion(sharpEdges)]);
}

function getDefaultTwoCornerStyle(definition is map) returns SMReliefStyle
{
    if (definition.defaultCornerStyle == SMCornerStrategyType.RECTANGLE)
    {
        return SMReliefStyle.RECTANGLE;
    }
    else if (definition.defaultCornerStyle == SMCornerStrategyType.ROUND)
    {
        return SMReliefStyle.ROUND;
    }
    else if (definition.defaultCornerStyle == SMCornerStrategyType.SIZED_ROUND)
    {
        return SMReliefStyle.SIZED_ROUND;
    }
    else if (definition.defaultCornerStyle == SMCornerStrategyType.SIZED_RECTANGLE)
    {
        return SMReliefStyle.SIZED_RECTANGLE;
    }
    else if (definition.defaultCornerStyle == SMCornerStrategyType.CLOSED)
    {
        return SMReliefStyle.CLOSED;
    }
    else if (definition.defaultCornerStyle == SMCornerStrategyType.SIMPLE)
    {
        return SMReliefStyle.SIMPLE;
    }
    else
    {
        return SMReliefStyle.RECTANGLE;
    }
}

function getDefaultThreeCornerStyle(definition is map) returns SMReliefStyle
{
    if (definition.defaultCornerStyle == SMCornerStrategyType.RECTANGLE)
    {
        return SMReliefStyle.RECTANGLE;
    }
    else if (definition.defaultCornerStyle == SMCornerStrategyType.ROUND)
    {
        return SMReliefStyle.ROUND;
    }
    else if (definition.defaultCornerStyle == SMCornerStrategyType.SIMPLE)
    {
        return SMReliefStyle.SIMPLE;
    }
    else
    {
        return SMReliefStyle.RECTANGLE;
    }
}

function getDefaultBendReliefStyle(definition is map) returns SMReliefStyle
{
    if (definition.defaultBendReliefStyle == SMBendStrategyType.RECTANGLE)
    {
        return SMReliefStyle.RECTANGLE;
    }
    else if (definition.defaultBendReliefStyle == SMBendStrategyType.OBROUND)
    {
        return SMReliefStyle.OBROUND;
    }
    else if (definition.defaultBendReliefStyle == SMBendStrategyType.TEAR)
    {
        return SMReliefStyle.TEAR;
    }
    else
    {
        return SMReliefStyle.OBROUND;
    }
}

function throwOnUnsupportedFaces(context is Context, faceQ is Query, parameterIds is array)
{
    const supportedGeomTypes = [GeometryType.PLANE, GeometryType.CYLINDER, GeometryType.EXTRUDED];
    var allowedQs = [];
    for (var geom in supportedGeomTypes)
    {
        allowedQs = append(allowedQs, qGeometry(faceQ, geom));
    }
    const unsupportedQ = qSubtraction(faceQ, qUnion(allowedQs));
    if (size(evaluateQuery(context, unsupportedQ)) > 0)
    {
        throw regenError(ErrorStringEnum.SHEET_METAL_INVALID_FACE, parameterIds, unsupportedQ);
    }
}

/*
 * Methods for RECOGNIZE
 */

/**
 *  @internal
 *  This function uses evOffsetDetection functionality to recognize sheet metal body,
 *  extracts definition sheet surface, replaces cylinders with sharp edges, when possible.
 *  Sheet body is annotated as Model, planar faces are annotated as Walls,
 *  cylinders or sharp edges replacing them are annotated as Bends preserving original radius,
 *  Original sharp edges are annotated as Bends of input radius. TODO : recognize Rips.
 */
annotation { "Feature Type Name" : "Recognize"}
export const sheetMetalRecognize = defineSheetMetalFeature(function(context is Context, id is Id, definition is map)
precondition
{
}
{
    var associationAttributes = getAttributes(context, {
            "entities" : definition.bodies,
            "attributePattern" : {} as SMAssociationAttribute
        });
    if (size(associationAttributes) != 0)
    {
        throw regenError(ErrorStringEnum.SHEET_METAL_INPUT_BODY_SHOULD_NOT_BE_SHEET_METAL, ["bodies"]);
    }
    var offsetGroups = evOffsetDetection(context, definition);

    if (size(offsetGroups) != size(evaluateQuery(context, definition.bodies)))
    {
        //TODO: - actually a group per body check
        throw regenError(ErrorStringEnum.SHEET_METAL_CANNOT_RECOGNIZE_PARTS, ["bodies"]);
    }

    var objectCount = 0;
    var groupCount = 0;
    var smFacesAndEdgesQ = qNothing();
    for (var group in offsetGroups)
    {
        var surfaceId = id + ("surface_" ~ groupCount);
        var surfaceData = makeSurfaceBody(context, surfaceId, group);
        surfaceData.defaultRadius = definition.radius;
        surfaceData.controlsThickness = definition.changeThickness;
        if (definition.changeThickness)
        {
            surfaceData.thickness = definition.thickness;
        }
        surfaceData.kFactor = definition.kFactor;
        surfaceData.minimalClearance = definition.minimalClearance;
        groupCount += 1;
        smFacesAndEdgesQ = qUnion([smFacesAndEdgesQ, qCreatedBy(surfaceId, EntityType.FACE), qCreatedBy(surfaceId, EntityType.EDGE)]);
        objectCount = annotateSmSurfaceBodies(context, id, surfaceData, objectCount);
        if (getFeatureError(context, id) != undefined)
        {
            return;
        }
    }
    if (!definition.keepInputParts)
    {
        try
        {
            opDeleteBodies(context, id + "deleteBodies", {
                        "entities" : definition.bodies
                    });
        }
        catch
        {
            throw regenError(ErrorStringEnum.REGEN_ERROR);
        }
    }

    finalizeSheetMetalGeometry(context, id, smFacesAndEdgesQ);
}, {"kFactor" : 0.45, "minimalClearance" : 2e-5 * meter});

function makeSurfaceBody(context is Context, id is Id, group is map)
{
    var out = { "thickness" : 0.5 * (group.offsetLow + group.offsetHigh),
                "thicknessDirection" : SMThicknessDirection.BACK };
    try
    {
        opExtractSurface(context, id, {
                    "faces" : qUnion(group.side0),
                    "offset" : 0.0,
                    "useFacesAroundToTrimOffset" : true
                });
        var srfBodies = evaluateQuery(context, qCreatedBy(id, EntityType.BODY));
        if (size(srfBodies) != 1)
        {
            throw regenError("Unexpected number of surfaces extracted");
        }
        out.surfaceBodies = srfBodies[0];
    }
    catch
    {
        throw regenError(ErrorStringEnum.SHEET_METAL_CANNOT_THICKEN, ["bodies"]);
    }

    //Collect sharp edges to mark them as default radius bends
    var sharpEdges = [];
    for (var edge in evaluateQuery(context, qOwnedByBody(out.surfaceBodies, EntityType.EDGE)))
    {
        if (!edgeIsTwoSided(context, edge))
        {
            continue;
        }
        var convexity = evEdgeConvexity(context, { "edge" : edge });
        if (convexity == EdgeConvexityType.CONVEX || convexity == EdgeConvexityType.CONCAVE)
        {
            sharpEdges = append(sharpEdges, edge);
        }
    }
    out.bendEdgesAndFaces = qUnion(sharpEdges);

    // remove cylindrical faces where possible and collect replacement edges with radius data
    // TODO: when moveEdge functionality is available try extract planar faces,
    // extend to other side of bend or rip and merge
    out.specialRadiiBends = [];
    var cylFaces = evaluateQuery(context, qGeometry(qOwnedByBody(out.surfaceBodies, EntityType.FACE), GeometryType.CYLINDER));
    for (var i = 0; i < size(cylFaces); i += 1)
    {
        var cylSurface = evSurfaceDefinition(context, {
                "face" : cylFaces[i]
            });
        var boundingFaces = evaluateQuery(context, qEdgeAdjacent(cylFaces[i], EntityType.FACE));
        if (size(boundingFaces) != 2)
        {
            continue;
        }
        try
        {
            var removeFilletId = id + ("removeFillet_" ~ i);
            opModifyFillet(context, removeFilletId, {
                        "faces" : cylFaces[i],
                        "modifyFilletType" : ModifyFilletType.REMOVE_FILLET
                    });

            var edges = evaluateQuery(context, qIntersection([qEdgeAdjacent(boundingFaces[0], EntityType.EDGE),
                        qEdgeAdjacent(boundingFaces[1], EntityType.EDGE)]));
            for (var edge in edges)
            {
                var convexity = evEdgeConvexity(context, { "edge" : edge });
                var bendRadius = (convexity == EdgeConvexityType.CONVEX) ? cylSurface.radius - out.thickness : cylSurface.radius;
                out.specialRadiiBends = append(out.specialRadiiBends, [edge, bendRadius]);
            }
        }
        catch
        {
        }
    }
    return out;
}

function getThicknessDirection(context is Context, startModelDefinition is map) returns SMThicknessDirection
{
    if (!isAtVersionOrLater(context, FeatureScriptVersionNumber.V629_SM_MODEL_FRONT_N_BACK))
    {
        return SMThicknessDirection.BOTH;
    }
    var oppositeDirection = startModelDefinition.oppositeDirection;
    if (startModelDefinition.process == SMProcessType.EXTRUDE &&
        startModelDefinition.oppositeExtrudeDirection == true)
    {
        //Flipping direction of extrude flips surface orientation
        // Flip material side here so that result is symmetric
        // with respect to the sketch plane.
        oppositeDirection = !oppositeDirection;
    }
    return (oppositeDirection) ? SMThicknessDirection.BACK : SMThicknessDirection.FRONT;
}

/**
 * @internal
 */
export function sheetMetalStartManipulatorChange(context is Context, definition is map, newManipulators is map) returns map
{
    if (newManipulators[DEPTH_MANIPULATOR] is map)
    {
        var newOffset = newManipulators[DEPTH_MANIPULATOR].offset;
        if (definition.endBound == SMExtrudeBoundingType.SYMMETRIC)
            newOffset *= 2;
        definition.oppositeExtrudeDirection = newOffset < 0 * meter;
        definition.depth = abs(newOffset);
    }

    return definition;
}

/**
 * @internal
 */
export function sheetMetalStartEditLogic(context is Context, id is Id, oldDefinition is map, definition is map,
    specifiedParameters is map, hiddenBodies is Query) returns map
{
    if (oldDefinition == {})
    {
        const bodies = qEntityFilter(definition.initEntities, EntityType.BODY);
        const faces = qEntityFilter(definition.initEntities, EntityType.FACE);
        const edges = qModifiableEntityFilter(qEntityFilter(definition.initEntities, EntityType.EDGE));
        definition.process = SMProcessType.CONVERT;
        if (size(evaluateQuery(context, bodies)) > 0)
        {
            definition.partToConvert = bodies;
        }
        else if (size(evaluateQuery(context, faces)) > 0)
        {
            definition.regions = faces;
            definition.process = SMProcessType.THICKEN;
        }
        else if (size(evaluateQuery(context, edges)) > 0)
        {
            definition.sketchCurves = edges;
            definition.process = SMProcessType.EXTRUDE;
        }
        // Clear out the pre-selection data: this is especially important if the query is to imported data
        definition.initEntities = qNothing();
    }
    return definition;
}
