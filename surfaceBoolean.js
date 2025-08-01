FeatureScript 2716; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present PTC Inc.

/*
 ******************************************
 * Under development, not for general use!!
 ******************************************
 *
 * Note: When unioning sheets, the sheets must all be in proper orientation.
 */

export import(path : "onshape/std/booleanoperationtype.gen.fs", version : "2716.0");
export import(path : "onshape/std/splitoperationkeeptype.gen.fs", version : "2716.0");
import(path : "onshape/std/containers.fs", version : "2716.0");
import(path : "onshape/std/curveGeometry.fs", version : "2716.0");
import(path : "onshape/std/evaluate.fs", version : "2716.0");
import(path : "onshape/std/feature.fs", version : "2716.0");
import(path : "onshape/std/geomOperations.fs", version : "2716.0");
import(path : "onshape/std/math.fs", version : "2716.0");
import(path : "onshape/std/string.fs", version : "2716.0");
import(path : "onshape/std/vector.fs", version : "2716.0");

/**
 *@internal
 */
export function surfaceBooleanFunction(context is Context, id is Id, definition is map)
precondition
{
    definition.operationType is BooleanOperationType;
    definition.tools is Query;

    if (definition.operationType == BooleanOperationType.SUBTRACTION)
    {
        definition.targets is Query;
    }
    if (definition.operationType == BooleanOperationType.UNION)
    {
        definition.makeSolid is boolean;
    }
    else
    {
        definition.keepTools is boolean;
    }
}
{
    definition.allowSheets = true;
    opBoolean(context, id + "boolean", definition );
}

