FeatureScript 2716; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present PTC Inc.

/* Automatically generated file -- DO NOT EDIT */

/**
 * @internal.
 * Types of corner relief in sheet metal parts.
 * Is only ever used in FeatureScript and no built-ins work with it.
 * See [SMReliefStyle] for the enum used in built-ins */
export enum SMCornerReliefStyle
{
    annotation {"Name" : "Square - Sized"}
    SIZED_RECTANGLE,
    annotation {"Name" : "Rectangle - Scaled"}
    RECTANGLE,
    annotation {"Name" : "Round - Sized"}
    SIZED_ROUND,
    annotation {"Name" : "Round - Scaled"}
    ROUND,
    annotation {"Name" : "Closed"}
    CLOSED,
    annotation {"Name" : "Simple"}
    SIMPLE
}

