FeatureScript 1605; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2020-Present Onshape Inc.

export import(path : "onshape/std/context.fs", version : "1605.0");
export import(path : "onshape/std/feature.fs", version : "1605.0");
export import(path : "onshape/std/query.fs", version : "1605.0");
export import(path : "onshape/std/units.fs", version : "1605.0");

/**
 *
 * This function takes a computed part property function and wraps it to define a computed part property.
 * It is analogous to [defineFeature], except that it is used to define computed part properties. A typical usage is something like:
 * ```
 * annotation { "Property Function Name" : "MyProperty" }  // annotation required for Onshape to recognize computed property function
 * export const myProperty = defineComputedPartProperty(function(context is Context, part is Query, definition is map)
 *     returns ValueWithUnits // may also return string or boolean or number
 *     // definition is an empty map and reserved for future use
 *     {
 *         ... // Compute and return the property value, using the context and the parameters
 *     });
 * ```
 *
 * For more information on writing computed part properties, see `FeatureScript Computed Part Properties` (TODO) in the
 * language guide.
 *
 * @param propertyFunction : A function that takes a `context`, a `part` Query that returns a single Part, and a `definition`, and that returns a value such as a number or a string or a ValueWithUnits.
 *
 * @autocomplete
 * ```
 * function(context is Context, part is Query, definition is map) returns ValueWithUnits // (or string or number or boolean)
 *     // definition is an empty map and reserved for future use
 *     {
 *         // Compute and return the property value, using the context and parameters
 *     }
 * ```
 */
export function defineComputedPartProperty(propertyFunction is function) returns function
{
    return function(context is Context, part is Query, definition is map)
    {
        const id = newId() + "propertyRollbackId";
        startFeature(context, id);
        var returnValue;
        try
        {
            returnValue = propertyFunction(context, part, definition);
        }
        catch (e)
        {
            abortFeature(context, id);
            throw e;
        }
        abortFeature(context, id); // rolls back whatever changes to the context the property function might have made
        return returnValue;
    };
}
