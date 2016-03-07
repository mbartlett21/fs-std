FeatureScript 9999; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present Onshape Inc.

/**
 * Functions for constructing queries.
 * Features that take queries as inputs should re-export this module.
 *
 * Queries are used to refer to topological entities (vertices, edges, faces,
 * and bodies) that FeatureScript operation and evaluation functions work on.
 * A query is a map that contains instructions for how to find entities. For
 * example, a query for all edges in a context looks like
 *`qEverything(EntityType.EDGE)`.
 * Many queries can take subqueries as arguments, allowing for more complex
 * nested queries.
 *
 * Queries in general do not contain a list of entities in any form. Rather,
 * they contain criteria that specify a subset of the topological entites in a
 * context. To get an array of the entities (if any) which match a query in
 * a context, use `evaluateQuery`. There is no need to evaluate a query before
 * passing it into a function, including any of the Standard Libary's operation
 * and evaluation functions.
 *
 * There are two general types of queries: state-based and historical.
 * State-based queries select entities based on the model state, e.g. "All
 * edges adjacent to a cylindrical face which touches this point." Historical
 * queries select entities based on the model history, e.g. "the edge that was
 * generated by feature `extrude_1_id` from sketch vertex `vertex_id` from
 * sketch `sketch_id`." State-based queries cannot refer to entities that have
 * been deleted. Most automatically-generated queries are historical, while
 * queries more commonly used in manually written code are state-based.
 */
import(path : "onshape/std/containers.fs", version : "");
import(path : "onshape/std/context.fs", version : "");
import(path : "onshape/std/mathUtils.fs", version : "");
import(path : "onshape/std/surfaceGeometry.fs", version : "");
import(path : "onshape/std/units.fs", version : "");

/**
 * A `Query` indentifies a specific subset of a context's entities (points, lines,
 * planes, and bodies).
 *
 * The fields on a Query map depend on its `QueryType`, and may include one or
 * more subqueries.
 *
 * @type {{
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

/**
 * For Onshape internal use.
 *
 * An enumeration which specifies the critereon of a `Query`.
 *
 * Queries of a given type can instead be created using their corresponding constructor.
 * For instance, the query
 * `{ "queryType" : QueryType.EVERYTHING, "entityType" : EntityType.BODY }`
 * is created with `qEverything(EntityType.BODY)`, and its behavior is
 * described on the documentation for the function `qEverything`.
 *
 ******************************************************************************
 * @value NOTHING                    : Used in `qNothing`
 * @value EVERYTHING                 : Used in `qEverything`
 * @value NTH_ELEMENT                : Used in `qNthElement`
 * @value ENTITY_FILTER              : Used in `qEntityFilter`
 * @value HISTORICAL                 : Used in `qHistorical`
 * @value CREATED_BY                 : Used in `qCreatedBy`
 * @value SKETCH_REGION              : Used in `qSketchRegion`
 * @value TRANSIENT                  : Used in `qTransient`
 * @value UNION                      : Used in `qUnion`
 * @value INTERSECTION               : Used in `qIntersection`
 * @value SUBTRACTION                : Used in `qSubtraction`
 * @value OWNED_BY_PART              : Used in `qOwnedByBody`
 * @value OWNER_PART                 : Used in `qOwnerBody`
 * @value VERTEX_ADJACENT            : Used in `qVertexAdjacent`
 * @value EDGE_ADJACENT              : Used in `qEdgeAdjacent`
 * @value LOOP_AROUND_FACE           : Not yet implemented
 * @value SHELL_CONTAINING_FACE      : Not yet implemented
 * @value GEOMETRY                   : Used in `qGeometry`
 * @value BODY_TYPE                  : Used in `qBodyType`
 * @value PLANE_NORMAL               : Not yet implemented
 * @value TANGENT_EDGES              : Not yet implemented
 * @value TANGENT_FACES              : Not yet implemented
 * @value CONVEX_CONNECTED_FACES     : Used in `qConvexConnectedFaces`
 * @value CONCAVE_CONNECTED_FACES    : Used in `qConcaveConnectedFaces`
 * @value TANGENT_CONNECTED_FACES    : Used in `qTangentConnectedFaces`
 * @value LOOP_BOUNDED_FACES         : Used in `qLoopBoundedFaces`
 * @value FACE_OR_EDGE_BOUNDED_FACES : Used in `qFaceOrEdgeBoundedFaces`
 * @value HOLE_FACES                 : Used in `qHoleFaces`
 * @value FILLET_FACES               : Used in `qFilletFaces`
 * @value PATTERN                    : Used in `qMatchingFaces`
 * @value CONTAINS_POINT             : Used in `qContainsPoint`
 * @value INTERSECTS_LINE            : Not yet implemented
 * @value INTERSECTS_PLANE           : Used in `qIntersectsPlane`
 * @value INTERSECTS_BALL            : Not yet implemented
 * @value CLOSEST_TO                 : Used in `qClosestTo`
 * @value FARTHEST_ALONG             : Not yet implemented
 * @value LARGEST                    : Not yet implemented
 * @value SMALLEST                   : Not yet implemented
 * @value COEDGE                     : Used in `qCoedge`
 * @value MATE_CONNECTOR             : Used in `qMateConnector`
 * @value CONSTRUCTION_FILTER        : Used in `qConstructionFilter`
 * @value DEPENDENCY                 : Used in `qDependency`
 * @value TRACKING                   : Used in `startTracking`
 * @value CAP_ENTITY                 : Used in `qCapEntity`
 ******************************************************************************/
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
    ATTRIBUTE_FILTER,
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
    DEPENDENCY,
    TRACKING,
    CAP_ENTITY
}

