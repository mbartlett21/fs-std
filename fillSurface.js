FeatureScript 2716; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present PTC Inc.

export import(path : "onshape/std/geometriccontinuity.gen.fs", version : "2716.0");
export import(path : "onshape/std/tool.fs", version : "2716.0");

import(path : "onshape/std/boolean.fs", version : "2716.0");
import(path : "onshape/std/containers.fs", version : "2716.0");
import(path : "onshape/std/feature.fs", version : "2716.0");
import(path : "onshape/std/query.fs", version : "2716.0");
import(path : "onshape/std/topologyUtils.fs", version : "2716.0");
import(path : "onshape/std/transform.fs", version : "2716.0");
import(path : "onshape/std/units.fs", version : "2716.0");
import(path : "onshape/std/valueBounds.fs", version : "2716.0");

/**
 * @internal
 * Whether we're using the guides as precise constraints or sampling them
 */
export enum FillConstraintMode
{
    annotation { "Name" : "Precise" }
    PRECISE,
    annotation { "Name" : "Sampled" }
    SAMPLED
}

/**
 * @internal
 * The bounds for number of samples used in constraint sampling.
 */
export const SAMPLE_BOUNDS =
{
    (unitless) : [1, 5, 50]
} as IntegerBoundSpec;

/**
 * Creates a surface bounded by input edges with prescribed continuity conditions, using [opFillSurface].
 */
annotation { "Feature Type Name" : "Fill" ,
            "Filter Selector" : "allparts",
            "Editing Logic Function" : "fillEditLogic" }
export const fill = defineFeature(function(context is Context, id is Id, definition is map)
    precondition
    {
        annotation { "Name" : "Preselection", "UIHint" : UIHint.ALWAYS_HIDDEN, "Filter" : ModifiableEntityOnly.YES && ((EntityType.EDGE && ConstructionObject.NO) || (EntityType.BODY && BodyType.WIRE && SketchObject.NO))}
        definition.preselectedEntities is Query;

        surfaceOperationTypePredicate(definition);

        annotation { "Name" : "Edges", "Item name" : "edge", "Driven query" : "entities", "Item label template" : "[#continuity] #entities", "UIHint" : UIHint.SHOW_CREATE_SELECTION }
        definition.edges is array;
        for (var edge in definition.edges)
        {
            annotation { "Name" : "Edges", "Filter" : ModifiableEntityOnly.YES && ((EntityType.EDGE && ConstructionObject.NO) || (EntityType.BODY && BodyType.WIRE && SketchObject.NO)),
                         "UIHint" : UIHint.ALWAYS_HIDDEN }
            edge.entities is Query;

            annotation { "Name" : "Continuity", "UIHint" : [ UIHint.SHOW_LABEL, UIHint.MATCH_LAST_ARRAY_ITEM ] }
            edge.continuity is GeometricContinuity;

            if (edge.continuity != GeometricContinuity.G0 && edge.adjacentFaces != undefined)
            {
                annotation { "Name" : "Adjacent faces", "Filter" : EntityType.FACE }
                edge.adjacentFaces is Query;
            }
        }

        annotation {"Name" : "Guides"}
        definition.addGuides is boolean;

        if (definition.addGuides)
        {
            annotation { "Name" : "Vertices or curves",
                     "Filter" : EntityType.VERTEX ||  EntityType.EDGE || (EntityType.BODY && BodyType.WIRE && SketchObject.NO)}
            definition.guideEntities is Query;

            annotation {"Name" : "Mode"}
            definition.constraintMode is FillConstraintMode;

            if (definition.constraintMode == FillConstraintMode.SAMPLED)
            {
                annotation {"Name" : "Sample size" }
                isInteger(definition.sampleSize, SAMPLE_BOUNDS);
            }
        }

        annotation {"Name" : "Show isocurves"}
        definition.showIsocurves is boolean;

        if (definition.showIsocurves)
        {
            annotation {"Name" : "Count" }
            isInteger(definition.curveCount, ISO_GRID_BOUNDS);
        }

        surfaceJoinStepScopePredicate(definition);
    }
    {
        if (definition.addGuides)
        {
            verifyNoMesh(context, definition, "guideEntities");
        }

        verifyNonemptyArray(context, definition, "edges", ErrorStringEnum.FILL_SURFACE_NO_EDGES);
        if (!definition.addGuides)
            definition.guideEntities = qNothing();

        definition.useSampling = (definition.constraintMode == FillConstraintMode.SAMPLED);
        definition = updateEdgeSelections(context, definition);

        verifyNoMesh(context, {"edges" : definition.allEdges}, "edges");

        var remainingTransform = getRemainderPatternTransform(context,
            {"references" : definition.allEdges });

        opFillSurface(context, id, definition);
        transformResultIfNecessary(context, id, remainingTransform);

        const reconstructOp = function(id)
            {
                opFillSurface(context, id, updateEdgeSelections(context, definition));
                transformResultIfNecessary(context, id, remainingTransform);
            };

        if (definition.surfaceOperationType == NewSurfaceOperationType.ADD)
        {
           if (isAtVersionOrLater(context, FeatureScriptVersionNumber.V1197_DETECT_SURFACE_JOIN_CPP))
           {
                joinSurfaceBodiesWithAutoMatching(context, id, definition, true, reconstructOp);
           }
           else
           {
                var matches = createTopologyMatchesForSurfaceJoin(context, id, definition, qCreatedBy(id, EntityType.EDGE),
                    definition.allEdges, remainingTransform);
                checkForNotJoinableSurfacesInScope(context, id, definition, matches);
                joinSurfaceBodies(context, id, matches, true, reconstructOp);
            }
            if (getFeatureInfo(context, id) == ErrorStringEnum.BOOLEAN_NO_TARGET_SURFACE ||
                    (getFeatureError(context, id) != undefined &&
                     getFeatureError(context, id) != ErrorStringEnum.BOOLEAN_NO_TARGET_SURFACE) )
            {
                //update error message to fill related one, and also error out when no matches could be found
                reportFeatureError(context, id, ErrorStringEnum.FILL_SURFACE_ATTACH_FAIL);
            }
        }
    }, { showIsocurves : false, preselectedEntities : qNothing(), defaultSurfaceScope : true, useSampling : false,
        addGuides : false, constraintMode : FillConstraintMode.PRECISE, curveCount : 10, sampleSize : 5});

