FeatureScript 2716; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present PTC Inc.

// Imports used in interface
export import(path : "onshape/std/query.fs", version : "2716.0");
export import(path : "onshape/std/tool.fs", version : "2716.0");

// Features using manipulators must export these.
export import(path : "onshape/std/manipulator.fs", version : "2716.0");
export import(path : "onshape/std/tool.fs", version : "2716.0");

// Imports used internally
import(path : "onshape/std/boolean.fs", version : "2716.0");
import(path : "onshape/std/booleanHeuristics.fs", version : "2716.0");
import(path : "onshape/std/evaluate.fs", version : "2716.0");
import(path : "onshape/std/feature.fs", version : "2716.0");
import(path : "onshape/std/valueBounds.fs", version : "2716.0");


/**
 * Feature performing an [opThicken], followed by an [opBoolean]. For simple thickens, prefer using
 * [opThicken] directly.
 */
annotation { "Feature Type Name" : "Thicken",
             "Filter Selector" : "allparts",
             "Editing Logic Function" : "thickenEditLogic" }
export const thicken = defineFeature(function(context is Context, id is Id, definition is map)
    precondition
    {
        booleanStepTypePredicate(definition);

        annotation { "Name" : "Faces and surfaces to thicken",
                    "Filter" : (EntityType.FACE || (BodyType.SHEET && EntityType.BODY && SketchObject.NO))
                        && ConstructionObject.NO }
        definition.entities is Query;

        annotation { "Name" : "Mid plane", "Default" : false }
        definition.midplane is boolean;

        if (!definition.midplane)
        {
            annotation { "Name" : "Thickness 1" }
            isLength(definition.thickness1, ZERO_INCLUSIVE_OFFSET_BOUNDS);

            annotation { "Name" : "Opposite direction", "UIHint" : UIHint.OPPOSITE_DIRECTION }
            definition.oppositeDirection is boolean;

            annotation { "Name" : "Thickness 2" }
            isLength(definition.thickness2, NONNEGATIVE_ZERO_DEFAULT_LENGTH_BOUNDS);
        }
        else
        {
            annotation { "Name" : "Thickness" }
            isLength(definition.thickness, ZERO_INCLUSIVE_OFFSET_BOUNDS);
        }

        annotation { "Name" : "Keep tools", "Default" : false }
        definition.keepTools is boolean;

        booleanStepScopePredicate(definition);
    }
    {
        verifyNoMesh(context, definition, "entities");

        // ------------- Determine the direction ---------------
        if (definition.midplane)
        {
            definition.thickness1 = definition.thickness / 2;
            definition.thickness2 = definition.thickness / 2;
        }
        else if (definition.oppositeDirection)
        {
            const temp = definition.thickness2;
            definition.thickness2 = definition.thickness1;
            definition.thickness1 = temp;
        }

        // ------------- Perform the operation ---------------
        var remainingTransform = getRemainderPatternTransform(context,
                {"references" : definition.entities});
        opThicken(context, id, definition);
        transformResultIfNecessary(context, id, remainingTransform);

        const reconstructOp = function(id) {
            opThicken(context, id, definition);
            transformResultIfNecessary(context, id, remainingTransform);
        };
        processNewBodyIfNeeded(context, id, definition, reconstructOp);
    }, { oppositeDirection : false, operationType : NewBodyOperationType.NEW, keepTools : true, midplane : false, thickness : 0.5 * inch });

/**
 * @internal
 * Implements heuristics for thicken feature.
 */
export function thickenEditLogic(context is Context, id is Id, oldDefinition is map, definition is map,
    specifiedParameters is map) returns map
{
    if (specifiedParameters.thickness2)
    {
        return definition;
    }

    // If flip has not been specified and there is no second direction we can adjust flip based on boolean operation
    if (!specifiedParameters.oppositeDirection)
    {
        if (canSetBooleanFlip(oldDefinition, definition, specifiedParameters))
        {
            definition.oppositeDirection = !definition.oppositeDirection;
        }
    }

    const logicMap = booleanStepEditLogicAnalysis(context, oldDefinition, definition, specifiedParameters);
    if (!logicMap.canDefineOperation && !logicMap.canDefineScope)
    {
        return definition;
    }
    const facesOfSolids = qBodyType(qEntityFilter(definition.entities, EntityType.FACE), BodyType.SOLID);
    const booleanScope = evaluateQuery(context, qOwnerBody(facesOfSolids));
    if (logicMap.canDefineOperation && booleanScope != [])
    {
        definition.operationType = (definition.oppositeDirection) ? NewBodyOperationType.REMOVE : NewBodyOperationType.ADD;
    }
    if (logicMap.canDefineScope)
    {
        definition.booleanScope = qUnion(booleanScope);
    }
    return definition;
}
