FeatureScript 9999; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present Onshape Inc.

/**
 * The instantiator makes it easy to efficiently bring in (possibly configured) bodies from other Part Studios and place
 * them at specific positions and orientations. The usage pattern is generally as follows:
 * ```
 * firstPartStudio::import(...);
 * secondPartStudio::import(...);
 *
 * // later, in a feature
 * const instantiator = newInstantiator(id + "myId");
 *
 * var firstQuery = addInstance(instantiator, firstPartStudio::build, {
 *                                  "configuration" : { "configurationInput" : configurationValue },
 *                                  "transform"     : transform(vector(1, 2, 3) * inch)
 *                              });
 * var secondQuery = addInstance(instantiator, secondPartStudio::build, {
 *                                   "configuration" : secondConfiguration,
 *                                   "transform"     : someOtherTransform,
 *                                   "mateConnector" : queryForMateConnectorInSecondPartStudio // Specifies the origin
 *                               });
 * // repeat the above as necessary
 *
 * instantiate(context, instantiator); // This call actually brings in the bodies
 * // Now firstQuery and secondQuery will resolve to the instantiated geometry
 * ```
 * Internally, the instantiator groups all added instances by Part Studio and configuration. The final call to `instantiate()` is
 * optimized so that any duplicates of the same Part Studio and the same configuration are patterned instead of re-derived,
 * resulting in better performance and scalability for features instantiating the same bodies multiple times.
 */
import(path : "onshape/std/containers.fs", version : "");
import(path : "onshape/std/context.fs", version : "");
import(path : "onshape/std/coordSystem.fs", version : "");
import(path : "onshape/std/evaluate.fs", version : "");
import(path : "onshape/std/feature.fs", version : "");
import(path : "onshape/std/geomOperations.fs", version : "");
import(path : "onshape/std/math.fs", version : "");
import(path : "onshape/std/matrix.fs", version : "");
import(path : "onshape/std/sheetMetalUtils.fs", version : "");
import(path : "onshape/std/transform.fs", version : "");
import(path : "onshape/std/units.fs", version : "");

/** Stores the data associated with using instantiator functionality. */
export type Instantiator typecheck canBeInstantiator;

/** Typecheck for Instantiator */
export predicate canBeInstantiator(value)
{
    value is box;
    value[] is map;
    value[].id is Id;
    value[].names is map;
    value[].partQuery is Query;
    value[].buildAndConfigurationToInstances is map;
    for (var entry in value[].buildAndConfigurationToInstances)
    {
        entry.key is array;
        size(entry.key) == 2;
        entry.key[0] is function;
        entry.key[1] is map;

        entry.value is array;
        for (var tolerantConfigurationInstances in entry.value)
        {
            tolerantConfigurationInstances is map;
            tolerantConfigurationInstances.tolerantConfiguration is map;
            tolerantConfigurationInstances.tolerantVector is Matrix;
            tolerantConfigurationInstances.instances is array;
            for (var instance in tolerantConfigurationInstances.instances)
            {
                instance is map;
                instance.id is Id;
                instance.transform is Transform;
                instance.mateConnector == undefined || instance.mateConnector is Query;
                instance.identity == undefined || instance.identity is Query;
            }
        }
    }
}

/** Creates a new instantiator with the specified id and default options. */
export function newInstantiator(id is Id) returns Instantiator
{
    return newInstantiator(id, {});
}

/**
 * Creates a new instantiator.
 * @param id : The root id for all instances that will be created by this instantiator.
 *   Multiple instantiators can be used simultaneously, as long as they have different ids.
 * @param options {{
 *     @field partQuery {Query} : The query for all bodies to be brought in from the part studios.  Default is all bodies except sketches. @optional
 *     @field tolerances {map} : The tolerances for variable configuration inputs.  Default is 1e-8 meters for lengths,
 *                  1e-11 radians for angles, and 0 for numbers.  The default tolerances for lengths, angles, and numbers can be specified using the
 *                  `(LENGTH_UNITS)`, `(ANGLE_UNITS)`, and `(unitless)` keys, respectively.  The tolerance for a specific configuration input can be specified
 *                  using that input name as the key.
 *                  @ex `{ (LENGTH_UNITS) : 1e-4 * meter, (unitless) : 1e-8, "count" : 0 }` causes length configuration variables that differ by less than 1e-4 meters
 *                      to be considered identical, as well as numberical configuration variables that differ by less than 1e-8, except that configuration
 *                      variables named "count" are compared exactly.
 *                  @optional
 * }} : @optional
 */
