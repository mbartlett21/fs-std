FeatureScript 593; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present Onshape Inc.

/**
 * This module makes all Onshape Standard Library features and functions
 * available.
 *
 * New Feature Studios begin with an import of this module,
 * ```import(path : "onshape/std/geometry.fs", version : "");```
 * with current version inserted (e.g. `300.0`). This gives that Feature Studio
 * access to all functions, types, enums, and constants defined in
 * the Onshape Standard Library.
 */
/* Feature basics */
export import(path : "onshape/std/context.fs", version : "593.0");
export import(path : "onshape/std/defaultFeatures.fs", version : "593.0");
export import(path : "onshape/std/feature.fs", version : "593.0");
export import(path : "onshape/std/featureList.fs", version : "593.0");
export import(path : "onshape/std/partStudio.fs", version : "593.0");

export import(path : "onshape/std/evaluate.fs", version : "593.0");
export import(path : "onshape/std/query.fs", version : "593.0");
export import(path : "onshape/std/uihint.gen.fs", version : "593.0");

export import(path : "onshape/std/units.fs", version : "593.0");
export import(path : "onshape/std/valueBounds.fs", version : "593.0");

/* Math, string, vector, matrix, and support functions */
export import(path : "onshape/std/box.fs", version : "593.0");
export import(path : "onshape/std/containers.fs", version : "593.0");
export import(path : "onshape/std/coordSystem.fs", version : "593.0");
export import(path : "onshape/std/curveGeometry.fs", version : "593.0");
export import(path : "onshape/std/debug.fs", version : "593.0");
export import(path : "onshape/std/mathUtils.fs", version : "593.0");
export import(path : "onshape/std/string.fs", version : "593.0");
export import(path : "onshape/std/surfaceGeometry.fs", version : "593.0");
export import(path : "onshape/std/topologyUtils.fs", version : "593.0");
export import(path : "onshape/std/attributes.fs", version : "593.0");
export import(path : "onshape/std/lookupTablePath.fs", version : "593.0");
export import(path : "onshape/std/sheetMetalAttribute.fs", version : "593.0");

/* Onshape standard library features */
export import(path : "onshape/std/boolean.fs", version : "593.0");
export import(path : "onshape/std/bridgingCurve.fs", version : "593.0");
export import(path : "onshape/std/chamfer.fs", version : "593.0");
export import(path : "onshape/std/cplane.fs", version : "593.0");
export import(path : "onshape/std/compositeCurve.fs", version : "593.0");
export import(path : "onshape/std/cpoint.fs", version : "593.0");
export import(path : "onshape/std/deleteBodies.fs", version : "593.0");
export import(path : "onshape/std/deleteFace.fs", version : "593.0");
export import(path : "onshape/std/draft.fs", version : "593.0");
export import(path : "onshape/std/extrude.fs", version : "593.0");
export import(path : "onshape/std/fillet.fs", version : "593.0");
export import(path : "onshape/std/fitSpline.fs", version : "593.0");
export import(path : "onshape/std/helix.fs", version : "593.0");
export import(path : "onshape/std/hole.fs", version : "593.0");
export import(path : "onshape/std/rib.fs", version : "593.0");
export import(path : "onshape/std/importDerived.fs", version : "593.0");
export import(path : "onshape/std/importForeign.fs", version : "593.0");
export import(path : "onshape/std/loft.fs", version : "593.0");
export import(path : "onshape/std/mateConnector.fs", version : "593.0");
export import(path : "onshape/std/mirror.fs", version : "593.0");
export import(path : "onshape/std/modifyFillet.fs", version : "593.0");
export import(path : "onshape/std/moveFace.fs", version : "593.0");
export import(path : "onshape/std/offsetSurface.fs", version : "593.0");
export import(path : "onshape/std/pattern.fs", version : "593.0");
export import(path : "onshape/std/primitives.fs", version : "593.0");
export import(path : "onshape/std/projectCurves.fs", version : "593.0");
export import(path : "onshape/std/replaceFace.fs", version : "593.0");
export import(path : "onshape/std/revolve.fs", version : "593.0");
export import(path : "onshape/std/sheetMetalBendRelief.fs", version : "593.0");
export import(path : "onshape/std/sheetMetalCorner.fs", version : "593.0");
export import(path : "onshape/std/sheetMetalCornerBreak.fs", version : "593.0");
export import(path : "onshape/std/sheetMetalEnd.fs", version : "593.0");
export import(path : "onshape/std/sheetMetalFlange.fs", version : "593.0");
export import(path : "onshape/std/sheetMetalJoint.fs", version : "593.0");
export import(path : "onshape/std/sheetMetalMakeJoint.fs", version : "593.0");
export import(path : "onshape/std/sheetMetalRip.fs", version : "593.0");
export import(path : "onshape/std/sheetMetalStart.fs", version : "593.0");
export import(path : "onshape/std/sheetMetalUnfold.fs", version : "593.0");
export import(path : "onshape/std/shell.fs", version : "593.0");
export import(path : "onshape/std/sketch.fs", version : "593.0");
export import(path : "onshape/std/sectionpart.fs", version : "593.0");
export import(path : "onshape/std/splitpart.fs", version : "593.0");
export import(path : "onshape/std/sweep.fs", version : "593.0");
export import(path : "onshape/std/thicken.fs", version : "593.0");
export import(path : "onshape/std/transformCopy.fs", version : "593.0");
export import(path : "onshape/std/variable.fs", version : "593.0");
export import(path : "onshape/std/booleanHeuristics.fs", version : "593.0");
export import(path : "onshape/std/nameEntity.fs", version : "593.0");

