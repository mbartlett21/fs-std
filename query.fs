FeatureScript 9999; /* Automatically generated version */
/**
 * Functions for constructing queries.
 * Features that take queries as inputs should re-export this module.
 *
 * Queries are used to refer to topological entities (vertices, edges, faces, and bodies) that FeatureScript operation
 * and evaluation functions work on. A query is a map that contains instructions for how to find entities. For example,
 * a query for all edges in a context looks like `qEverything(EntityType.EDGE)`. Many queries can take subqueries as
 * arguments, allowing for more complex nested queries.
 *
 * Queries in general do not have a list of entities in any form.  To get an array of the entities (if any) a query
 * matches in a context, call `evaluateQuery`. There is no need to evaluate a query before passing it to an operation
 * or an evaluation function.
 *
 * There are two general types of queries: historical and state-based. Historical queries are roughly of the form
 * "the edge that was generated by feature extrude_1_id from sketch vertex vertex_id from sketch sketch_id."
 * State-based queries cannot refer to entities that have been deleted. Most automatically-generated queries are
 * historical, while queries more commonly used in manually written code are state-based.
 *
 * The order of entities referenced by a query is unspecified (though of course deterministic) except in the case of a
 * `qUnion` query: in that case the entities matched by earlier queries in the argument to `qUnion` are returned first.
 */

import(path : "onshape/std/containers.fs", version : "");
import(path : "onshape/std/context.fs", version : "");
import(path : "onshape/std/mathUtils.fs", version : "");
import(path : "onshape/std/surfaceGeometry.fs", version : "");
import(path : "onshape/std/units.fs", version : "");


// When evaluated all the queries except for those listed order their output by deterministic ids
// UNION query preserves order of sub-queries.
// COEDGE query preserves order based on deterministic id of the face, followed by the edge
/**
 * TODO: description
 */
export enum QueryType
{
    //Special
    NOTHING,
    EVERYTHING,
    NTH_ELEMENT,
    ENTITY_FILTER,
    HISTORICAL,
    CREATED_BY,
    SKETCH_REGION,
    TRANSIENT,
    //Boolean
    UNION,
    INTERSECTION,
    SUBTRACTION,
    //Topological
    OWNED_BY_PART,
    OWNER_PART,
    VERTEX_ADJACENT,
    EDGE_ADJACENT,
    LOOP_AROUND_FACE,
    SHELL_CONTAINING_FACE,
    //Geometry types
    GEOMETRY,
    BODY_TYPE,
    //Geometry matching -- TODO
    PLANE_NORMAL,
    //Tangency
    TANGENT_EDGES,
    TANGENT_FACES,
    // face related queries
    CONVEX_CONNECTED_FACES,
    CONCAVE_CONNECTED_FACES,
    TANGENT_CONNECTED_FACES,
    LOOP_BOUNDED_FACES,
    FACE_OR_EDGE_BOUNDED_FACES,
    HOLE_FACES,
    FILLET_FACES,
    PATTERN,
    //Containment / Intersection
    CONTAINS_POINT,
    INTERSECTS_LINE,
    INTERSECTS_PLANE,
    INTERSECTS_BALL,
    //Optimization
    CLOSEST_TO, //point
    FARTHEST_ALONG, //direction
    LARGEST,
    SMALLEST,
    COEDGE,
    MATE_CONNECTOR,
    CONSTRUCTION_FILTER,
    DEPENDENCY
}

// Following enums can be used in query filters
/**
 * TODO: description
 */
export enum EntityType
{
    VERTEX,
    EDGE,
    FACE,
    BODY
}

/**
 * TODO: description
 */
export enum GeometryType
{
    LINE,
    CIRCLE,
    ARC,
    OTHER_CURVE,
    PLANE,
    CYLINDER,
    CONE,
    SPHERE,
    TORUS,
    OTHER_SURFACE
}

/**
 * TODO: description
 */
export enum BodyType
{
    SOLID,
    SHEET,
    WIRE,
    POINT,
    // MATE_CONNECTOR body type is for filtering selections only
    MATE_CONNECTOR
}

/**
 * TODO: description
 */
export enum ConstructionObject
{
    YES,
    NO
}

/**
 * TODO: description
 */
export enum SketchObject
{
    YES,
    NO
}

/**
 * TODO: description
 */
export enum EdgeTopology
{
    LAMINAR,
    TWO_SIDED
}

