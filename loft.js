FeatureScript 9999; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present Onshape Inc.

// Imports used in interface
export import(path : "onshape/std/query.fs", version : "");
export import(path : "onshape/std/tool.fs", version : "");

// Imports used internally
import(path : "onshape/std/containers.fs", version : "");
import(path : "onshape/std/evaluate.fs", version : "");
import(path : "onshape/std/boolean.fs", version : "");
import(path : "onshape/std/booleanHeuristics.fs", version : "");
import(path : "onshape/std/feature.fs", version : "");
import(path : "onshape/std/surfaceGeometry.fs", version : "");
import(path : "onshape/std/transform.fs", version : "");
import(path : "onshape/std/units.fs", version : "");
import(path : "onshape/std/valueBounds.fs", version : "");
import(path : "onshape/std/vector.fs", version : "");
import(path : "onshape/std/topologyUtils.fs", version : "");

/**
 * Specifies an end condition for one side of a loft.
 */
export enum LoftEndDerivativeType
{
    annotation { "Name" : "None" }
    DEFAULT,
    annotation { "Name" : "Normal to profile" }
    NORMAL_TO_PROFILE,
    annotation { "Name" : "Tangent to profile" }
    TANGENT_TO_PROFILE,
    annotation { "Name" : "Match tangent" }
    MATCH_TANGENT,
    annotation { "Name" : "Match curvature" }
    MATCH_CURVATURE
}

/**
 * Specifies derivative condition for a guide
 */
export enum LoftGuideDerivativeType
{
    annotation { "Name" : "None" }
    DEFAULT,
    annotation { "Name" : "Match tangent" }
    MATCH_TANGENT,
    annotation { "Name" : "Match curvature" }
    MATCH_CURVATURE
}

/**
 * Internal
 */
const LOFT_INTERNAL_SECTIONS_COUNT =
{
    (unitless) : [1, 5, 50]
}   as IntegerBoundSpec;


/**
 * Feature performing an [opLoft].
 */
annotation { "Feature Type Name" : "Loft",
             "Filter Selector" : "allparts",
             "Editing Logic Function" : "loftEditLogic" }
