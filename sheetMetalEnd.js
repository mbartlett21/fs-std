FeatureScript 9999; /* Automatically generated version */
// This module is part of the FeatureScript Standard Library and is distributed under the MIT License.
// See the LICENSE tab for the license text.
// Copyright (c) 2013-Present Onshape Inc.


import(path : "onshape/std/attributes.fs", version : "");
import(path : "onshape/std/containers.fs", version : "");
import(path : "onshape/std/error.fs", version : "");
import(path : "onshape/std/feature.fs", version : "");
import(path : "onshape/std/string.fs", version : "");
import(path : "onshape/std/sheetMetalAttribute.fs", version : "");
import(path : "onshape/std/sheetMetalUtils.fs", version : "");

/**
 * Deactivate the sheet metal model of selected parts.
 * Continued modeling on deactivated sheet metal parts will not be represented in the flat pattern or the table.
 */
annotation { "Feature Type Name" : "Finish sheet metal" }
export const sheetMetalEnd = defineSheetMetalFeature(function(context is Context, id is Id, definition is map)
    precondition
    {
        annotation { "Name" : "Sheet metal parts", "MaxNumberOfPicks" : 1,
                     "Filter" : EntityType.BODY && ActiveSheetMetal.YES && ModifiableEntityOnly.YES }
        definition.sheetMetalParts is Query;
    }
    {
        checkNotInFeaturePattern(context, definition.sheetMetalParts, ErrorStringEnum.SHEET_METAL_NO_FEATURE_PATTERN);

        const resolvedEntities = evaluateQuery(context, definition.sheetMetalParts);
        if (size(resolvedEntities) == 0)
        {
            throw regenError(ErrorStringEnum.SHEET_METAL_SELECT_PART, ["sheetMetalParts"]);
        }


        if (!areEntitiesFromSingleActiveSheetMetalModel(context, definition.sheetMetalParts))
        {
            throw regenError(ErrorStringEnum.SHEET_METAL_SINGLE_MODEL_NEEDED, ["sheetMetalParts"]);
        }

        var smModels = qEntityFilter(qUnion(getSMDefinitionEntities(context, definition.sheetMetalParts)), EntityType.BODY);
        var attributes = getSmObjectTypeAttributes(context, smModels, SMObjectType.MODEL);

        if (size(attributes) != 1)
        {
            throw regenError(ErrorStringEnum.REGEN_ERROR, ["sheetMetalParts"]);
        }
        const modelAttribute = attributes[0];
        var newAttribute = modelAttribute;
        newAttribute.active = false;
        newAttribute.endSheetMetalId = {"value" : toAttributeId(id)};
        replaceSMAttribute(context, modelAttribute, newAttribute);
        updateSheetMetalGeometry(context, id, {"entities" : smModels});
        if (!featureHasNonTrivialStatus(context, id))
        {
            reportFeatureInfo(context, id, ErrorStringEnum.SHEET_METAL_END_DONE);
        }
    }, {});