/**
 * TODO: description
 */
export enum CompareType
{
    EQUAL,
    LESS,
    LESS_EQUAL,
    GREATER,
    GREATER_EQUAL
}

//Short hands expanded in precondition processing
/**
 * TODO: description
 */
export enum QueryFilterCompound
{
    ALLOWS_AXIS // = GeometryType.LINE || GeometryType.CIRCLE || GeometryType.ARC || GeometryType.CYLINDER
}

/**
 * A lightweight object which represents a specific subset of a model's gemetry (points, lines, planes, and bodies).
 * @see `evaluateQuery` to find geometry matching a Query in a given context, returning a list of Queries, each representing
 * an individual geometric entity
 *
 * @value {{
 *      @field queryType {QueryType}
 *      @field entityType {EntityType} : @optional
 * }}
 */
export type Query typecheck canBeQuery;

export predicate canBeQuery(value)
{
    value is map;
    value.queryType is QueryType || value.historyType is string;
    value.entityType is undefined || value.entityType is EntityType;
}

//put Query type on a map
/**
 * TODO: description
 * @param value {{
 *      @field TODO
 * }}
 */
export function makeQuery(value is map) returns Query
{
    return value as Query;
}

//Don't strip units off historical queries
/**
 * TODO: description
 * @param value
 */
export function stripUnits(value is Query)
{
    if (value.historyType != undefined)
        return value;
    return stripUnits(value as map);
}


// =========================== Special Queries ===============================

/**
 * TODO: description
 */
export function qNothing() returns Query
{
    return { queryType : QueryType.NOTHING } as Query;
}

/**
 * TODO: description
 */
export function qEverything() returns Query
{
    return { queryType : QueryType.EVERYTHING } as Query;
}

/**
 * A query for all geometry of a specified EntityType
 * @param entityType {EntityType}:
 *      @eg `EntityType.BODY`
 */
export function qEverything(entityType is EntityType) returns Query
{
    return { queryType : QueryType.EVERYTHING, "entityType" : entityType } as Query;
}

/**
 * A query for an element in a sub-query at a specified index
 * @param subquery {Query}
 * @param n {number}: zero-based index of element in subquery.
 *      @eg `0`  indicates the first element
 *      @eg `-1` indicates the last element
 */
export function qNthElement(subquery is Query, n is number) returns Query
precondition
{
    isInteger(n);
}
{
    return { queryType : QueryType.NTH_ELEMENT, "n" : n, "subquery" : subquery } as Query;
}

/**
 * TODO: description
 * @param subquery
 * @param entityType
 */
export function qEntityFilter(subquery is Query, entityType is EntityType) returns Query
{
    return { queryType : QueryType.ENTITY_FILTER, "entityType" : entityType, "subquery" : subquery } as Query;
}

/**
 * TODO: description
 * @param featureId
 */
export function qCreatedBy(featureId is Id) returns Query
{
    return { "queryType" : QueryType.CREATED_BY, "featureId" : featureId } as Query;
}

export function qCreatedBy(featureId is Id, entityType is EntityType) returns Query
{
    return { "queryType" : QueryType.CREATED_BY, "featureId" : featureId, "entityType" : entityType } as Query;
}

/**
 * TODO: description
 * @param id
 */
export function qTransient(id is TransientId) returns Query
{
    return { "queryType" : QueryType.TRANSIENT, "transientId" : id } as Query;
}

// Get the true dependency of the query. E.g. for extrude, the true dependency of extruded body can be
// the face of the profile, or the sketch edges of the profile.
/**
 * TODO: description
 * @param subquery
 */
export function qDependency(subquery is Query) returns Query
{
    return { "queryType" : QueryType.DEPENDENCY, "subquery" : subquery } as Query;
}

/**
 * TODO: description
 * @param query
 */
export function transientQueriesToStrings(query is Query)
{
    if (query.queryType == QueryType.TRANSIENT)
        return @transientIdToString(query.transientId);
    else
        return transientQueriesToStrings(query as map);
}

export function transientQueriesToStrings(value is map) returns map
{
    for (var entry in value)
    {
        if (!(entry.key is array) && !(entry.key is map))
            value[entry.key] = transientQueriesToStrings(entry.value);
        else
        {
            value[entry.key] = undefined;
            value[transientQueriesToStrings(entry.key)] = transientQueriesToStrings(entry.value);
        }
    }
    return value;
}

