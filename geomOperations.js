FeatureScript 9999; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present Onshape Inc.

/**
 * Operations are the basic modeling primitives of FeatureScript. Operations can do extrusion, filleting, transforms,
 * etc. An operation takes a context, an id, and a definition and modifies the context in accordance with the
 * definition. The modifications can be referenced by the passed-in id. Operations return `undefined` but can fail by
 * throwing an error or they can report warnings or infos. The status can be read with the getFeature... functions in
 * error.fs.
 *
 * When an operation parameter that requires one entity receives a query that resolves to multiple entities, it takes
 * the first resolved entity.
 *
 * The geomOperations.fs module contains wrappers around built-in Onshape operations and no actual logic.
 */
import(path : "onshape/std/context.fs", version : "");
import(path : "onshape/std/curveGeometry.fs", version : "");
/* opSplitPart uses enumerations from SplitOperationKeepType */
export import(path : "onshape/std/splitoperationkeeptype.gen.fs", version : "");
export import(path : "onshape/std/topologymatchtype.gen.fs", version : "");
/* opExtendSheet uses enumerations from ExtendSheetBoundingType */
export import(path : "onshape/std/extendsheetboundingtype.gen.fs", version : "");
/* opExtractSurface uses enumerations from ExtractSurfaceRedundancyType */
export import(path : "onshape/std/extractsurfaceredundancytype.gen.fs", version : "");

/**
 * Performs a boolean operation on multiple solid bodies.
 * @param id : @autocomplete `id + "boolean1"`
 * @param definition {{
 *      @field tools {Query} : The tool bodies.
 *      @field targets {Query} : @requiredif {`OperationType` is `SUBTRACTION` or `SUBTRACT_COMPLEMENT`, or
 *          if `targetsAndToolsNeedGrouping` is true.} The target bodies.
 *      @field operationType {BooleanOperationType} : The boolean operation to perform.
 *          @eg `BooleanOperationType.UNION` will merge any tool bodies that intersect or abut. When several bodies merge, the identity
 *              of the tool that appears earliest in the query is preserved (in particular, part color and part name are taken from it).
 *          @eg `BooleanOperationType.SUBTRACTION` will remove the union of all tools bodies from every target body.
 *          @eg `BooleanOperationType.INTERSECTION` will create the intersection of all tool bodies.
 *          @eg `BooleanOperationType.SUBTRACT_COMPLEMENT` will remove the complement of the union of all tool bodies from every target body.
 *      @field targetsAndToolsNeedGrouping {boolean} : @optional
 *              This option is for adjusting the behavior to be more suitable for doing the boolean
 *              as part of a body-creating feature (such as extrude). Default is `false`.
 *
 *      @field keepTools {boolean} : If true, the tools do not get consumed by the operation. Default is false. @optional
 *      @field matches {array}: @optional
 *          Array of topology matches between tools and targets. Each matching element is a map with fields `topology1`, `topology2`
 *          and `matchType`; where `topology1` and `topology2` are a pair of matching edges or faces and
 *          `matchType` is the type of match [TopologyMatchType] between them.
 *      @field recomputeMatches {boolean} :  @optional
 *          If true, matches will be recomputed and specified matches will be used only for surface alignment purposes (for surface boolean). Defaults to `false`.
 * }}
 */
/* TODO: describe `targetsAndToolsNeedGrouping` in fuller detail */
export function opBoolean(context is Context, id is Id, definition is map)
{
    return @opBoolean(context, id, definition);
}

/**
 * Either adds or removes material from the flat.
 * @internal
 * @param id : @autocomplete `id + "flatOp"`
 * @param definition {{
 *      @field faces {Query} : Faces to add or remove.
 *      @field operationType {BooleanOperationType} : The boolean operation to perform. Must be union or subtraction.
 * }}
 */
export function opSMFlatOperation(context is Context, id is Id, definition is map)
{
    return @opSMFlatOperation(context, id, definition);
}

/**
 * Adds a chamfer to given edges and faces.
 * @param id : @autocomplete `id + "chamfer1"`
 * @param definition {{
 *      @field entities {Query} : Edges and faces to chamfer.
 *      @field chamferType {ChamferType} : Determines where the new edges of the chamfer are positioned.
 *              @eg `ChamferType.EQUAL_OFFSETS` places both new edges `width` away from each original edge.
 *              @eg `ChamferType.TWO_OFFSETS` places edges `width1` and `width2` away.
 *              @eg `ChamferType.OFFSET_ANGLE` places one edge `width` away, and chamfers at an angle from that edge.
 *      @field width {ValueWithUnits} : @requiredif {`chamferType` is `EQUAL_OFFSETS` or `OFFSET_ANGLE`.}
 *              @eg `0.2 * inch`
 *      @field width1 {ValueWithUnits} : @requiredIf {`chamferType` is `TWO_OFFSETS`.}
 *      @field width2 {ValueWithUnits} : @requiredIf {`chamferType` is `TWO_OFFSETS`.}
 *      @field angle {ValueWithUnits} : @requiredIf {`chamferType` is `OFFSET_ANGLE`.}
 *      @field oppositeDirection {boolean} : @requiredIf {`chamferType` is `OFFSET_ANGLE` or `TWO_OFFSETS`.}
 *              `true` to reverse the two edges.
 *      @field tangentPropagation {boolean} : @optional
 *              `true` to propagate the chamfer along edges tangent to those passed in. Defaults to `false`.
 * }}
 */
