FeatureScript 1777; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present Onshape Inc.

import (path : "onshape/std/attributes.fs", version : "1777.0");
import (path : "onshape/std/containers.fs", version : "1777.0");
import (path : "onshape/std/context.fs", version : "1777.0");
import (path : "onshape/std/evaluate.fs", version : "1777.0");
import (path : "onshape/std/feature.fs", version : "1777.0");
import (path : "onshape/std/frameAttributes.fs", version : "1777.0");
import (path : "onshape/std/query.fs", version : "1777.0");
import (path : "onshape/std/units.fs", version : "1777.0");
import (path : "onshape/std/valueBounds.fs", version : "1777.0");

/** @internal */
export enum FrameCornerType
{
    annotation { "Name" : "Miter" }
    MITER,
    annotation { "Name" : "Butt" }
    BUTT,
    annotation { "Name" : "Coped Butt" }
    COPED_BUTT,
    annotation { "Name" : "None" }
    NONE
}

// Default cutlist table column ids/headers
/** @internal */
export const CUTLIST_ITEM = "Item";
/** @internal */
export const CUTLIST_QTY = "Qty";
/** @internal */
export const CUTLIST_STANDARD = "Standard";
/** @internal */
export const CUTLIST_DESCRIPTION = "Description";
/** @internal */
export const CUTLIST_LENGTH = "Length";
/** @internal */
export const CUTLIST_ANGLE_1 = "Angle 1";
/** @internal */
export const CUTLIST_ANGLE_2 = "Angle 2";

// Default descriptions for various cutlist entries
const CUTLIST_DESCRIPTION_CUSTOM_PROFILE = "Custom profile";
/** @internal */
export const CUTLIST_DESCRIPTION_CUTLIST_ENTRY = "Cutlist entry";

function qFrameTopology(queryToFilter is Query, topologyType is FrameTopologyType, isStart, isFrameTerminus)
{
    const attributeQuery = qHasAttributeWithValueMatching(queryToFilter, FRAME_ATTRIBUTE_TOPOLOGY_NAME, {
                "topologyType" : topologyType,
                "isStart" : isStart,
                "isFrameTerminus" : isFrameTerminus
            });
    return attributeQuery;
}

function isFaceOfTopologyType(context is Context, face is Query, topologyType is FrameTopologyType, isStart,
    isFrameTerminus) returns boolean
{
    const attributeQuery = qFrameTopology(face, topologyType, isStart, isFrameTerminus);
    return !isQueryEmpty(context, attributeQuery);
}

/** @internal */
export function isCapFace(context is Context, face is Query) returns boolean
{
    return isFaceOfTopologyType(context, face, FrameTopologyType.CAP_FACE, undefined, undefined);
}

/** @internal */
export function isStartFace(context is Context, face is Query) returns boolean
{
    return isFaceOfTopologyType(context, face, FrameTopologyType.CAP_FACE, true, undefined);
}

/** @internal */
export function isSweptFace(context is Context, face is Query) returns boolean
{
    return isFaceOfTopologyType(context, face, FrameTopologyType.SWEPT_FACE, undefined, undefined);
}

/** @internal */
export function isInternalCapFace(context is Context, face is Query) returns boolean
{
    return isFaceOfTopologyType(context, face, FrameTopologyType.CAP_FACE, undefined, false);
}

/** @internal */
export function isFrameCapFace(context is Context, face is Query) returns boolean
{
    return isFaceOfTopologyType(context, face, FrameTopologyType.CAP_FACE, undefined, true);
}

/** @internal */
export function qFrameStartFace(frame is Query) returns Query
{
    const faceQuery = qFrameTopology(qOwnedByBody(frame, EntityType.FACE), FrameTopologyType.CAP_FACE, true, undefined);
    return faceQuery;
}

/** @internal */
export function qFrameEndFace(frame is Query) returns Query
{
    const faceQuery = qFrameTopology(qOwnedByBody(frame, EntityType.FACE), FrameTopologyType.CAP_FACE, false, undefined);
    return faceQuery;
}

/** @internal */
export function qFrameOppositeFace(context is Context, frame is Query, face is Query) returns Query
{
    const allFaces = qOwnedByBody(frame, EntityType.FACE);
    const sweptFaces = qFrameSweptFace(frame);
    const oppositeFace = qSubtraction(allFaces, qUnion([sweptFaces, face]));
    return oppositeFace;
}

/** @internal */
export function qFrameSweptEdge(frame is Query) returns Query
{
    const edgeQuery = qFrameTopology(qOwnedByBody(frame, EntityType.EDGE), FrameTopologyType.SWEPT_EDGE, undefined, undefined);
    return edgeQuery;
}

/** @internal */
export function qFrameSweptFace(frame is Query) returns Query
{
    const sweptFaceQuery = qFrameTopology(qOwnedByBody(frame, EntityType.FACE), FrameTopologyType.SWEPT_FACE, undefined, undefined);
    return sweptFaceQuery;
}

/** @internal */
export function qFrameAllFaces(frame is Query) returns Query
{
    const allFrameTopologyFaces = qOwnedByBody(frame, EntityType.FACE)->qHasAttribute(FRAME_ATTRIBUTE_TOPOLOGY_NAME);
    return allFrameTopologyFaces;
}

/** @internal */
export function qFrameAllBodies()
{
    return qAllModifiableSolidBodies()->qHasAttribute(FRAME_ATTRIBUTE_PROFILE_NAME);
}

/** @internal */
export function qFrameCutlist(compositeBody is Query) returns Query
{
    const cutlistCompositeBodyQuery = qHasAttribute(compositeBody, FRAME_ATTRIBUTE_CUTLIST_NAME);
    return cutlistCompositeBodyQuery;
}

/** @internal */
export function getFrameProfileAttributeOrDefault(context is Context, profile is Query, configuration) returns FrameProfileAttribute
precondition
{
    configuration is map || configuration == undefined;
}
{
    const profileAttribute = getFrameProfileAttribute(context, profile);
    if (profileAttribute != undefined)
    {
        return profileAttribute;
    }

    if (isAtVersionOrLater(context, FeatureScriptVersionNumber.V1730_NO_CUSTOM_DESCRIPTION))
    {
        return frameProfileAttribute({});
    }
    else
    {
        // Old functionality: create a default description based off of configuration. Disabled because it does not play
        // well with config booleans and config variables.
        var description = CUTLIST_DESCRIPTION_CUSTOM_PROFILE;
        if (configuration != undefined)
        {
            for (var _, value in configuration)
            {
                description = description ~ " - " ~ value;
            }
        }
        return frameProfileAttribute({ (CUTLIST_DESCRIPTION) : description });
    }
}

/** @internal */
export function max(elements is array, lessThan is function)
{
    var max = undefined;
    for (var element in elements)
    {
        if (max == undefined || lessThan(max, element))
        {
            max = element;
        }
    }
    return max;
}
