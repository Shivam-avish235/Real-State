import { Router } from "express";

import { authGuard } from "../../common/middleware/auth-guard";
import { requireRole } from "../../common/middleware/require-role";
import { validateRequest } from "../../common/middleware/validate-request";

import {
    assignLead,
    convertLeadToClient,
    createLead,
    deleteLead,
    getLeadById,
    listLeads,
    updateLead
} from "./leads.controller";
import {
    assignLeadSchema,
    convertLeadSchema,
    createLeadSchema,
    leadIdParamSchema,
    listLeadsQuerySchema,
    updateLeadSchema
} from "./leads.validation";

const leadsRouter = Router();

leadsRouter.use(authGuard);

leadsRouter.get("/", validateRequest({ query: listLeadsQuerySchema }), listLeads);
leadsRouter.post("/", validateRequest({ body: createLeadSchema }), createLead);
leadsRouter.get("/:id", validateRequest({ params: leadIdParamSchema }), getLeadById);
leadsRouter.patch("/:id", validateRequest({ params: leadIdParamSchema, body: updateLeadSchema }), updateLead);
leadsRouter.delete("/:id", validateRequest({ params: leadIdParamSchema }), deleteLead);
leadsRouter.post(
  "/:id/assign",
  requireRole("ADMIN", "MANAGER"),
  validateRequest({ params: leadIdParamSchema, body: assignLeadSchema }),
  assignLead
);
leadsRouter.post("/:id/convert", validateRequest({ params: leadIdParamSchema, body: convertLeadSchema }), convertLeadToClient);

export { leadsRouter };