export const loft = defineFeature(function(context is Context, id is Id, definition is map)
    precondition
    {

        annotation { "Name" : "Creation type", "UIHint" : "HORIZONTAL_ENUM" }
        definition.bodyType is ToolBodyType;

        if (definition.bodyType == ToolBodyType.SOLID)
        {
            booleanStepTypePredicate(definition);
        }
        else
        {
            surfaceOperationTypePredicate(definition);
        }

        if (definition.bodyType == ToolBodyType.SOLID)
        {
            annotation { "Name" : "Profiles", "Item name" : "profile",
                "Driven query" : "sheetProfileEntities", "Item label template" : "#sheetProfileEntities", "UIHint" : "COLLAPSE_ARRAY_ITEMS" }
            definition.sheetProfilesArray is array;
            for (var profile in definition.sheetProfilesArray)
            {
                annotation { "Name" : "Faces and sketch regions",
                         "Filter" : (EntityType.FACE || EntityType.VERTEX ||
                                    (EntityType.BODY && BodyType.SHEET))
                                    && ConstructionObject.NO }
                profile.sheetProfileEntities is Query;
            }
        }
        else
        {
            annotation { "Name" : "Profiles", "Item name" : "profile",
                "Driven query" : "wireProfileEntities", "Item label template" : "#wireProfileEntities", "UIHint" : "COLLAPSE_ARRAY_ITEMS" }
            definition.wireProfilesArray is array;
            for (var profile in definition.wireProfilesArray)
            {
                annotation { "Name" : "Edges, curves and sketches",
                         "Filter" : (EntityType.VERTEX || EntityType.EDGE || EntityType.FACE ||
                                    (EntityType.BODY && (BodyType.WIRE || BodyType.SHEET)))
                                    && ConstructionObject.NO }
                profile.wireProfileEntities is Query;
            }
        }

        annotation { "Name" : "Start profile condition", "UIHint" : "SHOW_LABEL" }
        definition.startCondition is LoftEndDerivativeType;

        if (definition.startCondition != LoftEndDerivativeType.DEFAULT)
        {
            annotation { "Name" : "Start magnitude" }
            isReal(definition.startMagnitude, CLAMP_MAGNITUDE_REAL_BOUNDS);
        }

        annotation { "Name" : "End profile condition", "UIHint" : "SHOW_LABEL" }
        definition.endCondition is LoftEndDerivativeType;
        if (definition.endCondition != LoftEndDerivativeType.DEFAULT)
        {
            annotation { "Name" : "End magnitude" }
            isReal(definition.endMagnitude, CLAMP_MAGNITUDE_REAL_BOUNDS);
        }

        annotation { "Name" : "Guides and continuity" }
        definition.addGuides is boolean;

        if (definition.addGuides)
        {
            annotation { "Name" : "Guides", "Item name" : "guide",
                "Driven query" : "guideEntities", "Item label template" : "#guideEntities", "UIHint" : "COLLAPSE_ARRAY_ITEMS" }
            definition.guidesArray is array;
            for (var guide in definition.guidesArray)
            {
                annotation { "Name" : "Edges, curves and sketches", "Filter" : (EntityType.EDGE && ConstructionObject.NO) || (EntityType.BODY && BodyType.WIRE) }
                guide.guideEntities is Query;

                annotation { "Name" : "Continuity", "UIHint" : [ "SHOW_LABEL", "MATCH_LAST_ARRAY_ITEM" ] }
                guide.guideDerivativeType is LoftGuideDerivativeType;

                annotation { "Name" : "Magnitude", "UIHint" : "ALWAYS_HIDDEN" }
                isReal(guide.guideDerivativeMagnitude, CLAMP_MAGNITUDE_REAL_BOUNDS);
            }
        }

        annotation { "Name" : "Path" }
        definition.addSections is boolean;

        if (definition.addSections)
        {
            annotation { "Name" : "Edges, curves and sketches", "Filter" : (EntityType.EDGE && ConstructionObject.NO)  || (EntityType.BODY && BodyType.WIRE) }
            definition.spine is Query;

            annotation { "Name" : "Section count"}
            isInteger(definition.sectionCount, LOFT_INTERNAL_SECTIONS_COUNT);
        }

        annotation { "Name" : "Match vertices" }
        definition.matchVertices is boolean;
        if (definition.matchVertices)
        {
            annotation { "Name" : "Vertices", "Filter" : EntityType.VERTEX }
            definition.vertices is Query;
        }

        annotation { "Name" : "Make periodic", "UIHint" : "ALWAYS_HIDDEN" }
        definition.makePeriodic is boolean;

        if (definition.bodyType == ToolBodyType.SOLID)
        {
            booleanStepScopePredicate(definition);
        }
        else
        {
            surfaceJoinStepScopePredicate(definition);
        }
    }
    {
        definition.profileSubqueries = [];
        if (definition.bodyType == ToolBodyType.SURFACE)
        {
            definition.profileSubqueries = collectSubParameters(definition.wireProfilesArray, "wireProfileEntities");
            definition.profileSubqueries = replaceWireQueriesWithDependencies(context, definition.profileSubqueries, true);
            // Replace sketch faces with sketch wire edges so that created loft cap edges can be traced back easily and joined with other surfaces created from the same sketch.
            definition.profileSubqueries = replaceEndSketchFacesWithWireEdges(context, definition.profileSubqueries);
        }
        else
        {
            definition.profileSubqueries = collectSubParameters(definition.sheetProfilesArray, "sheetProfileEntities");
        }

        definition.profileSubqueries = wrapSubqueriesInConstructionFilter(context, definition.profileSubqueries);

        if (size(definition.profileSubqueries) < 1)
        {
            const errorEntities = (definition.bodyType == ToolBodyType.SOLID) ? "sheetProfilesArray" : "wireProfilesArray";
            throw regenError(ErrorStringEnum.LOFT_SELECT_PROFILES, [errorEntities]);
        }

        var queriesForTransform = definition.profileSubqueries;
        var derivatives = [];
        if (definition.addGuides)
        {
            definition.guideSubqueries = collectSubParameters(definition.guidesArray, "guideEntities");
            definition.guideSubqueries = replaceWireQueriesWithDependencies(context, definition.guideSubqueries, false);
            var setQueriesForTransformAfterConstructionFilter = isAtVersionOrLater(context, FeatureScriptVersionNumber.V683_LOFT_ARRAY_PARAMETERS);
            if (!setQueriesForTransformAfterConstructionFilter)
            {
                queriesForTransform = concatenateArrays([queriesForTransform, definition.guideSubqueries]);
            }
            definition.guideSubqueries = wrapSubqueriesInConstructionFilter(context, definition.guideSubqueries);
            if (setQueriesForTransformAfterConstructionFilter)
            {
                queriesForTransform = concatenateArrays([queriesForTransform, definition.guideSubqueries]);
            }
            derivatives = concatenateArrays([derivatives, collectGuideDerivatives(context, definition)]);
        }

        if (definition.startCondition != LoftEndDerivativeType.DEFAULT)
        {
            derivatives = append(derivatives, createProfileConditions(context, definition.startCondition,
                                                        definition.profileSubqueries[0], 0, definition.startMagnitude));
        }
        if (definition.endCondition != LoftEndDerivativeType.DEFAULT)
        {
            const lastProfileIndex = @size(definition.profileSubqueries) - 1;
            derivatives = append(derivatives, createProfileConditions(context, definition.endCondition,
                                                        definition.profileSubqueries[lastProfileIndex], lastProfileIndex, definition.endMagnitude));
        }
        definition.derivativeInfo = derivatives;

        if (definition.addSections)
        {
            var spineNoConstructionQuery = qConstructionFilter(definition.spine, ConstructionObject.NO);
            if (size(evaluateQuery(context, spineNoConstructionQuery)) == 0 && size(evaluateQuery(context, definition.spine)) != 0)
            {
                throw regenError(ErrorStringEnum.SWEEP_PATH_NO_CONSTRUCTION, ["spine"]);
            }
            if (definition.addGuides && size(evaluateQuery(context, definition.spine)) > 0 && size(definition.guideSubqueries) > 3 )
            {
                throw regenError(ErrorStringEnum.LOFT_SPINE_TOO_MANY_GUIDES, ["spine", "guides"]);
            }
            definition.spine = dissolveWires(spineNoConstructionQuery);
        }

        if (!definition.matchVertices)
        {
            definition.vertices = qUnion([]);
        }
        else
        {
            queriesForTransform = append(queriesForTransform, definition.vertices);
        }

        var remainingTransform = getRemainderPatternTransform(context,
                {"references" : qUnion(queriesForTransform)});
        opLoft(context, id, definition);
        transformResultIfNecessary(context, id, remainingTransform);

        const reconstructOp = function(id) {
            opLoft(context, id, definition);
            transformResultIfNecessary(context, id, remainingTransform);
        };

        if (definition.bodyType == ToolBodyType.SOLID)
        {
            processNewBodyIfNeeded(context, id, definition, reconstructOp);
        }
        else if (definition.surfaceOperationType == NewSurfaceOperationType.ADD)
        {
            var matches = createLoftTopologyMatchesForSurfaceJoin(context, id, definition, remainingTransform);
            joinSurfaceBodies(context, id, matches, false, reconstructOp);
        }

    }, { makePeriodic : false, bodyType : ToolBodyType.SOLID, operationType : NewBodyOperationType.NEW, addGuides : false, matchVertices : false,
        startCondition : LoftEndDerivativeType.DEFAULT, endCondition : LoftEndDerivativeType.DEFAULT,
        startMagnitude : 1, endMagnitude : 1, surfaceOperationType : NewSurfaceOperationType.NEW, addSections : false, sectionCount : 0, defaultSurfaceScope : true });

