FeatureScript 336; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present Onshape Inc.

/**
 * A module containing many elementary math functions.
 *
 * Some math functions that accept a `ValueWithUnits`, rather than
 * a `number` (such as `sin` and `cos`), are defined in the `units` module.
 *
 * When writing a FeatureScript module which uses only basic math functionality,
 * importing `mathUtils` (which imports this module along with `matrix`,
 * `transform`, and `vector`) is recommended.
 */

/**
 * The mathematical constant pi, to floating-point precision.
 *
 * @example `myAngle = (PI / 4) * radian`
 *
 * In most cases, conversions using `PI` can be avoided if using
 * `ValueWithUnits` appropriately.
 * Thus, you should never find yourself writing a statement like
 * `sin(myAngle * PI / 180)`, since `myAngle` should already have correct units
 * attached.
 */
export const PI = 3.1415926535897932384626433832795;

/**
 * @internal
 * TODO: Expose versions of these fields with units, and a unitless zero.
 */
export const TOLERANCE =
{
    "zeroAngle" : 1e-11,
    "zeroLength" : 1e-8
};

/**
 * Absolute value.
 *
 * @example `abs(-1)` returns `1`
 * @example `abs(-1.5 * inch)` equals `1.5 * inch`
 */
export function abs(value)
{
    return value < 0 ? -value : value;
}

/**
 * Square root of a `number`.
 *
 * @example `sqrt(4)` returns `2`
 * @example `sqrt(-4)` throws an error
 */
export function sqrt(value is number)
{
    return @sqrt(value);
}

/**
 * Natural logarithm of a `number`.
 *
 * @example `log(exp(3))` returns `3`
 * @example `log(0)` returns `-inf`
 * @example `log(-1)` throws an error
 */
export function log(value is number)
{
    return @log(value);
}

/**
 * Base 10 logarithm of a `number`.
 *
 * @example `log10(1000)` returns `3`
 * @example `log10(0)` returns `-inf`
 * @example `log10(-1)` throws an error
 */
export function log10(value is number)
{
    return @log10(value);
}

/**
 * Hyperbolic sine.
 */
export function sinh(value is number)
{
    return @sinh(value);
}

/**
 * Hyperbolic cosine.
 */
export function cosh(value is number)
{
    return @cosh(value);
}

/**
 * Hyperbolic tangent.
 */
export function tanh(value is number)
{
    return @tanh(value);
}

/**
 * Inverse hyperbolic sine.
 */
export function asinh(value is number)
{
    return @asinh(value);
}

/**
 * Inverse hyperbolic cosine.
 */
export function acosh(value is number)
{
    return @acosh(value);
}

/**
 * Inverse hyperbolic tangent.
 */
export function atanh(value is number)
{
    return @atanh(value);
}

/**
 * `e` to the power of `value`.
 *
 * @example `exp(1)` returns `2.71828...`
 * @example `exp(log(3))` returns `3`
 */
export function exp(value is number)
{
    return @exp(value);
}

/**
 * `2` to the power of `value`.
 *
 * @example `exp2(10)` returns `1024`
 */
export function exp2(value is number)
{
    return @exp2(value);
}

/**
 * Hypotenuse function, as `sqrt(a^2 + b^2)`, but without any
 * surprising results due to finite numeric precision.
 *
 * @example `hypot(3, 4)` returns `5`
 */
export function hypot(a is number, b is number)
{
    return @hypot(a, b);
}

/**
 * Round a `number` down to the nearest integer.
 *
 * For values with units, first divide by a value with the same units.
 *
 * @example `floor(1.9)` returns `1`
 * @example `floor(2.0)` returns `2`
 * @example `var numberOfBricks is number = floor(wallLength / brickLength);`
 */
export function floor(value is number)
{
    return @floor(value);
}

/**
 * Round a `number` up to the nearest integer.
 *
 * For values with units, first divide by a value with the same units.
 *
 * @example `ceil(1.1)` returns `2`
 * @example `ceil(1.0)` returns `1`
 * @example `var numberOfBricks is number = ceil(wallLength / brickLength)`
 */
export function ceil(value is number)
{
    return @ceil(value);
}

/**
 * Round a number to the nearest integer.
 *
 * @example `round(1.4)` returns `1`
 * @example `round(1.5)` returns `2`
 * @example `round(-1.5)` returns `-1`
 */
export function round(value is number)
{
    return @floor(value + 0.5);
}

/**
 * @internal
 * Round a number to the nearest integer only for possible roundoff errors
 */
export function roundWithinTolerance(value is number)
{
    var rounded = round(value);
    if (abs(rounded - value) <= TOLERANCE.zeroLength)
    {
        return rounded;
    }
    return value;
}

/**
 * Return the lesser of two values, which must be comparable with `<`.
 *
 * @example `min(0, 1)` returns `0`
 * @example `min(1 * meter, 1 * inch)` equals `1 * inch`
 */
