import { Router } from "express";

import { authGuard } from "../../common/middleware/auth-guard";
import { validateRequest } from "../../common/middleware/validate-request";

import {
    addDealDocument,
    createDeal,
    deleteDeal,
    getDealById,
    getDealPipeline,
    listDealDocuments,
    listDeals,
    moveDealStage,
    updateDeal
} from "./deals.controller";
import {
    addDealDocumentSchema,
    createDealSchema,
    dealIdParamSchema,
    listDealsQuerySchema,
    moveDealStageSchema,
    updateDealSchema
} from "./deals.validation";

const dealsRouter = Router();

dealsRouter.use(authGuard);

dealsRouter.get("/", validateRequest({ query: listDealsQuerySchema }), listDeals);
dealsRouter.get("/pipeline", getDealPipeline);
dealsRouter.post("/", validateRequest({ body: createDealSchema }), createDeal);
dealsRouter.get("/:id", validateRequest({ params: dealIdParamSchema }), getDealById);
dealsRouter.patch("/:id", validateRequest({ params: dealIdParamSchema, body: updateDealSchema }), updateDeal);
dealsRouter.delete("/:id", validateRequest({ params: dealIdParamSchema }), deleteDeal);
dealsRouter.post("/:id/stage", validateRequest({ params: dealIdParamSchema, body: moveDealStageSchema }), moveDealStage);
dealsRouter.get("/:id/documents", validateRequest({ params: dealIdParamSchema }), listDealDocuments);
dealsRouter.post("/:id/documents", validateRequest({ params: dealIdParamSchema, body: addDealDocumentSchema }), addDealDocument);

export { dealsRouter };