/**
 * Specifies the topological type of a body.
 *
 * All bodies have `EntityType.BODY`, but will generally own many entities of
 * other `EntityType`s.
 *
 * For example, the result of an extrude with `NewBodyOperationType.NEW` is a
 * body. This body will have `BodyType.SOLID` for a solid extrude, and
 *`BodyType.SHEET` for a surface extrude. This extrude operation will create
 * many geometric entities in the context (faces, edges, or vertices), which
 * are owned by the body, and have the `BodyType` of their owning body.
 *
 * @see `qBodyType`
 *
 * @value SOLID : A three-dimensional part (e.g. the result of a solid extrude)
 * @value SHEET : A two-dimensional sheet body (e.g. a sketch region, or the
 *      result of a surface extrude)
 * @value WIRE  : A one-dimensional curve (e.g. a sketch line or curve, or the
 *      result of opHelix)
 * @value POINT : A zero-dimensional point (e.g. a sketch point, or the result
 *      of opPoint)
 * @value MATE_CONNECTOR : A part studio mate connector. For filtering
 *      selections only.
 */
export enum BodyType
{
    SOLID,
    SHEET,
    WIRE,
    POINT,
    MATE_CONNECTOR
}

/**
 * Specifies the topological type of a given entity. Used in several queries as
 * a filter, or on any query explicitly with `qEntityFilter`
 *
 * Thus, one can obtain all the vertices in a part studio with
 *`qEverything(EntityType.VERTEX)`,
 * and can obtain all the vertices attached to solid bodies with
 * `qBodyType(qEverything(EntityType.VERTEX), BodyType.SOLID)`
 *
 * A query for every part in a part studio is
 * `qBodyType(qEverything(EntityType.BODY), BodyType.SOLID)`
 *
 * @value VERTEX : A zero-dimensional point or vertex
 * @value EDGE : A one-dimensional line, curve, or edge
 * @value FACE : A two-dimensional surface, planar face, or non-planar face
 * @value BODY : A solid, surface, wire, or point body
 */
export enum EntityType
{
    VERTEX,
    EDGE,
    FACE,
    BODY
}