/* TODO: make this interface more like an operation and less like a feature. */
export function opChamfer(context is Context, id is Id, definition is map)
{
    return @opChamfer(context, id, definition);
}

/**
 * Deletes bodies from the context.
 * @param id : @autocomplete `id + "deleteBodies1"`
 * @param definition {{
 *      @field entities {Query} : Entities to delete. Passing in entities other than bodies deletes their owning bodies.
 * }}
 */
export function opDeleteBodies(context is Context, id is Id, definition is map)
{
    return @opDeleteBodies(context, id, definition);
}

/**
 * This is a direct editing operation that attempts to delete faces of a solid body and extend other faces to fill the hole.
 * @param id : @autocomplete `id + "deleteFace1"`
 * @param definition {{
 *      @field deleteFaces {Query} : Faces to delete.
 *      @field includeFillet {boolean} : `true` to also delete fillets adjacent to the input faces.
 *              @autocomplete `false`
 *      @field capVoid {boolean} : If `capVoid` is `true` and the deleted face
 *              cannot be filled by extending the surrounding faces, will
 *              attempt to replace the face with a planar face.
 *              @autocomplete `false`
 *      @field leaveOpen {boolean} : @optional
 *              If `leaveOpen` is `true` the void from deleting faces is left open, potentially creating a surface out
 *              of a solid body. Default is `false`.
 *              @autocomplete `false`
 * }}
 */
export function opDeleteFace(context is Context, id is Id, definition is map)
{
    return @opDeleteFace(context, id, definition);
}

/**
 * @internal
 * Takes in a set of bodies and faces and creates solid bodies for the enclosed regions.
 * @param id : @autocomplete `id + "enclose"`
 * @param definition {{
 *      @field entities {Query} : Bodies and faces for enclosure.
 * }}
 */
export function opEnclose(context is Context, id is Id, definition is map)
{
    return @opEnclose(context, id, definition);
}

/**
 * Applies a given draft angle to faces.
 * @param id : @autocomplete `id + "draft1"`
 * @param definition {{
 *      @field neutralPlane {Query} : The face defining the neutral plane.  The intersection of the drafted faces
 *          and the neutral plane remains unchanged.
 *      @field pullVec {Vector} : The 3d direction relative to which the draft is applied.
 *              @eg `evPlane(context, {"face" : neutralPlane}).normal` will draft uniformly away from the neutral plane.
 *      @field draftFaces {Query} : The faces to draft.
 *      @field angle {ValueWithUnits} : The draft angle, must be between 0 and 89 degrees.
 *              @eg `3 * degree`
 *      @field tangentPropagation {boolean} : @optional
 *              `true` to propagate draft across tangent faces. Default is `false`.
 *      @field reFillet {boolean} : @optional
 *              `true` to attempt to defillet draft faces before the draft and reapply the fillets
 *              after. Default is `false`.
 * }}
 */
export function opDraft(context is Context, id is Id, definition is map)
{
    return @opDraft(context, id, definition);
}

