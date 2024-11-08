FeatureScript 9999; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present Onshape Inc.

/**
 * This module refers to 3D bounding boxes, e.g. the result of a call to `evBox3d`.
 *
 * This is not to be confused with the [box](/FsDoc/variables.html#box) standard type used for references.
 */

import(path : "onshape/std/units.fs", version : "");
import(path : "onshape/std/vector.fs", version : "");

/**
 * A three-dimensional bounding box.
 *
 * @type {{
 *      @field minCorner {Vector}: A 3D position representing the corner with the smallest x, y, and z coordinates.
 *      @field maxCorner {Vector}: A 3D position representing the corner with the largest x, y, and z coordinates.
 * }}
 */
export type Box3d typecheck canBeBox3d;

/** Typecheck for [Box3d] */
export predicate canBeBox3d(value)
{
    value is map;
    is3dLengthVector(value.minCorner);
    is3dLengthVector(value.maxCorner);
    for (var dim in [0, 1, 2])
        value.minCorner[dim] <= value.maxCorner[dim];
}

/**
 * Construct a bounding box from two opposite corners.
 */
export function box3d(minCorner is Vector, maxCorner is Vector) returns Box3d
{
    for (var dim in [0, 1, 2])
    {
        if (minCorner[dim] > maxCorner[dim])
        {
            var tmp = maxCorner[dim];
            maxCorner[dim] = minCorner[dim];
            minCorner[dim] = tmp;
        }
    }
    return { 'minCorner' : minCorner, 'maxCorner' : maxCorner } as Box3d;
}

/**
 * Return an enlarged bounding box.
 * @param bBox {Box3d}
 * @param absoluteValue {ValueWithUnits} : The absolute distance to move
 *     each face of the box.  The corners move `sqrt(3)` times as far.
 * @param factor {number} : The relative amount to expand the box, with
 *     `0` leaving it unchanged.
 */
export function extendBox3d(bBox is Box3d, absoluteValue is ValueWithUnits, factor is number) returns Box3d
precondition
{
    isLength(absoluteValue);
}
{
    const midPoint is Vector = (bBox.minCorner + bBox.maxCorner) * 0.5;
    const halfDiagonal is Vector = (bBox.maxCorner - bBox.minCorner) * 0.5;
    const absoluteIncrement is Vector = vector(absoluteValue, absoluteValue, absoluteValue);

    return box3d(midPoint - absoluteIncrement - halfDiagonal * (1 + factor),
                 midPoint + absoluteIncrement + halfDiagonal * (1 + factor));

}

/**
 * Return the center of the bounding box.
 * @param bBox {Box3d}
 */
 export function box3dCenter(bBox is Box3d) returns Vector
 {
    return ((bBox.maxCorner + bBox.minCorner) / 2);
 }

/**
 * Whether the specified point is within the bounding box.
 * @param point {Vector}
 * @param bBox {Box3d}
 */
export predicate insideBox3d(point is Vector, bBox is Box3d)
{
    is3dLengthVector(point);

    for (var dim in [0, 1, 2])
    {
        tolerantEquals(point[dim], bBox.minCorner[dim]) || point[dim] > bBox.minCorner[dim];
        tolerantEquals(point[dim], bBox.maxCorner[dim]) || point[dim] < bBox.maxCorner[dim];
    }
}
