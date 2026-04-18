import { Router } from "express";

import { authGuard } from "../../common/middleware/auth-guard";
import { validateRequest } from "../../common/middleware/validate-request";

import {
    exportCsvReport,
    getAgentPerformanceReport,
    getDashboardSummary,
    getLeadConversionReport,
    getRevenueTrendReport,
    getSalesReport
} from "./reports.controller";
import { exportReportQuerySchema, reportRangeQuerySchema } from "./reports.validation";

const reportsRouter = Router();

reportsRouter.use(authGuard);

reportsRouter.get("/dashboard-summary", validateRequest({ query: reportRangeQuerySchema }), getDashboardSummary);
reportsRouter.get("/sales", validateRequest({ query: reportRangeQuerySchema }), getSalesReport);
reportsRouter.get("/lead-conversion", validateRequest({ query: reportRangeQuerySchema }), getLeadConversionReport);
reportsRouter.get("/agent-performance", validateRequest({ query: reportRangeQuerySchema }), getAgentPerformanceReport);
reportsRouter.get("/revenue-trend", validateRequest({ query: reportRangeQuerySchema }), getRevenueTrendReport);
reportsRouter.get("/export/csv", validateRequest({ query: exportReportQuerySchema }), exportCsvReport);

export { reportsRouter };