/**
 * Specifies the geometric type of queried entities. @see `qGeometry`.
 *
 * @value LINE : A straight line or edge
 * @value CIRCLE : A circle of constant radius
 * @value ARC : A segment of a circle
 * @value OTHER_CURVE : Any one-dimensional entity which is not described above
 *      (e.g. splines, elipses, etc.)
 * @value PLANE : A construction plane or planar face
 * @value CYLINDER : A surface which forms the side of a right circular cylinder
 * @value CONE : A surface which forms the side of a right circular cone
 * @value SPHERE : A surface which forms the boundary of a sphere
 * @value TORUS : A surface which forms the boundary of a torus
 * @value OTHER_SURFACE : Any two-dimensional entity which is not described
 *      above (e.g. the side of an arbitrary extrude, revolve, or loft)
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
 * Specifies whether the entity was created for construction (e.g. a
 * construction line or construction plane).
 *
 * Can be used in a filter on a query parameter to only allow certain selections:
 * ```
 * annotation { "Name" : "Edges to use", "Filter" : EntityType.EDGE && ConstructionObject.NO }
 * definition.edges is Query;
 * ```
 * @see `qConstructionFilter`
 *
 * @value YES : Matches only entities which are created for construction
 * @value NO  : Matches only entities which are not created for construction
 */
export enum ConstructionObject
{
    YES,
    NO
}

/**
 * Specifies whether the entity is a part of a sketch.
 *
 * Can be used in a filter on a query parameter to only allow certain selections:
 * ```
 * annotation { "Name" : "Sketch curves", "Filter" : EntityType.EDGE && SketchObject.YES }
 * definition.curves is Query;
 * ```
 * @value YES : Matches only entities which are part of a sketch
 * @value NO  : Matches only entities which are not part of a sketch
 */
export enum SketchObject
{
    YES,
    NO
}

/**
 * Specifies the topology of an edge entity.
 *
 * Can be used in a filter on a query parameter to only allow certain selections:
 * ```
 * annotation { "Name" : "Surface edges", "Filter" : EntityType.EDGE && EdgeTopology.LAMINAR }
 * definition.edges is Query;
 * ```
 * TODO: rename LAMINAR to "boundary" or somesuch that sounds less like we're
 * talking about fliud dynamics...
 *
 * @value LAMINAR : An edge adjacent to one surface (e.g. the edge of a surface extrude).
 * @value TWO_SIDED : An edge which joins two faces (e.g. the edge of a cube).
 */
export enum EdgeTopology
{
    LAMINAR,
    TWO_SIDED
}

/**
 * A set of convenience filters, which are expanded during precondition
 * processing. Can be used as a filter on query parameters, just like their
 * corresponding expansions:
 * ```
 * annotation { "Name" : "Axis", "Filter" : QueryFilterCompound.ALLOWS_AXIS }
 * definition.axis is Query;
 * ```
 * @value ALLOWS_AXIS : Equivalent to
 *      `GeometryType.LINE || GeometryType.CIRCLE || GeometryType.ARC || GeometryType.CYLINDER`
 */
export enum QueryFilterCompound
{
    ALLOWS_AXIS
}

/**
 * Specifies a method of comparing two items.
 * @see `qFilletFaces`
 */
export enum CompareType
{
    EQUAL,
    LESS,
    LESS_EQUAL,
    GREATER,
    GREATER_EQUAL
}

//Don't strip units off historical queries
/**
 * For Onshape internal use.
 *
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
 * An empty query, which does not resolve to any entities.
 */
export function qNothing() returns Query
{
    return { queryType : QueryType.NOTHING } as Query;
}

/**
 * A query for all entities of a specified EntityType
 * @param entityType : @optional
 */
export function qEverything(entityType is EntityType) returns Query
{
    return { queryType : QueryType.EVERYTHING, "entityType" : entityType } as Query;
}

export function qEverything() returns Query
{
    return { queryType : QueryType.EVERYTHING } as Query;
}

/**
 * A query for an element of a subquery at a specified index
 * @param subquery {Query} : A query which resolves to at least n+1 entities
 * @param n {number} : Zero-based index of element in subquery.
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
 * A query for entities of a subquery which match a given `EntityType`.
 */
export function qEntityFilter(subquery is Query, entityType is EntityType) returns Query
{
    return { queryType : QueryType.ENTITY_FILTER, "entityType" : entityType, "subquery" : subquery } as Query;
}