/**
 * Extrudes one or more edges or faces in a given direction with one or two end conditions.
 * Faces get extruded into solid bodies and edges get extruded into sheet bodies.
 * @param id : @autocomplete `id + "extrude1"`
 * @param definition {{
 *      @field entities {Query} : Edges and faces to extrude.
 *      @field direction {Vector} : The 3d direction in which to extrude.
 *              @eg `evOwnerSketchPlane(context, {"entity" : entities}).normal` to extrude perpendicular to the owner sketch
 *              @eg `evPlane(context, {"face" : entities}).normal` to extrude perpendicular to the first planar entity
 *      @field endBound {BoundingType} : The type of bound at the end of the extrusion. Cannot be `SYMMETRIC`.
 *              @eg `BoundingType.BLIND`
 *      @field endDepth {ValueWithUnits} : @requiredif {`endBound` is `BLIND`.}
 *              How far from the `entities` to extrude.
 *              @eg `1 * inch`
 *      @field endBoundEntity {Query} : @requiredif {`endBound` is `UP_TO_SURFACE` or `UP_TO_BODY`.}
 *              The face or body that provides the bound.
 *      @field endTranslationalOffset {ValueWithUnits} : @optional
 *              The translational offset between the extrude end cap and the end bound entity. The direction vector for
 *              this is the same as `direction`: negative values pull the end cap away from the bound entity when
 *              `endDepth` is positive. `endOffset` will only have an effect if `endBound` is `UP_TO_SURFACE`,
 *              `UP_TO_BODY`, or `UP_TO_NEXT`.
 *      @field startBound {BoundingType} : @optional
 *              The type of start bound. Default is for the extrude to start at `entities`. Cannot be `SYMMETRIC`.
 *      @field isStartBoundOpposite : @requiredif {is `UP_TO_SURFACE`, `UP_TO_BODY`, or `UP_TO_NEXT`.}
 *              Whether the `startBound` extends in the opposite direction from the profile as the `endBound`. Defaults
 *              to `true` if not supplied.
 *      @field startDepth {ValueWithUnits} : @requiredif {`startBound` is `BLIND`.}
 *              How far from the `entities` to start the extrude.  The direction vector for this is the negative of `direction`:
 *              positive values make the extrusion longer when `endDepth` is positive.
 *      @field startBoundEntity {Query} : @requiredif {`startBound` is `UP_TO_SURFACE` or `UP_TO_BODY`.}
 *              The face or body that provides the bound.
 *      @field startTranslationalOffset {ValueWithUnits} : @optional
 *              The translational offset between the extrude start cap and the start bound entity. The direction vector for
 *              this is the negative of `direction`: negative values pull the end cap away from the bound entity when
 *              `startDepth` is positive. `startOffset` will only have an effect if `startBound` is `UP_TO_SURFACE`,
 *              `UP_TO_BODY`, or `UP_TO_NEXT`.
 * }}
 */
export function opExtrude(context is Context, id is Id, definition is map)
{
    return @opExtrude(context, id, definition);
}

/**
 * For edges, performs a fillet on the edge. For faces, performs a fillet on all edges adjacent to the face.
 * @param id : @autocomplete `id + "fillet1"`
 * @param definition {{
 *      @field entities {Query} : Edges and faces to fillet.
 *      @field radius {ValueWithUnits} : The fillet radius.
 *              @eg `1 * inch`
 *      @field tangentPropagation {boolean} : @optional
 *              `true` to propagate the fillet along edges tangent to those passed in. Default is `false`.
 *      @field crossSection {FilletCrossSection} : @optional
               Fillet cross section. One of `CIRCULAR`, `CONIC`, `CURVATURE`. Default is `CIRCULAR`.
 *      @field rho {number} : @requiredif {`crossSection` is `CONIC`.}
 *              A number between 0 and 1, specifying the Rho value of a conic fillet
 *              @ex `0.01` creates a flat, nearly-chamfered shape.
 *              @ex `0.99` creates a pointed, nearly-unchanged shape.
 *      @field magnitude {number} : @requiredif {`crossSection` is `CURVATURE`.}
 *              A number between 0 and 1, specifying the magnitude of curvature match.
 *      @field isVariable {boolean} : @optional Fillet controls can be varied at vertices via `vertexSettings`. Default is `false`.
 *      @field vertexSettings {array} : @optional Array of fillet settings at specified vertices.
        @field createDetachedSurface {boolean} : @optional
               Operation does not modify the body of the selected edges, but results in surface geometry of fillet. Default is `false`.
 * }}
 */
export function opFillet(context is Context, id is Id, definition is map)
{
    return @opFillet(context, id, definition);
}

/**
 * Creates a 3D cubic spline curve through an array of 3D points.
 * @param id : @autocomplete `id + "fitSpline1"`
 * @param definition {{
 *      @field points {array} : An array of `Vector`s with length units for the spline to interpolate. If the first
 *          point is the same as the last point, the spline is closed.
 *              @eg
 * ```
 * [
 *     vector( 1,  1,  1) * inch,
 *     vector(-1,  1, -1) * inch,
 *     vector( 1, -1, -1) * inch,
 *     vector(-1, -1,  1) * inch,
 *     vector( 1,  1,  1) * inch
 * ]
 * ```
 *      @field startDerivative {Vector} : A `Vector` with length units that specifies the derivative at the start of
 *          the resulting spline (according to the `arcLengthParameterization` set to `false`).  Ignored if spline
 *          is closed.  @optional
 *      @field endDerivative {Vector} : A `Vector` with length units that specifies the derivative at the end of
 *          the resulting spline.  Ignored if spline is closed.  @optional
 *      @field start2ndDerivative {Vector} : A `Vector` with length units that specifies the second derivative at the start of
 *          the resulting spline.  Ignored if spline is closed, or if `startDerivative` is not defined @optional
 *      @field end2ndDerivative {Vector} : A `Vector` with length units that specifies the second derivative at the end of
 *          the resulting spline.  Ignored if spline is closed, or if `endDerivative` is not defined @optional
 * }}
 */
