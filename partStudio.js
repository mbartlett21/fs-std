FeatureScript 432; /* Automatically generated version */
import(path : "onshape/std/context.fs", version : "432.0");
import(path : "onshape/std/defaultFeatures.fs", version : "432.0");

import(path : "onshape/std/containers.fs", version : "432.0");
import(path : "onshape/std/units.fs", version : "432.0");

/** @internal */
export function definePartStudio(partStudio is function, defaultLengthUnit is ValueWithUnits, defaults is map) returns function
{
    return function(configuration is map) returns Context
        {
            var mergedConfiguration = defaults;
            for (var configurationParameter in defaults)
            {
                var specified = configuration[configurationParameter.key];
                if (specified != undefined)
                    mergedConfiguration[configurationParameter.key] = specified;
            }
            var context is Context = newContextWithDefaults(defaultLengthUnit);
            const lookup is function = function(name is string) { return getVariable(context, name); };
            for (var configurationParameter in mergedConfiguration)
            {
                if (configurationParameter.key is string)
                    setVariable(context, configurationParameter.key, configurationParameter.value);
            }
            try(partStudio(context, mergedConfiguration, lookup));
            return context;
        };
}