/**
* A query for entities of a subquery which have been assigned an attribute matching a given `attributePattern` @see `getAttributes`
*/
export function qAttributeFilter(subquery is Query, attributePattern) returns Query
{
    return { queryType : QueryType.ATTRIBUTE_FILTER, "attributePattern" : attributePattern, "subquery" : subquery } as Query;
}
/**
* A query for all entities which have been assigned an attribute matching a given `attributePattern`.
* Equivalent to `qAttributeFilter(qEverything(), attributePattern)`
*/
export function qAttributeQuery(attributePattern) returns Query
{
    return { queryType : QueryType.ATTRIBUTE_FILTER, "attributePattern" : attributePattern} as Query;
}
/**
 * A query for all the entities created by a feature or operation. The feature
 * is given by its feature id, which was passed into the the operation function
 * in order to create the feature.
 *
 * An entity is "created by" an operation if the entity was added to the
 * context as part of that operation. Entities modified, but not created, by an
 * operation are not returned by this query.
 *
 * If an entity is split (as in a split part operation), the resulting entities
 * are "created by" both the original entity's creator and the split part
 * operation.
 *
 * If two entities are merged (as in a union of coincident faces), that entity
 * is "created by" the creators of each merged entity, as well as the merging
 * operation itself.
 *
 * If a sketch's feature id is specified, returns a query for all sketch
 * regions, points, and wire bodies created by the specified sketch.
 *
 * @param featureId : The `Id` of the specified feature. @eg `id + "extrude1"`
 * @param entityType : @optional @autocomplete `EntityType.BODY`
 */
export function qCreatedBy(featureId is Id, entityType is EntityType) returns Query
{
    return { "queryType" : QueryType.CREATED_BY, "featureId" : featureId, "entityType" : entityType } as Query;
}

export function qCreatedBy(featureId is Id) returns Query
{
    return { "queryType" : QueryType.CREATED_BY, "featureId" : featureId } as Query;
}

/**
 * A transient query, which refers to a single entity in the context. All
 * transient queries are only valid until the context is modified again.
 *
 * This constructor should not be used directly. To obtain a list of transient
 * queries for specific entities, simply pass any other query into
 * `evaluateQuery`.
 */
export function qTransient(id is TransientId) returns Query
{
    return { "queryType" : QueryType.TRANSIENT, "transientId" : id } as Query;
}

/**
 * A query for the true dependency of the query. For instance, the true dependency of the extruded
 * body will be the face or sketch edges of the profile.
 * TODO: Explain this
 */
export function qDependency(subquery is Query) returns Query
{
    return { "queryType" : QueryType.DEPENDENCY, "subquery" : subquery } as Query;
}
/**
* A query for start/end cap entities created by featureId.
* Cap entities are produced by extrude, revolve, sweep and loft features
*/
export function qCapEntity(featureId is Id, isStartCap is boolean) returns Query
{
    return { "queryType" : QueryType.CAP_ENTITY,
             "featureId" : featureId,
            "startCap" : isStartCap} as Query;
}

/**
 * TODO: description
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

// =========================== Boolean Queries ================================

/**
 * A query for entities which match any of a list of queries.
 *
 * `qUnion` is guaranteed to preserve order. That is, entities which match
 * queries earlier in the `subqueries` input list will also be listed earlier
 * in the output of `evaluateQuery`.
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
 * A query for entities which match all of a list of queries.
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
 * A query for entities which match `query1`, but do not match `query2`.
 */
export function qSubtraction(query1 is Query, query2 is Query) returns Query
{
    return { "queryType" : QueryType.SUBTRACTION, "query1" : query1, "query2" : query2 } as Query;
}

/**
 * A query for entities which match either `query1` or `query2`, but not both.
 */
export function qSymmetricDifference(query1 is Query, query2 is Query) returns Query
{
    return qUnion([qSubtraction(query1, query2), qSubtraction(query2, query1)]);
}

// ======================= Topological Queries ================================

/**
 * A query for all of the entities (faces, verticies, edges, and bodies) in a
 * context which belong to a specified body or bodies.
 * @param entityType : @optional
 */
export function qOwnedByBody(part is Query, entityType is EntityType) returns Query
{
    return { "queryType" : QueryType.OWNED_BY_PART, "part" : part, "entityType" : entityType } as Query;
}