export function opFitSpline(context is Context, id is Id, definition is map)
{
    return @opFitSpline(context, id, definition);
}

/**
 * Creates a helical and possibly spiral curve.
 * @param id : @autocomplete `id + "helix1"`
 * @param definition {{
 *      @field direction {Vector} : The direction of the helix axis.
 *              @eg `vector(0, 0, 1)`
 *      @field axisStart {Vector} : A point on the helix axis.
 *              @eg `vector(0, 0, 0) * inch`
 *      @field startPoint {Vector} : The start point of the infinite helix.  Must be off the axis.  This is the point at
 *          which the created curve would actually start if the first number of `interval` is 0.
 *              @eg `vector(1, 0, 0) * inch`
 *      @field interval {Vector} : An array of two numbers denoting the interval of the helix in terms of revolution counts.
 *              @eg `[0, 10]` will create a curve with 10 revolutions.
 *      @field clockwise {boolean} :
 *              @eg `true` if this is a clockwise helix when viewed along `direction`.
 *      @field helicalPitch {ValueWithUnits} : Distance along the axis between successive revolutions.
 *              @eg `0.1 * inch` will create a helix with 10 revolutions per inch.
 *          @eg `0 * inch` produces a planar Archimedean spiral.
 *      @field spiralPitch {ValueWithUnits} : Change in radius between successive revolutions.
 *          @eg `0 * inch` produces a helix that lies on a cylinder.
 * }}
 */
export function opHelix(context is Context, id is Id, definition is map)
{
    return @opHelix(context, id, definition);
}

/* TODO: Example of importing from a blob tab */
/**
 * Brings foreign geometry into the context. This function is used for importing uploaded parts.
 * @param id : @autocomplete `id + "importForeign1"`
 * @param definition {{
 *      @field foreignId {string} : The foreign data id (`dataId` from an imported blob tab).
 *      @field flatten {boolean} : Whether to flatten assemblies; defaults to false. @optional
 *      @field yAxisIsUp {boolean} : If true, the y axis in the import maps to the z axis and z maps to -y.
 *              If false (default), the coordinates are unchanged. @optional
 *      @field isModifiable {boolean} : Whether the imported data is modifiable (default) or not. @optional
 * }}
 */
export function opImportForeign(context is Context, id is Id, definition is map)
{
    return @opImportForeign(context, id, definition);
}

/**
 * Creates a surface or solid loft fitting an ordered set of profiles, optionally constrained by guide curves.
 * @param id : @autocomplete `id + "loft1"`
 * @param definition {{
 *      @field profileSubqueries {array} : An ordered array of queries for the profiles. For a solid loft, these must be
 *              sheet bodies, faces, or vertices. For a surface loft, these could be wire bodies, sheet bodies, faces, edges, or vertices.
 *      @field guideSubqueries {array} : An array of queries for guide curves. Each guide curve should intersect each profile once. @optional
 *      @field vertices {Query} : An array of vertices, one per profile, used in alignment of profiles. @optional
 *      @field makePeriodic {boolean} : Defaults to false. A closed guide creates a periodic loft regardless of this option. @optional
 *      @field bodyType {ToolBodyType} : Whether this is a solid (default) or a surface loft. @optional
 *      @field derivativeInfo {array} :  @optional An array of maps that contain shape constraints at start and end profiles. Each map entry
 *              is required to have a profileIndex that refers to the affected profile. Optional fields include a vector to match surface tangent to,
 *              a magnitude, and booleans for matching tangents or curvature derived from faces adjacent to affected profile.
 *              @eg `[ { "profileIndex" : 0, "vector" : vector(1, 0, 0), "magnitude" : 2., "tangentToPlane" : true}, { "profileIndex" : 1, "matchCurvature" : true, "adjacentFaces" : qFaces }]`
 *              The first map would constrain the resulting loft at the start profile to be tangent to plane with normal vector(1,0,0) and magnitude 2.
 *              The second map constrains the loft at the end profile to match the curvature of faces defined by the query qFaces.
 * }}
 */
export function opLoft(context is Context, id is Id, definition is map)
{
    return @opLoft(context, id, definition);
}

/**
 * Creates a mate connector, which represents a coordinate system in the context. Currently it is a special type of
 * point body.
 * @param id : @autocomplete `id + "mateConnector1"`
 * @param definition {{
 *      @field coordSystem {CoordSystem} : The mate connector coordinate system.
 *      @field owner {Query} : The owner body of the mate connector: when the owner is brought into an assembly, owned
 *          mate connectors will be brought in and move rigidly with it.  If the query resolves to multiple bodies, the
 *          first is taken as the owner.
 * }}
 */
