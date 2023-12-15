FeatureScript 2221; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present Onshape Inc.

// Imports used in interface
export import(path : "onshape/std/profilecontrolmode.gen.fs", version : "2221.0");
export import(path : "onshape/std/query.fs", version : "2221.0");
export import(path : "onshape/std/tool.fs", version : "2221.0");

// Imports used internally
import(path : "onshape/std/boolean.fs", version : "2221.0");
import(path : "onshape/std/booleanHeuristics.fs", version : "2221.0");
import(path : "onshape/std/containers.fs", version : "2221.0");
import(path : "onshape/std/evaluate.fs", version : "2221.0");
import(path : "onshape/std/topologyUtils.fs", version : "2221.0");
import(path : "onshape/std/transform.fs", version : "2221.0");
import(path : "onshape/std/feature.fs", version : "2221.0");

/**
 * Feature performing an [opSweep], followed by an [opBoolean]. For simple sweeps, prefer using
 * [opSweep] directly.
 */
annotation { "Feature Type Name" : "Sweep",
             "Filter Selector" : "allparts",
             "Editing Logic Function" : "sweepEditLogic" }
export const sweep = defineFeature(function(context is Context, id is Id, definition is map)
    precondition
    {
        annotation { "Name" : "Creation type", "UIHint" : [UIHint.HORIZONTAL_ENUM, UIHint.REMEMBER_PREVIOUS_VALUE]}
        definition.bodyType is ToolBodyType;

        if (definition.bodyType == ToolBodyType.SOLID)
        {
            booleanStepTypePredicate(definition);

            annotation { "Name" : "Faces and sketch regions to sweep",
                         "Filter" : (EntityType.FACE && GeometryType.PLANE) && ConstructionObject.NO }
            definition.profiles is Query;
        }
        else
        {
            surfaceOperationTypePredicate(definition);

            annotation { "Name" : "Edges and sketch curves to sweep",
                         "Filter" : (EntityType.EDGE && ConstructionObject.NO) || (EntityType.BODY && BodyType.WIRE)}
            definition.surfaceProfiles is Query;
        }

        annotation { "Name" : "Sweep path", "Filter" : (EntityType.EDGE && ConstructionObject.NO)  || (EntityType.BODY && BodyType.WIRE) }
        definition.path is Query;

        annotation { "Name" : "Profile control", "Default" : ProfileControlMode.NONE }
        definition.profileControl is ProfileControlMode;

        if (definition.profileControl == ProfileControlMode.LOCK_FACES)
        {
            annotation { "Name" : "Faces to lock", "Filter" : EntityType.FACE && ConstructionObject.NO }
            definition.lockFaces is Query;
        }
        else if (definition.profileControl == ProfileControlMode.LOCK_DIRECTION)
        {
            annotation { "Name" : "Direction to lock", "Filter" : QueryFilterCompound.ALLOWS_DIRECTION || BodyType.MATE_CONNECTOR, "MaxNumberOfPicks" : 1 }
            definition.lockDirectionQuery is Query;
        }

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
        if (isAtVersionOrLater(context, FeatureScriptVersionNumber.V203_SWEEP_PATH_NO_CONSTRUCTION))
        {
            const pathQuery = definition.path;
            definition.path = qConstructionFilter(definition.path, ConstructionObject.NO);
            if (pathQuery.queryType == QueryType.UNION && size(pathQuery.subqueries) > 0)
            {
                verifyNonemptyQuery(context, definition, "path", ErrorStringEnum.SWEEP_PATH_NO_CONSTRUCTION);
            }
            if (isAtVersionOrLater(context, FeatureScriptVersionNumber.V576_GET_WIRE_LAMINAR_DEPENDENCIES))
            {
                definition.path = followWireEdgesToLaminarSource(context, definition.path);
            }
        }
        if (definition.bodyType == ToolBodyType.SURFACE)
        {
            if (isAtVersionOrLater(context, FeatureScriptVersionNumber.V177_CONSTRUCTION_OBJECT_FILTER))
            {
                definition.profiles = qConstructionFilter(definition.surfaceProfiles, ConstructionObject.NO);
            }
            else
            {
                definition.profiles = definition.surfaceProfiles;
            }
            if (isAtVersionOrLater(context, FeatureScriptVersionNumber.V576_GET_WIRE_LAMINAR_DEPENDENCIES))
            {
                definition.profiles = followWireEdgesToLaminarSource(context, definition.profiles);
            }
            verifyNoMesh(context, { "surfaceProfiles" : definition.profiles }, "surfaceProfiles");
        }
        else
        {
            verifyNoMesh(context, definition, "profiles");
        }
        verifyNoMesh(context, definition, "path");

        var remainingTransform = getRemainderPatternTransform(context,
                {"references" : qUnion([definition.profiles, definition.path])});

        if (definition.profileControl == ProfileControlMode.KEEP_ORIENTATION)
        {
            definition.keepProfileOrientation = true;
        }
        else if (definition.profileControl == ProfileControlMode.LOCK_DIRECTION)
        {
            definition.lockDirection = extractDirection(context, definition.lockDirectionQuery);
            if (definition.lockDirection == undefined)
            {
                throw regenError(ErrorStringEnum.SWEEP_SELECT_DIRECTION, ["lockDirectionQuery"]);
            }
        }

        opSweep(context, id, definition);
        transformResultIfNecessary(context, id, remainingTransform);

        const reconstructOp = function(id)
        {
            opSweep(context, id, definition);
            transformResultIfNecessary(context, id, remainingTransform);
        };
        if (definition.bodyType == ToolBodyType.SOLID)
        {
            processNewBodyIfNeeded(context, id, definition, reconstructOp);
        }
        else if (definition.surfaceOperationType == NewSurfaceOperationType.ADD)
        {
            if (isAtVersionOrLater(context, FeatureScriptVersionNumber.V1197_DETECT_SURFACE_JOIN_CPP))
            {
                joinSurfaceBodiesWithAutoMatching(context, id, definition, false, reconstructOp);
            }
            else
            {
                var matches = createMatchesForSurfaceJoin(context, id, definition, remainingTransform);
                joinSurfaceBodies(context, id, matches, false, reconstructOp);
            }
        }
    }, { bodyType : ToolBodyType.SOLID, operationType : NewBodyOperationType.NEW, keepProfileOrientation : false, surfaceOperationType : NewSurfaceOperationType.NEW, defaultSurfaceScope : true, profileControl : ProfileControlMode.NONE });