/** @internal */
export function createProfileConditions(context is Context, endCondition is LoftEndDerivativeType, profileQuery is Query, profileIndex is number, magnitude is number) returns map
{
    if (endCondition == LoftEndDerivativeType.NORMAL_TO_PROFILE || endCondition == LoftEndDerivativeType.TANGENT_TO_PROFILE)
    {
        var derivativeInfo = { "profileIndex" : profileIndex,
                               "magnitude" : magnitude,
                               "tangentToPlane" : endCondition == LoftEndDerivativeType.TANGENT_TO_PROFILE };
        var planeResult = try silent(evPlane(context, { "face" : profileQuery }));
        if (planeResult is Plane)
        {
            derivativeInfo.vector = normalize(planeResult.normal);
        }
        else
        {
            //it might be that we have just edges in the profile, if on sketch, use the sketch plane
            planeResult = try(evOwnerSketchPlane(context, {"entity" : profileQuery }));
            if (planeResult is Plane)
            {
               derivativeInfo.vector = normalize(planeResult.normal);
            }
            else
            {
                throw regenError(profileIndex == 0 ? ErrorStringEnum.LOFT_NO_PLANE_FOR_START_CLAMP : ErrorStringEnum.LOFT_NO_PLANE_FOR_END_CLAMP);
            }
        }
        return derivativeInfo;
    }
    else if (endCondition == LoftEndDerivativeType.MATCH_TANGENT ||
             endCondition == LoftEndDerivativeType.MATCH_CURVATURE)
    {
        const adjacentFaceQuery = qEdgeAdjacent(profileQuery, EntityType.FACE);
        if (@size(evaluateQuery(context, adjacentFaceQuery)) == 0)
        {
            throw regenError(profileIndex == 0 ? ErrorStringEnum.LOFT_NO_FACE_FOR_START_CLAMP : ErrorStringEnum.LOFT_NO_FACE_FOR_END_CLAMP);
        }
        const derivativeInfo = { "profileIndex" : profileIndex,
                                 "magnitude" : magnitude,
                                 "matchCurvature" : endCondition == LoftEndDerivativeType.MATCH_CURVATURE,
                                 "adjacentFaces" : qEdgeAdjacent(profileQuery, EntityType.FACE)};
        return derivativeInfo;
    }
}