export function qOwnedByBody(part is Query) returns Query
{
    return { "queryType" : QueryType.OWNED_BY_PART, "part" : part } as Query;
}

/**
 * A query for all of the entities which match a subquery, and belong to the
 * specified body or bodies.
 */
export function qOwnedByBody(subquery is Query, part is Query) returns Query
{
    return { "queryType" : QueryType.OWNED_BY_PART, "subquery" : subquery, "part" : part } as Query;
}

/**
 * A query for each part that any entities in the `query` belong to.
 */
export function qOwnerBody(query is Query) returns Query
{
    return { "queryType" : QueryType.OWNER_PART, "query" : query } as Query;
}

/**
 * A query for all entities of specified `EntityType` that share a vertex with
 * any entities that match the input query. Examples:
 * @eg `qVertexAdjacent(vertex, EntityType.EDGE)` matches all edges adjacent to the given vertex.
 * @eg `qVertexAdjacent(face, EntityType.VERTEX)` matches all vertices adjacent to the given face.
 */
export function qVertexAdjacent(query is Query, entityType is EntityType) returns Query
precondition
{
    entityType != EntityType.BODY;
}
{
    return { "queryType" : QueryType.VERTEX_ADJACENT, "query" : query, "entityType" : entityType } as Query;
}

/**
 * A query for all entities of specified `EntityType` that share an edge with
 * any entities that match the input query. Examples:
 * @eg `qEdgeAdjacent(edge, EntityType.FACE)` matches all faces adjacent to the given edge.
 * @eg `qEdgeAdjacent(face, EntityType.EDGE)` matches all edges adjacent to the given face.
 *
 * More complicated queries are also possible.  For instance to match edges that bound a set `faces` on a solid body:
 * ```
 * const adjacentFaces = qSubtraction(qEdgeAdjacent(faces, EntityType.FACE), faces);
 * const boundary = qIntersection([qEdgeAdjacent(faces, EntityType.EDGE),
 *                                 qEdgeAdjacent(adjacentFaces, EntityType.EDGE)]);
 * ```
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
//======================== Geometry Type Queries ==============================

/**
 * A query for all entities of a specified `GeometryType` matching a subquery.
 * @see `GeometryType`
 */
export function qGeometry(subquery is Query, geometryType is GeometryType) returns Query
{
    return { "queryType" : QueryType.GEOMETRY, "geometryType" : geometryType, "subquery" : subquery } as Query;
}

/**
 * A query for all entities of a specified `BodyType` matching a subquery.
 * @see `BodyType`
 */
export function qBodyType(subquery is Query, bodyType is BodyType) returns Query
{
    return qBodyType(subquery, [bodyType]);
}

/**
 * A query for all entities with any of a list of `BodyType`s matching a
 * subquery.
 * @see `BodyType`
 *
 * @param bodyTypes : An array of `BodyType`s.
 */
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
 * A query for all construction entities, or all non-construction entities,
 * matching a subquery.
 * @see `ConstructionObject`
 */
export function qConstructionFilter(subquery is Query, constructionFilter is ConstructionObject) returns Query
{
    return { "queryType" : QueryType.CONSTRUCTION_FILTER, "constructionFilter" : constructionFilter, "subquery" : subquery } as Query;
}

// ======================= Geometry matching Queries ==========================
/* Not done yet
export function qPlanarNormal(subquery is Query, normal is Vector) returns Query
{
    return { "queryType" : QueryType.PLANE_NORMAL, "subquery" : subquery, "normal" : normal} as Query;
}
*/
// ======================= Tangency Queries ===================================
//TANGENT_EDGES,
//TANGENT_FACES,

// ======================= Faces Related Queries ==============================
/**
 * A query for a set of faces connected via convex edges. `subquery` is used as
 * a seed, and the query will flood-fill match any faces connected across a convex
 * edge.
 *
 * A convex edge is an edge which forms a convex angle along the full length of
 * the edge. A convex angle is strictly less than 180 degress for flat faces,
 * or faces with negative curvature. If one face has positive curvature, and
 * the other has flat or positive curvature, a convex angle is less than or
 * equal to 180 degrees. Thus, the two bounding edges of an exterior fillet are
 * considered convex.
 */