function updateEdgeSelections(context is Context, definition is map) returns map
{
    var edgesG0 = [];
    var edgesG1 = [];
    var edgesG2 = [];
    var allEdges = [];
    var adjacentFaces = [];

    if (isAtVersionOrLater(context, FeatureScriptVersionNumber.V1890_FOLLOW_LAMINAR_SOURCE_COINCIDENCE_CHECK))
    {
        for (var edge in definition.edges)
        {
            var laminarEdges = qConstructionFilter(followWireEdgesToLaminarSource(context, edge.entities), ConstructionObject.NO);
            allEdges = append(allEdges, laminarEdges);
            if (edge.continuity == GeometricContinuity.G0)
            {
                edgesG0 = append(edgesG0, laminarEdges);
            }
            else
            {
                if (edge.adjacentFaces != undefined && !isQueryEmpty(context, edge.adjacentFaces))
                {
                    adjacentFaces = append(adjacentFaces, {"edges" : laminarEdges,
                                                        "faces" : edge.adjacentFaces});
                }
            }
            if (edge.continuity == GeometricContinuity.G1)
            {
                edgesG1 = append(edgesG1, laminarEdges);
            }
            if (edge.continuity == GeometricContinuity.G2)
            {
                edgesG2 = append(edgesG2, laminarEdges);
            }
        }
        definition.edgesG0 = qUnion(edgesG0);
        definition.edgesG1 = qUnion(edgesG1);
        definition.edgesG2 = qUnion(edgesG2);
        definition.allEdges = qUnion(allEdges);
        definition.adjacentFaces = adjacentFaces;
    }
    else
    {
        for (var edge in definition.edges)
        {
            allEdges = append(allEdges, edge.entities);
            if (edge.continuity == GeometricContinuity.G0)
            {
                edgesG0 = append(edgesG0, edge.entities);
            }
            if (edge.continuity == GeometricContinuity.G1)
            {
                edgesG1 = append(edgesG1, edge.entities);
            }
            if (edge.continuity == GeometricContinuity.G2)
            {
                edgesG2 = append(edgesG2, edge.entities);
            }
        }
        definition.edgesG0 = qConstructionFilter(followWireEdgesToLaminarSource(context, qUnion(edgesG0)), ConstructionObject.NO);
        definition.edgesG1 = qConstructionFilter(followWireEdgesToLaminarSource(context, qUnion(edgesG1)), ConstructionObject.NO);
        definition.edgesG2 = qConstructionFilter(followWireEdgesToLaminarSource(context, qUnion(edgesG2)), ConstructionObject.NO);
        definition.allEdges = qConstructionFilter(followWireEdgesToLaminarSource(context, qUnion(allEdges)), ConstructionObject.NO);
    }
    return definition;
}

/**
 * @internal
 * Editing logic function for `surface fill` feature.
 */
export function fillEditLogic(context is Context, id is Id, oldDefinition is map, definition is map,
    specifiedParameters is map, hiddenBodies is Query) returns map
{
    if (oldDefinition == {}) //preselection processing only
    {
        const preselections = evaluateQuery(context, definition.preselectedEntities);
        if (@size(preselections) > 0)
        {
            for (var selection in preselections)
            {
                definition.edges = append(definition.edges, {"entities" : qUnion([selection]), "continuity" : GeometricContinuity.G0});
            }
        }
        definition.preselectedEntities = qNothing();
    }

    var updatedDefinition = updateEdgeSelections(context, definition);
    return surfaceOperationTypeEditLogic(context, id, definition, specifiedParameters, updatedDefinition.allEdges, hiddenBodies);
}