/** @internal */
export function wrapSubqueriesInConstructionFilter(context is Context, subqueries is array) returns array
{
    if (isAtVersionOrLater(context, FeatureScriptVersionNumber.V177_CONSTRUCTION_OBJECT_FILTER))
    {
        var wrappedSubqueries = [];
        for (var i = 0; i < @size(subqueries); i += 1)
        {
            wrappedSubqueries = append(wrappedSubqueries, qConstructionFilter(subqueries[i], ConstructionObject.NO));
        }
        return wrappedSubqueries;
    }
    return subqueries;
}

/**
 * @internal
 * Editing logic function for loft feature.
 */
export function loftEditLogic(context is Context, id is Id, oldDefinition is map, definition is map,
    specifiedParameters is map, hiddenBodies is Query) returns map
{
    if (definition.bodyType == ToolBodyType.SOLID)
    {
        return booleanStepEditLogic(context, id, oldDefinition, definition,
                                specifiedParameters, hiddenBodies, loft);
    }
    else
    {
        return surfaceOperationTypeEditLogic(context, id, definition, specifiedParameters, wireProfilesAndGuides(definition), hiddenBodies);
    }
}

function wireProfilesAndGuides(definition is map) returns Query
{
    var subqueries = [];
    if (undefined != definition.wireProfilesArray)
    {
        subqueries = concatenateArrays([subqueries, collectSubParameters(definition.wireProfilesArray, "wireProfileEntities")]);
    }
    if (undefined != definition.guidesArray)
    {
        subqueries = concatenateArrays([subqueries, collectSubParameters(definition.guidesArray, "guideEntities")]);
    }
    return qUnion(subqueries);
}

function replaceWireSubQueriesWithDependencies(context is Context, query is Query) returns Query
precondition
{
    query.subqueries is array;
}
{
    const count = size(query.subqueries);
    for (var index = 0; index < count; index += 1)
    {
        query.subqueries[index] = followWireEdgesToLaminarSource(context, query.subqueries[index]);
    }
    return query;
}