export function newInstantiator(id is Id, options is map) returns Instantiator
precondition
{
    for (var entry in options)
        entry.key == "tolerances" || entry.key == "partQuery";

    if (options.tolerances != undefined)
    {
        options.tolerances[LENGTH_UNITS] == undefined || isLength(options.tolerances[LENGTH_UNITS]);
        options.tolerances[ANGLE_UNITS] == undefined || isAngle(options.tolerances[ANGLE_UNITS]);
        options.tolerances[unitless] == undefined || options.tolerances[unitless] is number;
    }
}
{
    const defaults = {
            tolerances : { (LENGTH_UNITS) : TOLERANCE.zeroLength * meter, (ANGLE_UNITS) : TOLERANCE.zeroAngle * radian, (unitless) : 0 },
            partQuery : qSketchFilter(qEverything(EntityType.BODY), SketchObject.NO)
        };

    if (options.tolerances != undefined)
        options.tolerances = mergeMaps(defaults.tolerances, options.tolerances);
    options = mergeMaps(defaults, options);
    return new box({
                    "id" : id,
                    "names" : {},
                    "tolerances" : options.tolerances,
                    "partQuery" : options.partQuery,
                    "buildAndConfigurationToInstances" : {}
                }) as Instantiator;
}

/**
 * Adds an instance to the instantiator (does not actually create it in a context) with the given
 * build function.  The definition can specify the configuration, the transform, and how the result is identified.
 * @param definition {{
 *     @field configuration {map} : The configuration of the part studio. @optional
 *     @field transform {Transform} : The transform to be applied to the geometry. @optional
 *     @field mateConnector {Query} : A query for a mate connector in the part studio being instantiated, specifying its coordinate system. @optional
 *     @field name {string} : The id component for this instance.  Must be unique per instantiator.
 *                            If it is not specified, one is automatically generated based on order.
 *                            If it is specified, the query returned is `qCreatedBy(id + name, EntityType.BODY)`,
 *                            where `id` is the id that was passed into `newInstantiator`
 *                            @optional
 *     @field identity {Query} : If provided, specifies an entity whose identity controls the identity of the instance,
 *                            so that queries for the instance can be robust.
 *                            For example, if creating instances based on a layout sketch, one instance per line segment,
 *                            the identity should be a query for the corresponding line segment.  @optional
 * }}
 * @return : a query that will resolve to the bodies instantiated once `instantiate` is run.
 */
export function addInstance(instantiator is Instantiator, build is function, definition is map) returns Query
precondition
{
    definition.configuration == undefined || definition.configuration is map;
    definition.transform == undefined || definition.transform is Transform;
    definition.mateConnector == undefined || definition.mateConnector is Query;
    definition.name == undefined || definition.name is string;
    definition.identity == undefined || definition.identity is Query;
}
{
    var name = definition.name;
    if (name == undefined)
    { // Automatically compute a name
        var count = size(instantiator[].names);
        while (instantiator[].names["Auto" ~ count] != undefined)
            count += 1;
        name = "Auto" ~ count;
    }
    else if (instantiator[].names[name] != undefined)
    {
        throw "Duplicate name " ~ name;
    }

    if (definition.configuration == undefined)
        definition.configuration = {};

    if (definition.transform == undefined)
    {
        definition.transform = identityTransform();
    }

    var instanceId = instantiator[].id + (definition.identity == undefined ? name : unstableIdComponent(name));

    // Split the configuration into an exact and a tolerant part
    var split = splitConfiguration(definition.configuration, instantiator[].tolerances);

    const key = [build, split.exact];
    var tolerantConfigurations = instantiator[].buildAndConfigurationToInstances[key];
    if (tolerantConfigurations == undefined)
    {
        tolerantConfigurations = [];
    }

    const numTolerant = size(split.tolerant);
    const numTolerantConfigurations = size(tolerantConfigurations);
    var i = 0;
    if (numTolerant > 0)
    {
        // Try to find an existing set of instances with a sufficiently close tolerant configuration.
        for ( ; i < numTolerantConfigurations; i += 1)
        {
            if (@matrixSquaredNorm(@matrixDifference(split.vector, tolerantConfigurations[i].tolerantVector)) < numTolerant)
                break;
        }
    }

    const instance = {
            "id" : instanceId,
            "transform" : definition.transform,
            "mateConnector" : definition.mateConnector,
            "identity" : definition.identity
        };
    // Append it as a new tolerant configuration or to an existing set of tolerant configurations
    if (i < numTolerantConfigurations)
        tolerantConfigurations[i].instances = append(tolerantConfigurations[i].instances, instance);
    else
        tolerantConfigurations = append(tolerantConfigurations, { "tolerantConfiguration" : split.tolerant, "tolerantVector" : split.vector,
                    "instances" : [instance] });

    instantiator[].buildAndConfigurationToInstances[key] = tolerantConfigurations;
    instantiator[].names[name] = true; // Record that the name is used
    return qCreatedBy(instanceId, EntityType.BODY);
}