export function opMateConnector(context is Context, id is Id, definition is map)
{
    return @opMateConnector(context, id, definition);
}

/**
 * Bring all of the information from `contextFrom` into `context`.  This is used, for example, for the Derived feature.
 * @param context {Context} : The target context.
 * @param id : @autocomplete `id + "mergeContexts1"`
 * @param definition {{
 *      @field contextFrom {Context} : The source context. It is rendered unusable by this operation.
 *              @eg `MyPartStudio::build()`
 * }}
 */
export function opMergeContexts(context is Context, id is Id, definition is map)
{
    return @opMergeContexts(context, id, definition);
}

/**
 * This is a direct editing operation that modifies or deletes fillets.
 * @param id : @autocomplete `id + "modifyFillet1"`
 * @param definition {{
 *      @field faces {Query} : The fillets to modify.
 *      @field modifyFilletType {ModifyFilletType} : Whether to change the fillet radii or remove them altogether.
 *      @field radius {ValueWithUnits} : @requiredif {`modifyFilletType` is `CHANGE_RADIUS`.} The new radius.
 *      @field reFillet {boolean} : @requiredif {`modifyFilletType` is `CHANGE_RADIUS`.}
 *              `true` to reapply adjacent fillets. Default is `false`.
 * }}
 */
export function opModifyFillet(context is Context, id is Id, definition is map)
{
    return @opModifyFillet(context, id, definition);
}

/**
 * This is a direct editing operation that applies a transform to one or more faces.
 * @param id : @autocomplete `id + "moveFace1"`
 * @param definition {{
 *      @field moveFaces {Query} : The faces to transform.
 *      @field transform {Transform} : The transform to apply to the face.
 *              @eg `transform(vector(0, 0, 1) * inch)` will translate the face 1 inch along the world's z-axis.
 *      @field reFillet {boolean} : @optional
 *              `true` to attempt to defillet `moveFaces` prior to the move and reapply the fillet
 *              after. Default is `false`.
 *      @field mergeFaces {boolean} : @optional
 *              `true` to remove redundant edges from moveFaces. Default is `true`.
 * }}
 */
export function opMoveFace(context is Context, id is Id, definition is map)
{
    return @opMoveFace(context, id, definition);
}

/**
 * This is a direct editing operation that offsets one or more faces.
 * @param id : @autocomplete `id + "offsetFace1"`
 * @param definition {{
 *      @field moveFaces {Query} : The faces to offset.
 *      @field offsetDistance {ValueWithUnits} : The positive or negative distance by which to offset.
 *              @eg `0.1 * inch` will offset the face 0.1 inches, normal to the face.
 *      @field reFillet {boolean} : @optional
 *              `true` to attempt to defillet `moveFaces` prior to the offset and reapply the fillet
 *              after. Default is `false`.
 *      @field mergeFaces {boolean} : @optional
 *              `true` to remove redundant edges from moveFaces. Default is `true`.
 * }}
 */
export function opOffsetFace(context is Context, id is Id, definition is map)
{
    return @opOffsetFace(context, id, definition);
}

/**
 * Patterns input faces and/or bodies by applying transforms to them. The original faces and bodies are preserved.
 * @param id : @autocomplete `id + "pattern1"`
 * @param definition {{
 *      @field entities {Query} : Bodies and faces to pattern.
 *      @field transforms {array} : An array of [Transform]s to apply to `entities`. The transforms do not have to be
 *          rigid.
 *      @field instanceNames {array} : An array of distinct non-empty strings the same size as `transforms` to identify
 *              the patterned entities.  Similar to an `Id`, an instance names may consist only of letters, numbers, and any of `+`, `-`, `/`, `_`.
 *      @field copyPropertiesAndAttributes {boolean} : If true (default), copies properties and attributes to patterned entities. @optional
 * }}
 */
/* TODO: make it easy to query for instance names */
export function opPattern(context is Context, id is Id, definition is map)
{
    return @opPattern(context, id, definition);
}

/**
 * Creates a construction plane.
 * @param id : @autocomplete `id + "plane1"`
 * @param definition {{
 *      @field plane {Plane} : The plane to create.
 *              @eg `plane(vector(0, 0, 6) * inch, vector(0, 0, 1))`
 *      @field width {ValueWithUnits} : The side length of the construction plane, as it is initially displayed.
 *              @autocomplete `6 * inch`
 *      @field height {ValueWithUnits} : The side length of the construction plane, as it is initially displayed.
 *              @autocomplete `6 * inch`
 *      @field defaultType @internalType {DefaultPlaneType} : For Onshape internal use. @optional
 * }}
 */
