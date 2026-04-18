import { Router } from "express";

import { authGuard } from "../../common/middleware/auth-guard";
import { validateRequest } from "../../common/middleware/validate-request";

import {
    createApiCredential,
    getApiCredentialById,
    listApiCredentials,
    revokeApiCredential,
    rotateApiCredential,
    updateApiCredential
} from "./integrations.controller";
import {
    createApiCredentialSchema,
    credentialIdParamSchema,
    listApiCredentialsQuerySchema,
    rotateApiCredentialSchema,
    updateApiCredentialSchema
} from "./integrations.validation";

const integrationsRouter = Router();

integrationsRouter.use(authGuard);

integrationsRouter.get("/credentials", validateRequest({ query: listApiCredentialsQuerySchema }), listApiCredentials);
integrationsRouter.post("/credentials", validateRequest({ body: createApiCredentialSchema }), createApiCredential);
integrationsRouter.get("/credentials/:id", validateRequest({ params: credentialIdParamSchema }), getApiCredentialById);
integrationsRouter.patch(
  "/credentials/:id",
  validateRequest({ params: credentialIdParamSchema, body: updateApiCredentialSchema }),
  updateApiCredential
);
integrationsRouter.post("/credentials/:id/revoke", validateRequest({ params: credentialIdParamSchema }), revokeApiCredential);
integrationsRouter.post(
  "/credentials/:id/rotate",
  validateRequest({ params: credentialIdParamSchema, body: rotateApiCredentialSchema }),
  rotateApiCredential
);

export { integrationsRouter };
