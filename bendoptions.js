FeatureScript 9999; /* Automatically generated version */
export import(path : "onshape/std/units.fs", version : "");

/**
 * @internal
 * Options for then bend.
 *
 * @type {{
 *      @field useKFactor {boolean}: Whether to use a kFactor or deduction for the bend.
 *      @field kFactor {number}: @requiredif{`useKFactor` is `true`} \[0.0 - 0.5\] Value indicating the kFactor for the bend.
 *      @field deduction {ValueWithUnits}:  @requiredif{`useKFactor` is `false`} Bend deduction.
 * }}
 */
export type BendOptions typecheck canBendOptions;

/** @internal */
export predicate canBendOptions(value)
{
    value is map;
    value.useKFactor is boolean;
    if (value.useKFactor)
    {
        value.kFactor is number;
        0 <= value.kFactor && value.kFactor <= 0.5;
    }
    else
    {
        isLength(value.deduction);
    }
}

/**
 * @internal
 * A creates bend options for using a kFactor.
 * @param kFactor : kFactor for bend.
 */
export function bendOptionsKFactor(kFactor is number) returns BendOptions
precondition
{
    0 <= kFactor && kFactor <= 0.5;
}
{
    return { "useKFactor" : true, "kFactor" : kFactor } as BendOptions;
}

/**
 * @internal
 * A creates bend options for using a deduction.
 * @param deduction : deduction for bend.
 */
export function bendOptionsDeduction(deduction is ValueWithUnits) returns BendOptions
precondition
{
    isLength(deduction);
}
{
    return { "useKFactor" : false, "deduction" : deduction } as BendOptions;
}
