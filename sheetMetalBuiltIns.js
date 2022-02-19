FeatureScript 9999; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present Onshape Inc.

import(path : "onshape/std/query.fs", version : "");
import(path : "onshape/std/context.fs", version : "");

/**
 * @internal
 */
export function queryContainsFlattenedSheetMetal(context is Context, query is Query) returns boolean
{
    return @queryContainsFlattenedSheetMetal(context, { "entities" : query });
}