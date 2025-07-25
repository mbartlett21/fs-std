FeatureScript 2716; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present PTC Inc.

/**
 * This module makes most common Onshape Standard Library functions
 * available. It can be imported in place of `geometry.fs`,
 * ```import(path : "onshape/std/common.fs", version : "");```
 * into Feature Studios that do not require the full set of Onshape
 * Standard Library features.
 */
/* Feature basics */
export import(path : "onshape/std/context.fs", version : "2716.0");
export import(path : "onshape/std/defaultFeatures.fs", version : "2716.0");
export import(path : "onshape/std/feature.fs", version : "2716.0");
export import(path : "onshape/std/featureList.fs", version : "2716.0");
export import(path : "onshape/std/icon.gen.fs", version : "2716.0");
export import(path : "onshape/std/manipulator.fs", version : "2716.0");
export import(path : "onshape/std/partStudio.fs", version : "2716.0");
export import(path : "onshape/std/path.fs", version : "2716.0");

export import(path : "onshape/std/evaluate.fs", version : "2716.0");
export import(path : "onshape/std/query.fs", version : "2716.0");
export import(path : "onshape/std/edgetopology.gen.fs", version : "2716.0");
export import(path : "onshape/std/mateconnectoraxistype.gen.fs", version : "2716.0");

export import(path : "onshape/std/computedPartProperty.fs", version : "2716.0");
export import(path : "onshape/std/libraryValidation.fs", version : "2716.0");
export import(path : "onshape/std/table.fs", version : "2716.0");
export import(path : "onshape/std/templatestring.fs", version : "2716.0");
export import(path : "onshape/std/units.fs", version : "2716.0");
export import(path : "onshape/std/valueBounds.fs", version : "2716.0");

/* Math, string, vector, matrix, and support functions */
export import(path : "onshape/std/approximationUtils.fs", version : "2716.0");
export import(path : "onshape/std/attributes.fs", version : "2716.0");
export import(path : "onshape/std/box.fs", version : "2716.0");
export import(path : "onshape/std/containers.fs", version : "2716.0");
export import(path : "onshape/std/coordSystem.fs", version : "2716.0");
export import(path : "onshape/std/curveGeometry.fs", version : "2716.0");
export import(path : "onshape/std/debug.fs", version : "2716.0");
export import(path : "onshape/std/derive.fs", version : "2716.0");
export import(path : "onshape/std/instantiator.fs", version : "2716.0");
export import(path : "onshape/std/lookupTablePath.fs", version : "2716.0");
export import(path : "onshape/std/mathUtils.fs", version : "2716.0");
export import(path : "onshape/std/nurbsUtils.fs", version : "2716.0");
export import(path : "onshape/std/patternUtils.fs", version : "2716.0");
export import(path : "onshape/std/properties.fs", version : "2716.0");
export import(path : "onshape/std/wrapSurface.fs", version : "2716.0");
export import(path : "onshape/std/string.fs", version : "2716.0");
export import(path : "onshape/std/sheetMetalAttribute.fs", version : "2716.0");
export import(path : "onshape/std/splineUtils.fs", version : "2716.0");
export import(path : "onshape/std/surfaceGeometry.fs", version : "2716.0");
export import(path : "onshape/std/topologyUtils.fs", version : "2716.0");
export import(path : "onshape/std/tabReferences.fs", version : "2716.0");

/* Standard library features which are commonly useful in FeatureScript */
export import(path : "onshape/std/boolean.fs", version : "2716.0");
export import(path : "onshape/std/booleanHeuristics.fs", version : "2716.0");
export import(path : "onshape/std/primitives.fs", version : "2716.0");
export import(path : "onshape/std/sketch.fs", version : "2716.0");
export import(path : "onshape/std/variable.fs", version : "2716.0");
