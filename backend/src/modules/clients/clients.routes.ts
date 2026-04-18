import { Router } from "express";

import { authGuard } from "../../common/middleware/auth-guard";
import { validateRequest } from "../../common/middleware/validate-request";

import {
    addClientInteraction,
    addClientVisit,
    createClient,
    deleteClient,
    getClientById,
    getClientInteractions,
    listClients,
    updateClient
} from "./clients.controller";
import {
    addClientInteractionSchema,
    addClientVisitSchema,
    clientIdParamSchema,
    createClientSchema,
    listClientsQuerySchema,
    updateClientSchema
} from "./clients.validation";

const clientsRouter = Router();

clientsRouter.use(authGuard);

clientsRouter.get("/", validateRequest({ query: listClientsQuerySchema }), listClients);
clientsRouter.post("/", validateRequest({ body: createClientSchema }), createClient);
clientsRouter.get("/:id", validateRequest({ params: clientIdParamSchema }), getClientById);
clientsRouter.patch("/:id", validateRequest({ params: clientIdParamSchema, body: updateClientSchema }), updateClient);
clientsRouter.delete("/:id", validateRequest({ params: clientIdParamSchema }), deleteClient);
clientsRouter.get("/:id/interactions", validateRequest({ params: clientIdParamSchema }), getClientInteractions);
clientsRouter.post("/:id/interactions", validateRequest({ params: clientIdParamSchema, body: addClientInteractionSchema }), addClientInteraction);
clientsRouter.post("/:id/visits", validateRequest({ params: clientIdParamSchema, body: addClientVisitSchema }), addClientVisit);

export { clientsRouter };