function replaceSketchFaceWithWireEdges(context is Context, query is Query) returns Query
{
    var sketchFace = qSketchFilter(qEntityFilter(query, EntityType.FACE), SketchObject.YES);
    if (size(evaluateQuery(context, sketchFace)) == 0)
    {
        return query;
    }
    else
    {
        return qDependency(qEdgeAdjacent(sketchFace, EntityType.EDGE));
    }
}

function replaceEndSketchFacesWithWireEdges(context is Context, queries is array) returns array
{
    if (!isAtVersionOrLater(context, FeatureScriptVersionNumber.V657_SURFACE_JOIN_BUGS))
    {
        return queries;
    }

    const count = size(queries);
    if (count > 0)
    {
        queries[0] = replaceSketchFaceWithWireEdges(context, queries[0]);
    }

    if (count > 1)
    {
        queries[count - 1] = replaceSketchFaceWithWireEdges(context, queries[count - 1]);
    }

    return queries;
}

function replaceWireQueriesWithDependencies(context is Context, queries is array, firstAndLastOnly is boolean) returns array
{
    if (!isAtVersionOrLater(context, FeatureScriptVersionNumber.V576_GET_WIRE_LAMINAR_DEPENDENCIES))
    {
        return queries;
    }

    const count = size(queries);
    for (var index = 0; index < count; index += 1)
    {
        if (firstAndLastOnly && index != 0 && index != count - 1)
        {
            continue;
        }
        queries[index] = replaceWireSubQueriesWithDependencies(context, queries[index]);
    }

    return queries;
}

function collectSubParameters(parameterArray is array, parameterName is string) returns array
{
    var retSubParameters = [];

    for (var param in parameterArray)
    {
        retSubParameters = append(retSubParameters, param[parameterName]);
    }

    return retSubParameters;
}

function collectGuideDerivatives(context is Context, definition is map) returns array
{
    var derivatives = [];

    for (var index = 0; index < size(definition.guidesArray); index +=1)
    {
        var parameter = definition.guidesArray[index];
        if (parameter.guideDerivativeType != LoftGuideDerivativeType.DEFAULT)
        {
            const adjacentFaceQuery = qEdgeAdjacent(parameter.guideEntities, EntityType.FACE);
            if (@size(evaluateQuery(context, adjacentFaceQuery)) == 0)
            {
                throw regenError(ErrorStringEnum.LOFT_NO_FACE_FOR_GUIDE_CLAMP);
            }
            var derivativeInfo = { "profileIndex" : index,
                         "magnitude" : parameter.guideDerivativeMagnitude,
                         "matchCurvature" : parameter.guideDerivativeType == LoftGuideDerivativeType.MATCH_CURVATURE,
                         "adjacentFaces" : adjacentFaceQuery,
                         "forGuide" : true };
            derivatives = append(derivatives, derivativeInfo);
        }
    }

    return derivatives;
}

function createLoftTopologyMatchesForSurfaceJoin(context is Context, id is Id, definition is map, transform is Transform) returns array
{
    var matches = [];
    if (definition.bodyType == ToolBodyType.SURFACE && definition.surfaceOperationType == NewSurfaceOperationType.ADD)
    {
        var profileMatches = createTopologyMatchesForSurfaceJoin(context, id, definition, makeQuery(id, "MID_CAP_EDGE", EntityType.EDGE, {}), qUnion(definition.profileSubqueries), transform);

        if (undefined != definition.guideSubqueries)
        {
            var guideMatches = createTopologyMatchesForSurfaceJoin(context, id, definition, makeQuery(id, "SWEPT_EDGE", EntityType.EDGE, {}), qUnion(definition.guideSubqueries), transform);
            matches = concatenateArrays([profileMatches, guideMatches]);
        }
        else
        {
            matches = profileMatches;
        }
        checkForNotJoinableSurfacesInScope(context, id, definition, matches);
    }
    return matches;
}