export function transientQueriesToStrings(value is array) returns array
{
    for (var i = 0; i < @size(value); i += 1)
    {
        value[i] = transientQueriesToStrings(value[i]);
    }
    return value;
}

export function transientQueriesToStrings(value)
{
    return value;
}

// ===================================== Boolean Queries ================================

// When evaluated qUnion preserves order of subQueries in its output
/**
 * TODO: description
 * @param subqueries
 */
export function qUnion(subqueries is array) returns Query
precondition
{
    for (var subquery in subqueries)
        subquery is Query;
}
{
    return { "queryType" : QueryType.UNION, "subqueries" : subqueries } as Query;
}

/**
 * TODO: description
 * @param subqueries
 */
export function qIntersection(subqueries is array) returns Query
precondition
{
    for (var subquery in subqueries)
        subquery is Query;
}
{
    return { "queryType" : QueryType.INTERSECTION, "subqueries" : subqueries } as Query;
}

/**
 * TODO: description
 * @param query1
 * @param query2
 */
export function qSubtraction(query1 is Query, query2 is Query) returns Query
{
    return { "queryType" : QueryType.SUBTRACTION, "query1" : query1, "query2" : query2 } as Query;
}

/**
 * TODO: description
 * @param query1
 * @param query2
 */
export function qSymmetricDifference(query1 is Query, query2 is Query) returns Query
{
    return qUnion([qSubtraction(query1, query2), qSubtraction(query2, query1)]);
}

// ===================================== Topological Queries ===================================

/**
 * TODO: description
 * @param part
 */
export function qOwnedByPart(part is Query) returns Query
{
    return { "queryType" : QueryType.OWNED_BY_PART, "part" : part } as Query;
}

export function qOwnedByPart(part is Query, entityType is EntityType) returns Query
{
    return { "queryType" : QueryType.OWNED_BY_PART, "part" : part, "entityType" : entityType } as Query;
}

export function qOwnedByPart(subquery is Query, part is Query) returns Query
{
    return { "queryType" : QueryType.OWNED_BY_PART, "subquery" : subquery, "part" : part } as Query;
}

/**
 * TODO: description
 * @param query
 */
export function qOwnerPart(query is Query) returns Query
{
    return { "queryType" : QueryType.OWNER_PART, "query" : query } as Query;
}

//Returns entities of specified type that share a vertex with any of those returned by the input query
/**
 * TODO: description
 * @param query
 * @param entityType
 */
export function qVertexAdjacent(query is Query, entityType is EntityType) returns Query
precondition
{
    entityType != EntityType.BODY;
}
{
    return { "queryType" : QueryType.VERTEX_ADJACENT, "query" : query, "entityType" : entityType } as Query;
}

//Returns entities of specified type that share an edge with any of those returned by the input query
/**
 * TODO: description
 * @param query
 * @param entityType
 */
export function qEdgeAdjacent(query is Query, entityType is EntityType) returns Query
precondition
{
    entityType != EntityType.BODY;
    entityType != EntityType.VERTEX;
}
{
    return { "queryType" : QueryType.EDGE_ADJACENT, "query" : query, "entityType" : entityType } as Query;
}

//LOOP_AROUND_FACE,
//SHELL_CONTAINING_FACE,
//===================================== Geometry Type Queries =====================================

/**
 * TODO: description
 * @param subquery
 * @param geometryType
 */
export function qGeometry(subquery is Query, geometryType is GeometryType) returns Query
{
    return { "queryType" : QueryType.GEOMETRY, "geometryType" : geometryType, "subquery" : subquery } as Query;
}

/**
 * TODO: description
 * @param subquery
 * @param bodyType
 */
export function qBodyType(subquery is Query, bodyType is BodyType) returns Query
{
    return qBodyType(subquery, [bodyType]);
}

export function qBodyType(subquery is Query, bodyTypes is array) returns Query
precondition
{
    for (var el in bodyTypes)
    {
        el is BodyType;
    }
}
{
    if (subquery.queryType == QueryType.EVERYTHING)
    {
        subquery.bodyType = bodyTypes;
        return subquery;
    }
    return { "queryType" : QueryType.BODY_TYPE, "bodyType" : bodyTypes, "subquery" : subquery } as Query;
}

/**
 * TODO: description
 * @param subquery
 * @param constructionFilter
 */