export function opPlane(context is Context, id is Id, definition is map)
{
    return @opPlane(context, id, definition);
}

/**
 * Creates a sphere.
 * @param definition {{
 *      @field radius {ValueWithUnits} : The radius of the sphere.
            @eg `1 * inch`
 *      @field center {Vector} : The location of the center of the sphere.
            @eg `vector(1, 1, 1) * inch`
 * }}
 */
export function opSphere(context is Context, id is Id, definition is map)
{
    return @opSphere(context, id, definition);
}

/**
 * Creates a construction point (a `BodyType.POINT` with one vertex).
 * @param id : @autocomplete `id + "point1"`
 * @param definition {{
 *      @field point {Vector} : The location of the point.
 *              @eg `vector(0, 0, 1) * inch`
 *      @field origin {boolean} : For Onshape internal use. @optional
 * }}
 */
export function opPoint(context is Context, id is Id, definition is map)
{
    return @opPoint(context, id, definition);
}

/**
 * This is a direct editing operation that replaces the geometry one or more faces with that of another face, possibly
 * with an offset.
 * @param id : @autocomplete `id + "replaceFace1"`
 * @param definition {{
 *      @field replaceFaces {Query} : The faces whose geometry to replace.
 *      @field templateFace {Query} : The face whose geometry to use as the replacement.
 *      @field offset {ValueWithUnits} : @optional
 *              The positive or negative distance by which to offset the resulting face.
 *      @field oppositeSense {boolean} : @optional
 *              If true, flip the surface normal of the resulting face, which may
 *              be necessary to match the surface normals of surrounding faces.
 *              Default is `false`.
 * }}
 */
export function opReplaceFace(context is Context, id is Id, definition is map)
{
    return @opReplaceFace(context, id, definition);
}

/**
 * Revolves edges and faces about an axis to produce sheet and solid bodies. The edges and faces may abut, but not
 * strictly intersect the axis.
 * @param id : @autocomplete `id + "revolve1"`
 * @param definition {{
 *      @field entities {Query} : The edges and faces to revolve.
 *      @field axis {Line} : The axis around which to revolve.
 *              @eg `line(vector(0, 0, 0) * inch, vector(0, 0, 1))`
 *      @field angleForward {ValueWithUnits} : The angle where the revolve ends relative to `entities`. Normalized to the range \[0, 2 PI).
 *              @eg `30 * degree`
 *      @field angleBack {ValueWithUnits} : The angle where the revolve starts relative to `entities`. Normalized to the range \[0, 2 PI).
 *          If `angleForward == angleBack`, the revolve is a full (360-degree) revolve. Defaults to `0`. @optional
 * }}
 */
export function opRevolve(context is Context, id is Id, definition is map)
{
    return @opRevolve(context, id, definition);
}

/**
 * Create a shell of a solid body with uniform thickness. The bodies that are passed
 * in are hollowed, omitting the walls on the `face` entities passed in.
 * @param id : @autocomplete `id + "shell1"`
 * @param definition {{
 *      @field entities {Query} : The faces to shell and solid bodies to hollow.
 *      @field thickness {ValueWithUnits} : The distance by which to shell. Positive means shell outward, and negative
 *              means shell inward. @autocomplete `0.1 * inch`
 * }}
 */
export function opShell(context is Context, id is Id, definition is map)
{
    return @opShell(context, id, definition);
}

/**
 * Split solid and sheet bodies with the given sheet body.
 * @param id : @autocomplete `id + "splitPart1"`
 * @param definition {{
 *      @field targets {Query} : The solid and sheet bodies to split.
 *      @field tool {Query} : A sheet body, a construction plane or a face to cut with.
 *              If a planar face is passed in, the split will extend the plane infinitely unless `useTrimmed` is `true`.
 *      @field keepTools {boolean} : If false (default), the tool is deleted. @optional
 *      @field keepType {SplitOperationKeepType} : Controls which pieces to keep. Default is `KEEP_ALL`. @optional
 *      @field useTrimmed {boolean} : Controls whether the underlying surface or the trimmed face boundaries are used as the tool. @optional
 * }}
 */
/* TODO: why not wires? */
export function opSplitPart(context is Context, id is Id, definition is map)
{
    return @opSplitPart(context, id, definition);
}

/**
 * Split faces with the given edges or faces.
 * @param id : @autocomplete `id + "splitFace1"`
 * @param definition {{
 *      @field faceTargets {Query} : The faces to split.
 *      @field edgeTools {Query} : @optional
 *              The edges to cut with.
 *      @field direction {Vector} : @requiredif {there are edge tools.}
 *              The projection direction.
 *      @field bodyTools {Query} : @optional
 *              The bodies to cut with.
 *      @field planeTools {Query} : @optional
 *              The planes to cut with.
 * }}
 */
