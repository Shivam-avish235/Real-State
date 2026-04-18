import { Router } from "express";

import { authGuard } from "../../common/middleware/auth-guard";
import { validateRequest } from "../../common/middleware/validate-request";

import {
    addPropertyImage,
    createProperty,
    deleteProperty,
    getPropertyById,
    listProperties,
    listPropertyImages,
    updateProperty
} from "./properties.controller";
import {
    addPropertyImageSchema,
    createPropertySchema,
    listPropertiesQuerySchema,
    propertyIdParamSchema,
    updatePropertySchema
} from "./properties.validation";

const propertiesRouter = Router();

propertiesRouter.use(authGuard);

propertiesRouter.get("/", validateRequest({ query: listPropertiesQuerySchema }), listProperties);
propertiesRouter.post("/", validateRequest({ body: createPropertySchema }), createProperty);
propertiesRouter.get("/:id", validateRequest({ params: propertyIdParamSchema }), getPropertyById);
propertiesRouter.patch("/:id", validateRequest({ params: propertyIdParamSchema, body: updatePropertySchema }), updateProperty);
propertiesRouter.delete("/:id", validateRequest({ params: propertyIdParamSchema }), deleteProperty);
propertiesRouter.get("/:id/images", validateRequest({ params: propertyIdParamSchema }), listPropertyImages);
propertiesRouter.post("/:id/images", validateRequest({ params: propertyIdParamSchema, body: addPropertyImageSchema }), addPropertyImage);

export { propertiesRouter };