export function qConvexConnectedFaces(subquery is Query) returns Query
{
    return { "queryType" : QueryType.CONVEX_CONNECTED_FACES, "subquery" : subquery } as Query;
}

/**
 * A query for a set of faces connected via concave edges. `subquery` is used as
 * a seed, and the query will flood-fill match any faces connected across a concave
 * edge.
 *
 * A concave edge is an edge which forms a concave angle along the full length of
 * the edge. A concave angle is strictly greater than 180 degress for flat faces,
 * or faces with positive curvature. If one face has negative curvature, and
 * the other has flat or negative curvature, a concave angle is less than or
 * equal to 180 degrees. Thus, the two bounding edges of an interior fillet are
 * considered concave.
 */
export function qConcaveConnectedFaces(subquery is Query) returns Query
{
    return { "queryType" : QueryType.CONCAVE_CONNECTED_FACES, "subquery" : subquery } as Query;
}

/**
 * A query for a set of faces connected via tangent edges. `subquery` is used as
 * a seed, and the query will flood-fill match any faces connected across a tangent
 * edge.
 *
 * A tangent edge is an edge joining two faces such that the surface direction
 * is continuous across the edge, at every point along the full length of the
 * edge.
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
 * A query for all fully enclosed, 2D regions created by a sketch with the
 * specified feature id.
 *
 * @param filterInnerLoops : Specifies whether to exclude sketch regions fully
 *      contained in other sketch regions. Default is false.
 *      TODO: Is this right?
 *      @optional
 */
export function qSketchRegion(featureId is Id, filterInnerLoops is boolean) returns Query
{
    return { "queryType" : QueryType.SKETCH_REGION, "featureId" : featureId, "filterInnerLoops" : filterInnerLoops } as Query;
}

export function qSketchRegion(featureId is Id) returns Query
{
    return { "queryType" : QueryType.SKETCH_REGION, "featureId" : featureId, "filterInnerLoops" : false } as Query;
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
 * A query for all mate connectors owned by the parts of a subquery.
 */
export function qMateConnectorsOfParts(subquery is Query) returns Query
{
    return { "queryType" : QueryType.MATE_CONNECTOR, "subquery" : subquery } as Query;
}

/**
 * A query for fillet faces of radius equal to, less than and equal to, or greater than and equal to the
 * input faces. If subquery does not match one or more fillet faces, the resulting query will not
 * match any faces. Will find the fillet radius from the faces and then compare to find all the faces
 * of fillets that satisfy the compareType.
 *
 * TODO: What if subquery has multiple fillets with different radii?
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
 * A query for all entities (bodies, faces, edges, or points) containing a specified point.
 * @param point : A 3D point, in world space.
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
 * A query for all entities (bodies, faces, edges, or points) touching a specified infinite plane.
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

/**
 * For Onshape internal use.
 */
export function makeQuery(value is map) returns Query
{
    return value as Query;
}

/**
 * TODO: description
 */
export function makeQuery(operationId is Id, queryType is string, entityType, value is map) returns Query
precondition
{
    entityType == undefined || entityType is EntityType;
}
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
export function qSplitBy(featureId is Id, entityType, backBody is boolean)
precondition
{
    entityType == undefined || entityType is EntityType;
}
{
    return makeQuery(featureId, "SPLIT", entityType, { "isFromBackBody" : backBody });
}

/**
 * TODO: description
 * @param operationId
 * @param entityType
 * @param sketchEntityId
 */
export function sketchEntityQuery(operationId is Id, entityType, sketchEntityId is string) returns Query
precondition
{
    entityType == undefined || entityType is EntityType;
}
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
export function query(operationId is Id, queryType is string, entityType, value is map) returns Query
precondition
{
    entityType == undefined || entityType is EntityType;
}
{
    return makeQuery(operationId, queryType, entityType, value);
}

annotation { "Deprecated" : true }
export function query(value is map) returns Query
{
    return makeQuery(value);
}
