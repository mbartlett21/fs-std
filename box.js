FeatureScript 2716; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present PTC Inc.

/**
 * This module refers to 3D bounding boxes, e.g. the result of a call to `evBox3d`.
 *
 * This is not to be confused with the [box](/FsDoc/variables.html#box) standard type used for references.
 */

import(path : "onshape/std/units.fs", version : "2716.0");
import(path : "onshape/std/vector.fs", version : "2716.0");
import(path : "onshape/std/containers.fs", version : "2716.0");
import(path : "onshape/std/transform.fs", version : "2716.0");

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
 * Construct a bounding box containing all points in pointArray
 * @param pointArray {array}
 */
export function box3d(pointArray is array) returns Box3d
precondition
{
    size(pointArray) > 0;
    for (var point in pointArray)
    {
        is3dLengthVector(point);
    }
}
{
    var minPoint = pointArray[0];
    var maxPoint = minPoint;
    for (var i = 1; i < size(pointArray); i += 1)
    {
        for (var j = 0; j < 3; j += 1)
        {
            const pointCoord = pointArray[i][j];
            if (minPoint[j] > pointCoord)
            {
                minPoint[j] = pointCoord;
            }
            else if (maxPoint[j] < pointCoord)
            {
                maxPoint[j] = pointCoord;
            }
        }
    }
    return box3d(minPoint, maxPoint);
}

/**
 * Return a box aligned with transformed coordinate system containing the input box
 * @param boxIn {Box3d}
 * @param transformation {Transform}
 */
export function transformBox3d(boxIn is Box3d, transformation is Transform) returns Box3d
{
    var transformedPoints = [];
    var coords = makeArray(3, undefined);
    for (var i = 0; i < 3; i += 1)
    {
        coords[i] =  [boxIn.minCorner[i], boxIn.maxCorner[i]];
    }
    for (var x in coords[0])
    {
        for (var y in coords[1])
        {
            for (var z in coords[2])
            {
                transformedPoints = append(transformedPoints, transformation * vector(x, y, z));
            }
        }
    }
    return box3d(transformedPoints);
}

/**
 * Return an enlarged bounding box. The box is scaled by `1 + factor` around its midpoint, and then each face is
 * moved outward by `absoluteValue` (inward if `absoluteValue` is negative).
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
    const midPoint is Vector = box3dCenter(bBox);
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
 * Return the length of the diagonal from the `minCorner` to the `maxCorner` of the bounding box.
 */
export function box3dDiagonalLength(bBox is Box3d) returns ValueWithUnits
{
    return norm(bBox.maxCorner - bBox.minCorner);
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

/**
 * Returns all 8 corners of a Box3d as an array of Vectors.
 * @param bBox {Box3d}
 */
export function box3dAllCorners(bBox is Box3d) returns array
{
    var corners = [];
    for (var i = 0; i < 2; i += 1)
    {
        for (var j = 0; j < 2; j += 1)
        {
            for (var k = 0; k < 2; k += 1)
            {
                corners = append(corners, vector(
                    i == 0 ? bBox.minCorner[0] : bBox.maxCorner[0],
                    j == 0 ? bBox.minCorner[1] : bBox.maxCorner[1],
                    k == 0 ? bBox.minCorner[2] : bBox.maxCorner[2]
                ));
            }
        }
    }
    return corners;
}
