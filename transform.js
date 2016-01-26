FeatureScript 9999; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present Onshape Inc.

import(path : "onshape/std/containers.fs", version : "");
import(path : "onshape/std/math.fs", version : "");
import(path : "onshape/std/matrix.fs", version : "");
import(path : "onshape/std/units.fs", version : "");
import(path : "onshape/std/vector.fs", version : "");

/**
 * A transform is rotation and scaling followed by a vector translation.
 */
export type Transform typecheck canBeTransform;

export predicate canBeTransform(value)
{
    value is map;
    value.linear is Matrix;
    matrixSize(value.linear) == [3, 3];
    is3dLengthVector(value.translation);
}

export function transform(value is map) returns Transform
{
    return value as Transform;
}

/**
 * Construct a `Transform` using the matrix argument for rotation
 * and scaling and the vector argument for translation.
 */
export function transform(linear is Matrix, translation is Vector) returns Transform
precondition
{
    matrixSize(linear) == [3, 3];
    is3dLengthVector(translation);
}
{
    return { "linear" : linear, "translation" : translation } as Transform;
}

/**
 * Construct a `Transform` that translates without rotation or scaling.
 */
export function transform(translation is Vector) returns Transform
precondition
{
    is3dLengthVector(translation);
}
{
    return { "linear" : identityMatrix(3), "translation" : translation } as Transform;
}

/**
 * For Onshape internal use.
 *
 * Create a `Transform` from the result of a builtin call.
 */
export function transformFromBuiltin(definition is map) returns Transform
{
    return transform(definition.linear as Matrix, (definition.translation as Vector) * meter);
}

/**
 * Construct a transform that does nothing, no rotation, scaling, or translation.
 */
export function identityTransform() returns Transform
{
    return { "linear" : identityMatrix(3), "translation" : vector(0, 0, 0) * meter } as Transform;
}

/**
 * Check that two `Transform`s are the same up to tolerance.
 */
export predicate tolerantEquals(transform1 is Transform, transform2 is Transform)
{
    tolerantEquals(transform1.translation, transform2.translation);
    squaredNorm(transform1.linear - transform2.linear) < 9 * TOLERANCE.zeroAngle * TOLERANCE.zeroAngle;
}

export operator*(t1 is Transform, t2 is Transform) returns Transform
{
    return { "linear" : t1.linear * t2.linear, "translation" : t1 * t2.translation } as Transform;
}

export operator*(t is Transform, v is Vector) returns Vector
precondition
{
    is3dLengthVector(v);
}
{
    return t.translation + t.linear * v;
}

/**
 * Compute the inverse of a `Transform`, such that
 * `inverse(t) * t == identityTransform()`.
 */
export function inverse(t is Transform) returns Transform
{
    const linear = inverse(t.linear);
    return transform(linear, -linear * t.translation);
}