export function min(value1, value2)
{
    return (value1 < value2) ? value1 : value2;
}

/**
 * Return the greater of two values, which must be comparable with `<`.
 * @example `max(0, 1)` returns `1`
 * @example `max(1 * meter, 1 * inch)` equals `1 * meter`
 */
export function max(value1, value2)
{
    return (value1 < value2) ? value2 : value1;
}

/**
 * Return the least of an array of values, as determined by operator `<`,
 * or undefined if the array is empty.
 *
 * @example `min([1, 2, 3])` returns `1`
 * @example `min([1 * inch, 2 * inch, 3 * inch])` equals `1 * inch`
 */
export function min(arr is array)
{
    var minVal = undefined;
    for (var entry in arr)
    {
        if (minVal == undefined || entry < minVal)
        {
            minVal = entry;
        }
    }
    return minVal;
}

/**
 * Return the greatest of an array of values, as determined by operator `<`,
 * or undefined if the array is empty.
 *
 * @example `max([1, 2, 3])` returns `3`
 * @example `max([1 * inch, 2 * inch, 3 * inch])` equals `3 * inch`
 */
export function max(arr is array)
{
    var maxVal = undefined;
    for (var entry in arr)
    {
        if (maxVal == undefined || maxVal < entry)
        {
            maxVal = entry;
        }
    }
    return maxVal;
}

/**
 * Return the index of the smallest element of an array, as determined
 * by operator `<`, or undefined if the array is empty.
 *
 * @example `argMin([1 * inch, 2 * inch, 3 * inch])` returns `0`
 */
export function argMin(arr is array)
{
    var minVal = undefined;
    var minIndex = undefined;
    for (var i = 0; i < @size(arr); i += 1)
    {
        if (minVal == undefined || arr[i] < minVal)
        {
            minVal = arr[i];
            minIndex = i;
        }
    }
    return minIndex;
}

/**
 * Return the index of the largest element of an array, as determined
 * by the `>` operator, or undefined if the array is empty.
 *
 * @example `argMax([1 * inch, 2 * inch, 3 * inch])` returns `3`
 */
export function argMax(arr is array)
{
    var maxVal = undefined;
    var maxIndex = undefined;
    for (var i = 0; i < @size(arr); i += 1)
    {
        if (maxVal == undefined || maxVal < arr[i])
        {
            maxVal = arr[i];
            maxIndex = i;
        }
    }
    return maxIndex;
}

/**
 * Return an array of numbers (normally integers) in a range.
 *
 * @example `range(0, 3)` returns `[0, 1, 2, 3]`
 */
export function range(from is number, to is number)
{
    return range(from, (to < from) ? -1 : 1, to);
}

/**
 * Return an array of numbers, (normally of type `number` or
 * `ValueWithUnits`), in a range.  If the difference between
 * bounds is a multiple of step size, the upper bound is included.
 *
 * @example `range(0, 2, 10)` returns `[0, 2, 4, 6, 8, 10]`
 * @example `range(0, 1.5, 5)` returns `[0, 1.5, 3, 4.5]`
 * @example `range(1 * inch, 0.2 * inch, 1.5 * inch)` returns
 *      `[1 * inch, 1.2 * inch, 1.4 * inch]`
 */
export function range(from, step, to)
precondition
{
    (step > 0 && (from <= to)) ||
        (step < 0 && (from >= to));
}
{
    const num = floor(1 + (to - from) / step);
    var out = @resize([], num);
    var cur = from;
    for (var i = 0; i < num; i += 1)
    {
        out[i] = cur;
        cur += step;
    }
    return out;
}

/**
 * Force a value into a range, @example `clamp(-1, 0, 20)` returns `0`,
 * @example `clamp(10, 0, 20)` returns `10`
 * @example `clamp(30, 0, 20)` returns `20`
 * @example `clamp(30 * inch, 0 * inch, 20 * inch)` equals `20 * inch`
 */
export function clamp(value, lowerBound, higherBound)
precondition
{
    lowerBound <= higherBound;
}
{
    if (value < lowerBound)
        return lowerBound;
    if (value > higherBound)
        return higherBound;
    return value;
}

/**
 * True if `value` is a finite integer.
 *
 * Note that all numbers in FeatureScript represented as floating point numbers, so an
 * expression like `isInteger(hugeInteger + 0.1)` may still return `true`.
 *
 * Used in feature preconditions to define an integer input.
 */
export predicate isInteger(value)
{
    value is number;
    @floor(value) == value;
    value < inf;
    value > -inf;
}

/**
 * True if `value` is a finite integer greater than or equal to zero.
 */
export predicate isNonNegativeInteger(value)
{
    value is number;
    value >= 0;
    value < inf;
    @floor(value) == value;
}

/**
 * True if `value` is a finite integer greater than zero.
 */
export predicate isPositiveInteger(value)
{
    value is number;
    value > 0;
    value < inf;
    @floor(value) == value;
}