/**
 * @internal
 * Editing logic function for sweep feature.
 */
export function sweepEditLogic(context is Context, id is Id, oldDefinition is map, definition is map,
    specifiedParameters is map, hiddenBodies is Query) returns map
{
    if (definition.bodyType == ToolBodyType.SOLID)
    {
        return booleanStepEditLogic(context, id, oldDefinition, definition,
                                    specifiedParameters, hiddenBodies, sweep);
    }
    else
    {
        return surfaceOperationTypeEditLogic(context, id, definition, specifiedParameters, definition.surfaceProfiles, hiddenBodies);
    }
}

function createMatchesForSurfaceJoin(context is Context, id is Id, definition is map, transform is Transform) returns array
{
    var matches = [];
    if (definition.bodyType == ToolBodyType.SURFACE && definition.surfaceOperationType == NewSurfaceOperationType.ADD)
    {
        var capMatches = createTopologyMatchesForSurfaceJoin(context, id, definition, qCapEntity(id, CapType.EITHER), definition.profiles, transform);
        var sweptMatches = createTopologyMatchesForSurfaceJoin(context, id, definition, makeQuery(id, "SWEPT_EDGE", EntityType.EDGE, {}), definition.path, transform);
        matches = concatenateArrays([capMatches, sweptMatches]);
        checkForNotJoinableSurfacesInScope(context, id, definition, matches);
    }
    return matches;
}