/** Creates the instances (in the provided context) that were added to the instantiator */
export function instantiate(context is Context, instantiator is Instantiator)
{
    var idx = 0;
    var toPattern = [];

    skipOrderDisambiguation(context, instantiator[].id + "derived");

    // For each build function and exact configuration
    for (var entry in instantiator[].buildAndConfigurationToInstances)
    {
        const build = entry.key[0];
        const exactConfiguration = entry.key[1];

        const tolerantConfigurations = entry.value;

        // For each tolerant configuration group
        for (var tolerantConfigurationInstances in tolerantConfigurations)
        {
            const configuration = mergeMaps(exactConfiguration, tolerantConfigurationInstances.tolerantConfiguration);

            const count = size(tolerantConfigurationInstances.instances);

            var mateConnectorQueries = {};
            for (var i = 0; i < count; i += 1)
                mateConnectorQueries[tolerantConfigurationInstances.instances[i].mateConnector] = true;
            mateConnectorQueries[undefined] = undefined;

            const derivedId is Id = instantiator[].id + "derived" + unstableIdComponent("derived" ~ idx);
            mateConnectorQueries = derive(context, derivedId, build, configuration, instantiator[].partQuery, mateConnectorQueries);

            const derivedQuery = qCreatedBy(derivedId, EntityType.BODY);
            for (var i = 0; i < count; i += 1)
            {
                const instance = tolerantConfigurationInstances.instances[i];

                var transform = instance.transform;
                var mateConnectorTransform = mateConnectorQueries[instance.mateConnector];
                if (mateConnectorTransform != undefined)
                    transform *= mateConnectorTransform;

                toPattern = append(toPattern, { "id" : instance.id, "identity" : instance.identity, "entities" : derivedQuery, "transforms" : [transform], "instanceNames" : ["1"]});
            }

            idx += 1;
        }
    }

    for (var instance in toPattern)
    {
        if (instance.identity != undefined)
        {
            setExternalDisambiguation(context, instance.id, instance.identity);
        }
        opPattern(context, instance.id, instance);
    }

    opDeleteBodies(context, instantiator[].id + "delete", { "entities" : qCreatedBy(instantiator[].id + "derived", EntityType.BODY) });
}

/**
 * Splits the configuration into an "exact" and "tolerant" part.  Also computes the vector of
 * tolerant configuration inputs normalized by their tolerances.
 */
function splitConfiguration(configuration is map, tolerances is map) returns map
{
    var exact = {};
    var tolerant = {};
    var vector = [];
    for (var entry in configuration)
    {
        var tolerance = getTolerance(entry, tolerances);
        if (tolerance == 0)
        {
            exact[entry.key] = entry.value;
        }
        else
        {
            tolerant[entry.key] = entry.value;
            const normalized = entry.value / tolerance;
            if (!(normalized is number))
                throw "Invalid tolerance for " ~ entry.key ~ ": value = " ~ toString(entry.value) ~ ", tolerance = " ~ toString(tolerance);
            vector = append(vector, normalized);
        }
    }
    if (vector == [])
        vector = [0];
    return { "exact" : exact, "tolerant" : tolerant, "vector" : [vector] as Matrix };
}

function getTolerance(entry is map, tolerances is map)
{
    if (!(entry.value is number) && !(entry.value is ValueWithUnits))
        return 0;
    if (tolerances[entry.key] != undefined)
        return tolerances[entry.key];
    if (entry.value is number)
        return tolerances[unitless];
    return tolerances[entry.value.unit];
}

const neverKeep = qUnion([qCreatedBy(makeId("Origin"), EntityType.BODY),
            qCreatedBy(makeId("Front"), EntityType.BODY),
            qCreatedBy(makeId("Top"), EntityType.BODY),
            qCreatedBy(makeId("Right"), EntityType.BODY)]);
const allBodies = qEverything(EntityType.BODY);

// For mateConnector, doesn't matter what the values are on input.  On output, the values are transforms
function derive(context is Context, id is Id, buildFunction is function, configuration is map, parts is Query, mateConnector is map) returns map
{
    const otherContext = @convert(buildFunction(configuration), undefined);
    if (size(evaluateQuery(otherContext, parts)) == 0)
        throw regenError(ErrorStringEnum.IMPORT_DERIVED_NO_PARTS, ["parts"]);

    // Evaluate the mate connector queries
    for (var query in mateConnector)
        mateConnector[query.key] = fromWorld(evMateConnector(otherContext, { "mateConnector" : query.key }));

    // remove sheet metal attributes and helper bodies
    var smPartsQ = clearSheetMetalData(otherContext, id + "sheetMetal");

    // don't want to merge default bodies or unmodifiable bodies
    var bodiesToKeep = qModifiableEntityFilter(qSubtraction(parts, neverKeep));

    const deleteDefinition = {
            "entities" : qSubtraction(qUnion([allBodies, smPartsQ]), bodiesToKeep)
        };
    opDeleteBodies(otherContext, id + "delete", deleteDefinition);

    opMergeContexts(context, id + "merge", { contextFrom : otherContext });
    processSubfeatureStatus(context, id, { "subfeatureId" : id + "merge" });

    return mateConnector;
}