export function opSplitFace(context is Context, id is Id, definition is map)
{
    return @opSplitFace(context, id, definition);
}

/**
 * Sweep the given edges and faces along a path resulting in solid and/or sheet bodies.
 * @param id : @autocomplete `id + "sweep1"`
 * @param definition {{
 *      @field profiles {Query} : Edges and faces to sweep.
 *      @field path {Query} : Edges that comprise the path along which to sweep. The edges can be in any order but
 *          must form a connected path.
 *      @field keepProfileOrientation {boolean} : If `true`, the profile maintains its original orientation as it is
 *              swept. If `false` (default), the profile rotates to remain normal to the path. @optional
 *      @field lockFaces {Query} : Keep profile aligned to the normals of these faces. @optional
 * }}
 */
export function opSweep(context is Context, id is Id, definition is map)
{
    return @opSweep(context, id, definition);
}

/**
 * Thicken sheet bodies and faces into solid bodies.
 * @param id : @autocomplete `id + "thicken1"`
 * @param definition {{
 *      @field entities {Query} : The sheet bodies and faces to thicken.
 *      @field thickness1 {ValueWithUnits} : The distance by which to thicken in the direction along the normal.
 *              @autocomplete `0.1 * inch`
 *      @field thickness2 {ValueWithUnits} : The distance by which to thicken in the opposite direction.
 *              @autocomplete `0.1 * inch`
 * }}
 */
export function opThicken(context is Context, id is Id, definition is map)
{
    return @opThicken(context, id, definition);
}

/**
 * Applies a given transform to one or more bodies. To make transformed copies of bodies, use [opPattern].
 *
 * @param id : @autocomplete `id + "transform1"`
 * @param definition {{
 *      @field bodies {Query} : The bodies to transform.
 *      @field transform {Transform} : The transform to apply.
 *              @eg `transform(vector(0, 0, 1) * inch)` will translate the body 1 inch along the world's z-axis.
 *              @eg `rotationAround(myLine, 30 * degree)` will rotate around a [Line] object.
 *              @eg `scaleUniformly(factor)` will scale uniformly about the origin.
 *              @eg `scaleUniformly(factor, point)` will scale uniformly about a given point.
 *              @eg `toWorld(cSys)` will (somewhat counterintuitively) perform a transform such that geometry on
 *                  the world's origin and axes will move to the `cSys` origin and axes.
 *              @eg `fromWorld(cSys)` will (somewhat counterintuitively) perform a transform such that geometry on
 *                  the `cSys` origin and axes will move to the world origin and axes.
 *              @eg `transform2 * transform1` will perform `transform1`, followed by `transform2`.
 * }}
 */
export function opTransform(context is Context, id is Id, definition is map)
{
    return @opTransform(context, id, definition);
}

/**
 * @internal
 * Extends the perimeter of a sheet body, moves sheet edges by distance or up to surface
 * @param id : @autocomplete `id + "extendBody1"`
 * @param definition {{
 *    @field extendMethod {ExtendSheetBoundingType} : @autocomplete `ExtendSheetBoundingType.EXTEND_BY_DISTANCE`
 *    @field entities {Query} : @requiredif{'extendMethod' is 'ExtendSheetBoundingType.EXTEND_BY_DISTANCE'} Bodies or edges to extend.
 *    @field distance {ValueWithUnits} : @requiredif{'extendMethod' is 'ExtendSheetBoundingType.EXTEND_BY_DISTANCE'} The distance to extend by. Must be positive.
 *                                       @autocomplete `0.1 * inch`
 *    @field limitEntity : @requiredif{'extendMethod' is 'ExtendSheetBoundingType.EXTEND_TO_SURFACE'} Entity to extend up to. Can be a face [Query], a [Plane] or a [Cylinder].
 *    @field offset {ValueWithUnits} : Offset for EXTEND_TO_SURFACE. @optional
 *    @field oppositeDirection {boolean} : For use with EXTEND_TO_SURFACE @optional
 *    @field edgeLimitOptions {array} : An array of objects with overriding options for specific edges for use with EXTEND_TO_SURFACE
 *                                      Takes the form ("edge", "offset", "limitEntity", "faceToExtend", "helpPoint"). Both offset and limitEntity are optional
 *                                      and will override the other offset and limitEntity parameters for the specified edge.
 *                                      The same edge can be specified multiple times as long as "faceToExtend" is different each time. @optional
 * }}
 */
export function opExtendSheetBody(context is Context, id is Id, definition is map)
{
    return @opExtendSheetBody(context, id, definition);
}

