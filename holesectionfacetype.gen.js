FeatureScript 2716; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present PTC Inc.

/* Automatically generated file -- DO NOT EDIT */

/**
 * @internal.
 * Defines the section faces for the hole cut.
 *
 * @value THROUGH_FACE : The face that represents the through hole face of the hole feature.
 * @value CBORE_DIAMETER_FACE : The face that represents the counter bore diameter face of a CBore hole feature.
 * @value CBORE_DEPTH_FACE : The face that represents the counter bore depth face of a CBore hole feature.
 * @value CSINK_FACE : The face that represents the counter sink angular face of a CSink hole feature.
 * @value CSINK_CBORE_FACE : The face that represents the counter bore diameter face of a CSink hole feature.
 * @value BLIND_TIP_FACE : The face that represents the terminating face of a blind hole feature.
 * @value EXTERNAL_THREAD_CHAMFER_FACE : The face that represents the chamfer face of an external thread feature.
 * @value CLEARANCE_DIAMETER_FACE : The face that represents the clearance diameter face of a tapped hole feature.
 * @value CLEARANCE_DEPTH_FACE : The face that represents the clearance depth face of a tapped hole feature.
 */
export enum HoleSectionFaceType
{
    annotation {"Name" : "Through Hole Face"}
    THROUGH_FACE,
    annotation {"Name" : "CBore Diameter Face"}
    CBORE_DIAMETER_FACE,
    annotation {"Name" : "CBore Depth Face"}
    CBORE_DEPTH_FACE,
    annotation {"Name" : "CSink Angular Face"}
    CSINK_FACE,
    annotation {"Name" : "CBore Diameter Face on CSink Hole"}
    CSINK_CBORE_FACE,
    annotation {"Name" : "Blind Tip Angular Face"}
    BLIND_TIP_FACE,
    annotation {"Name" : "External Thread Chamfered Face"}
    EXTERNAL_THREAD_CHAMFER_FACE,
    annotation {"Name" : "Clearance Diameter Face"}
    CLEARANCE_DIAMETER_FACE,
    annotation {"Name" : "Clearance Depth Face"}
    CLEARANCE_DEPTH_FACE
}

