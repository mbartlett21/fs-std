FeatureScript 2716; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present PTC Inc.

/* Automatically generated file -- DO NOT EDIT */

/**
 * Specifies how a mate connector's coordinate system is defined with respect to an entity.
 * @seealso [mateConnector]
 *
 *           @value POINT             : Place a mate connector at a vertex with the world coordinate system, or at
 *                                      the tip of a conical face with its Z-axis along the cone axis.
 *           @value CENTROID          : Place a mate connector at the centroid of a face, with its Z-axis along the
 *                                      face normal at that point.
 *           @value CENTER            : Place a mate connector at the center of a circular or elliptical edge with
 *                                      its Z-axis along the normal of the plane which the edge lies on, or at the
 *                                      center of a sphere with the world coordinate system.
 *           @value MID_POINT         : Place a mate connector at the midpoint of an edge, with its Z-axis along
 *                                      the edge.
 *           @value TOP_AXIS_POINT    : Place a mate connector at the projection of the top extreme of a cylindrical
 *                                      or other revolved face onto the central axis of that face, with its Z-axis
 *                                      along the central axis.
 *           @value MID_AXIS_POINT    : Place a mate connector at the projection of the point midway betwen the top
 *                                      and bottom extremes of a cylindrical or other revolved face onto the central
 *                                      axis of that face, with its Z-axis along the central axis.
 *           @value BOTTOM_AXIS_POINT : Place a mate connector at the projection of the bottom extreme of a
 *                                      cylindrical or other revolved face onto the central axis of that face, with
 *           @value LOOP_CENTER       : Place a mate connector at the center of a loop of planar edges, with its
 *                                      Z-axis along the normal of the plane. Only one edge of the loop needs to
 *                                      be selected for this inference.
 *           @value VIRTUAL_SHARP     : Place a mate connector at locations along a loop of planar edges where a single
 *                                      nonlinear edge sits between two nonparallel lines and is tangent to both.
 *                                      The mate origin will be the projected intersection of the two lines, with its
 *                                      Z-axis along the normal of the plane.
 * @internal @value PART_ORIGIN       : Not implemented for FeatureScript.
 * @internal @value ORIGIN_X          : Not implemented for FeatureScript.
 * @internal @value ORIGIN_Y          : Not implemented for FeatureScript.
 * @internal @value ORIGIN_Z          : Not implemented for FeatureScript.
 */
export enum EntityInferenceType
{
    PART_ORIGIN,
    POINT,
    CENTROID,
    CENTER,
    MID_POINT,
    TOP_AXIS_POINT,
    MID_AXIS_POINT,
    BOTTOM_AXIS_POINT,
    ORIGIN_X,
    ORIGIN_Y,
    ORIGIN_Z,
    LOOP_CENTER,
    VIRTUAL_SHARP
}