export function qConstructionFilter(subquery is Query, constructionFilter is ConstructionObject) returns Query
{
    return { "queryType" : QueryType.CONSTRUCTION_FILTER, "constructionFilter" : constructionFilter, "subquery" : subquery } as Query;
}

// ===================================== Geometry matching Queries =====================================
/* Not done yet
export function qPlanarNormal(subquery is Query, normal is Vector) returns Query
{
    return { "queryType" : QueryType.PLANE_NORMAL, "subquery" : subquery, "normal" : normal} as Query;
}
*/
// ===================================== Tangency Queries =====================================
//TANGENT_EDGES,
//TANGENT_FACES,

// ===================================== Faces Related Queries =====================================
/**
 * TODO: description
 * @param subquery
 */
export function qConvexConnectedFaces(subquery is Query) returns Query
{
    return { "queryType" : QueryType.CONVEX_CONNECTED_FACES, "subquery" : subquery } as Query;
}

/**
 * TODO: description
 * @param subquery
 */
export function qConcaveConnectedFaces(subquery is Query) returns Query
{
    return { "queryType" : QueryType.CONCAVE_CONNECTED_FACES, "subquery" : subquery } as Query;
}

/**
 * TODO: description
 * @param subquery
 */
export function qTangentConnectedFaces(subquery is Query) returns Query
{
    return { "queryType" : QueryType.TANGENT_CONNECTED_FACES, "subquery" : subquery } as Query;
}

/**
 * TODO: description
 * @param subquery
 */
export function qLoopBoundedFaces(subquery is Query) returns Query
{
    return { "queryType" : QueryType.LOOP_BOUNDED_FACES, "subquery" : subquery } as Query;
}

/**
 * TODO: description
 * @param subquery
 */
export function qFaceOrEdgeBoundedFaces(subquery is Query) returns Query
{
    return { "queryType" : QueryType.FACE_OR_EDGE_BOUNDED_FACES, "subquery" : subquery } as Query;
}

/**
 * TODO: description
 * @param subquery
 */
export function qHoleFaces(subquery is Query) returns Query
{
    return { "queryType" : QueryType.HOLE_FACES, "subquery" : subquery } as Query;
}

/**
 * TODO: description
 * @param featureId
 */
export function qSketchRegion(featureId is Id) returns Query
{
    return { "queryType" : QueryType.SKETCH_REGION, "featureId" : featureId, "filterInnerLoops" : false } as Query;
}

export function qSketchRegion(featureId is Id, filterInnerLoops is boolean) returns Query
{
    return { "queryType" : QueryType.SKETCH_REGION, "featureId" : featureId, "filterInnerLoops" : filterInnerLoops } as Query;
}

/**
 * TODO: description
 * @param faceQuery
 * @param edgeQuery
 */
export function qCoEdge(faceQuery is Query, edgeQuery is Query) returns Query
{
    return { "queryType" : QueryType.COEDGE, "faceQuery" : faceQuery, "edgeQuery" : edgeQuery } as Query;
}

/**
 * TODO: description
 * @param subquery
 */
export function qMateConnectorsOfParts(subquery is Query) returns Query
{
    return { "queryType" : QueryType.MATE_CONNECTOR, "subquery" : subquery } as Query;
}

// find fillet faces of radius equal to , less than and equal to, greater than and equal to the
// input faces. Will find the fillet radius from the faces and then compare to find all the faces
// of fillets that satisfy the compareType. The input faces should be from a fillet other wise not
// faces will be found.
/**
 * TODO: description
 * @param subquery
 * @param compareType
 */
export function qFilletFaces(subquery is Query, compareType is CompareType) returns Query
precondition
{
    compareType == CompareType.EQUAL || compareType == CompareType.LESS_EQUAL || compareType == CompareType.GREATER_EQUAL;
}
{
    return { "queryType" : QueryType.FILLET_FACES, "compareType" : compareType, "subquery" : subquery } as Query;
}

/**
 * TODO: description
 * @param subquery
 */
export function qMatchingFaces(subquery is Query) returns Query
{
    return { "queryType" : QueryType.PATTERN, "subquery" : subquery } as Query;
}


//===================================== Containment / Intersection Queries =====================================
/**
 * TODO: description
 * @param subquery
 * @param point
 */
