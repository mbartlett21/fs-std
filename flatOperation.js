FeatureScript 9999; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present Onshape Inc.

// Under development, internal use only
// Imports used in interface
export import(path : "onshape/std/query.fs", version : "");

import(path : "onshape/std/attributes.fs", version : "");
import(path : "onshape/std/booleanoperationtype.gen.fs", version : "");
import(path : "onshape/std/containers.fs", version : "");
import(path : "onshape/std/evaluate.fs", version : "");
import(path : "onshape/std/feature.fs", version : "");
import(path : "onshape/std/sheetMetalAttribute.fs", version : "");
import(path : "onshape/std/sheetMetalUtils.fs", version : "");
import(path : "onshape/std/surfaceGeometry.fs", version : "");

/**
 * @internal
 * Feature performing an [opSMFlatOperation]
 */
annotation { "Feature Type Name" : "Flat cut" }
export const SMFlatOperation = defineSheetMetalFeature(function(context is Context, id is Id, definition is map)
    precondition
    {
        annotation { "Name" : "Creation type", "UIHint" : "HORIZONTAL_ENUM" }
        definition.flatOperationType is FlatOperationType;
        annotation { "Name" : "Faces and sketch regions", "Filter" : EntityType.FACE && AllowFlattenedGeometry.YES }
        definition.faces is Query;
    }
    {
        const smDefinitionBodiesQ = getSheetMetalModelForPart(context, qUnion([qPartsAttachedTo(definition.faces), qOwnerBody(definition.faces)]));
        const sheetMetalEntitiesQ = qUnion([qOwnedByBody(smDefinitionBodiesQ, EntityType.EDGE), qOwnedByBody(smDefinitionBodiesQ, EntityType.FACE), smDefinitionBodiesQ]);
        const tracking = startTracking(context, sheetMetalEntitiesQ);

        const originalEntities = evaluateQuery(context,qOwnedByBody(smDefinitionBodiesQ));
        const initialAssociationAttributes = getAttributes(context, {
                    "entities" : qUnion(originalEntities),
                    "attributePattern" : {} as SMAssociationAttribute });
        definition.operationType = definition.flatOperationType == FlatOperationType.ADD ? BooleanOperationType.UNION : BooleanOperationType.SUBTRACTION;
        opSMFlatOperation(context, id, definition);
        const newEntities = qUnion([qCreatedBy(id), tracking]);
        const toUpdate = assignSMAttributesToNewOrSplitEntities(context, qOwnerBody(newEntities),
                originalEntities, initialAssociationAttributes);

        try (updateSheetMetalGeometry(context, id + "smUpdate", {
                    "entities" : toUpdate.modifiedEntities,
                    "deletedAttributes" : toUpdate.deletedAttributes,
                    "associatedChanges" : tracking }));
        processSubfeatureStatus(context, id, { "subfeatureId" : id + "smUpdate", "propagateErrorDisplay" : true });
    }, {});

/**
 * @internal
 */
export enum FlatOperationType
{
    annotation { "Name" : "Punch" }
    REMOVE,
    annotation { "Name" : "Tab" }
    ADD
}