/**
 * @internal
 * @param id : @autocomplete `id + "changeEdge1"`
 * @param definition {{
 *    @field edgeChangeOptions {array} : An array of maps of the form ("edge", "face", "offset", "transformList", "replaceFace").
 *                                      Edge and face are required and are the edge and face being modified.
 *                                      The other parameters are optional. If offset is a length parameter, the edge will
 *                                      be offset. If transform list is an array of transforms, they will be applied to the edge.
 *                                      If replaceFace is a face, the edge will be moved to that face.
 * }}
 */
export function opEdgeChange(context is Context, id is Id, definition is map)
{
    return @opEdgeChange(context, id, definition);
}

/**
 * @internal
 * This function takes a list of faces and creates one or more surfaces from those faces.
 * The source faces and body are not affected.
 * @param id : @autocomplete `id + "extractSurface1"`
 * @param definition {{
 *    @field faces {Query} : List of faces to be converted. If `tangentPropagation` is `true`, these are the seed faces.
 *    @field tangentPropagation {boolean} : Whether additional faces should be added to the selection by tangent propagation @optional
 *    @field offset {ValueWithUnits} : Offset extracted surface faces by this distance along normal @optional
 *    @field useFacesAroundToTrimOffset {boolean} : Use surrounding faces extensions to trim offset. Default `true`. @optional
 *    @field redundancyType {ExtractSurfaceRedundancyType} : @optional
 *              Controls the culling of redundant geometry on the result body, such as tangent edges and vertices.
 *              `ALLOW_REDUNDANCY` does not delete any redundant geometry. `REMOVE_ADDED_REDUNDANCY` removes redundancy
 *              created by this operation.  `REMOVE_ALL_REDUNDANCY` removes all redundant edges and vertices.
 *              `REMOVE_ADDED_REDUNDANCY` is the default.
 * }}
 */
export function opExtractSurface(context is Context, id is Id, definition is map)
{
    @opExtractSurface(context, id, definition);
}

/**
 * @internal
 * Generates surfaces representing the outlines of parts or surfaces projected onto a surface
 * @param id : @autocomplete `id + "createOutline1"`
 * @param definition {{
 *      @field tools {Query} : The tool parts or surfaces
 *      @field target {Query} : The face whose surface will be used to create outline.
 *                              Currently only planes, cylinders or extruded surfaces are supported.
 *      @field offsetFaces {Query} : Faces in tools which are offsets of target face. @optional
 * }}
 */
export function opCreateOutline(context is Context, id is Id, definition is map)
{
    return @opCreateOutline(context, id, definition);
}


/**
 * Generates a wire body given a [BSplineCurve] definition.
 * The spline must have dimension of 3 and be G1-continuous.
 * @param id : @autocomplete `id + "bSplineCurve1"`
 * @param definition {{
 *      @field bSplineCurve {BSplineCurve} : The definition of the spline.
 * }}
 */
export function opCreateBSplineCurve(context is Context, id is Id, definition is map)
{
    return @opCreateBSplineCurve(context, id, definition.bSplineCurve);
}

/**
 * Generates wire bodies from the supplied edges.
 * If the edges are disjoint multiple wires will be returned.
 * If the edges overlap or cross, or more than two meet at a point, the function will fail.
 * @param id : @autocomplete `id + "opExtractWires1"`
 * @param definition {{
 *      @field edges {Query} : The edges to be extracted.
 * }}
 */
export function opExtractWires(context is Context, id is Id, definition is map)
{
    return @opExtractWires(context, id, definition);
}

/**
 * @internal
 * Under development, not for general use.
 *
 * Assigns name to the entity. This will allow using qNamed() to query the entity.
 * When historical queries are generated, qNamed() will be used as a shortcut.
 * If definition.entity resolves to multiple entities, the operation completes with a warning status.
 * @param id : @autocomplete `id + "nameEntity1"`
 * @param definition {{
 *      @field entity {Query} : The entity to be named.
 *      @field entityName {string} : The name, should be unique in the part studio.
 * }}
*/
export function opNameEntity(context is Context, id is Id, definition is map)
{
    return @opNameEntity(context, id, definition);
}


/**
 * Generates a surface body from supplied boundary and internal constraints. The boundaries are defined as
 * edge queries for each continuity constraint. The internal constraints may be defined as a set of support vertices.
 * @param id : @autocomplete `id + "opFillSurface1"`
 * @param definition {{
 *      @field edgesG0 {Query} : The edges with position constraints.
 *      @field edgesG1 {Query} : The edges with tangency constraints.
 *      @field edgesG2 {Query} : The edges with curvature constraints.
 *      @field guideVertices {Query} : The vertices the resulting surface is expected to interpolate.
 *      @field showIsocurves {boolean} : Show graphical representation of a subset of isoparameteric curves of the created surface. Default `false`. @optional
 * }}
 */
export function opFillSurface(context is Context, id is Id, definition is map)
{
    return @opFillSurface(context, id, definition);
}