export function qContainsPoint(subquery is Query, point is Vector) returns Query
precondition
{
    is3dLengthVector(point);
}
{
    return { "queryType" : QueryType.CONTAINS_POINT, "subquery" : subquery, "point" : stripUnits(point) } as Query;
}

//INTERSECTS_LINE,

/**
 * TODO: description
 * @param subquery
 * @param plane
 */
export function qIntersectsPlane(subquery is Query, plane is Plane) returns Query
{
    return { "queryType" : QueryType.INTERSECTS_PLANE, "subquery" : subquery, "plane" : stripUnits(plane) } as Query;
}

//INTERSECTS_BALL,
//===================================== Optimization Queries =====================================
/* Not done yet
   export function qClosestTo(subquery is Query, point is Vector) returns Query
   precondition
   {
   is3dLengthVector(point);
   }
   {
   return { "queryType" : QueryType.CLOSEST_TO, "subquery" : subquery, "point" : point} as Query;
   }
 */
//FARTHEST_ALONG, //direction
//LARGEST,
//SMALLEST

// ==================================== Historical Query stuff ================================

//historical query function
export function makeQuery(operationId is Id, queryType is string, entityType is EntityType, value is map) returns Query
{
    return mergeMaps(value,
                     { "operationId" : operationId, "queryType" : queryType,
                       "entityType" : entityType, "historyType" : "CREATION" }) as Query;
}

/**
 * TODO: description
 * @param operationId
 * @param entityType
 * @param disambiguationOrder
 */
export function dummyQuery(operationId is Id, entityType is EntityType, disambiguationOrder is number) returns Query
{
    return makeQuery({ "operationId" : operationId,
                       historyType : "CREATION",
                       "entityType" : entityType,
                       queryType : "DUMMY",
                       disambiguationData : [{ disambiguationType : "ORDER", order : disambiguationOrder }] });
}

export function dummyQuery(operationId is Id, entityType is EntityType) returns Query
{
    return makeQuery({ "operationId" : operationId, historyType : "CREATION",
                "entityType" : entityType, queryType : "DUMMY" });
}

/**
 * TODO: description
 * @param featureId
 * @param entityType
 * @param backBody
 */
export function qSplitBy(featureId is Id, entityType is EntityType, backBody is boolean)
{
    return makeQuery(featureId, "SPLIT", entityType, { "isFromBackBody" : backBody });
}

/**
 * TODO: description
 * @param operationId
 * @param entityType
 * @param sketchEntityId
 */
export function sketchEntityQuery(operationId is Id, entityType is EntityType, sketchEntityId is string) returns Query
{
    return makeQuery(operationId, "SKETCH_ENTITY", entityType,
            { "sketchEntityId" : sketchEntityId });
}

/**
 * TODO: description
 * @param order
 */
export function orderDisambiguation(order is number)
{
    return { disambiguationType : "ORDER", "order" : order };
}

/**
 * TODO: description
 * @param topology
 */
export function topologyDisambiguation(topology is array)
{
    return { disambiguationType : "TOPOLOGY", entities : topology };
}

/**
 * TODO: description
 * @param queries
 */
export function originalSetDisambiguation(queries is array)
{
    return { disambiguationType : "ORIGINAL_DEPENDENCY", originals : queries };
}

/**
 * TODO: description
 * @param queries
 */
export function trueDependencyDisambiguation(queries is array)
{
    return { disambiguationType : "TRUE_DEPENDENCY", derivedFrom : queries };
}

/**
 * TODO: description
 * @param topology
 */
export function ownerDisambiguation(topology is array)
{
    return { disambiguationType : "OWNER", owners : topology };
}

/**
 * TODO: description
 */
export type TransientId typecheck canBeTransientId;

export predicate canBeTransientId(value)
{
    @isTransientId(value); /* implies (value is builtin) */
}

export function toString(value is TransientId)
{
    return "Tr:" ~ @transientIdToString(value);
}

//==================

/**
 * TODO: description
 * @param paramName
 */
export function notFoundErrorKey(paramName is string) returns string
{
    return paramName ~ "notFoundError";
}

//backward compatibility -- do not use these functions.  Will need to figure out a way to remove them.
annotation { "Deprecated" : true }
export function query(operationId is Id, queryType is string, entityType is EntityType, value is map) returns Query
{
    return makeQuery(operationId, queryType, entityType, value);
}

annotation { "Deprecated" : true }
export function query(value is map) returns Query
{
    return makeQuery(value);
}
