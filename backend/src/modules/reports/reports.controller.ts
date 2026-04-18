import type { Request, Response } from "express";

import { asyncHandler } from "../../common/middleware/async-handler";
import { createSuccessResponse } from "../../common/utils/api-response";

import { ReportsService } from "./reports.service";
import type { ExportReportQueryInput, ReportRangeQueryInput } from "./reports.validation";

export const getDashboardSummary = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ReportRangeQueryInput;
  const data = await ReportsService.getDashboardSummary(query, req.user!);

  res.status(200).json(createSuccessResponse("Dashboard summary fetched", data));
});

export const getSalesReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ReportRangeQueryInput;
  const data = await ReportsService.getSalesReport(query, req.user!);

  res.status(200).json(createSuccessResponse("Sales report fetched", data));
});

export const getLeadConversionReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ReportRangeQueryInput;
  const data = await ReportsService.getLeadConversion(query, req.user!);

  res.status(200).json(createSuccessResponse("Lead conversion report fetched", data));
});

export const getAgentPerformanceReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ReportRangeQueryInput;
  const data = await ReportsService.getAgentPerformance(query, req.user!);

  res.status(200).json(createSuccessResponse("Agent performance report fetched", data));
});

export const getRevenueTrendReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ReportRangeQueryInput;
  const data = await ReportsService.getRevenueTrend(query, req.user!);

  res.status(200).json(createSuccessResponse("Revenue trend report fetched", data));
});

export const exportCsvReport = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ExportReportQueryInput;
  const csv = await ReportsService.exportCsv(query, req.user!);

  const filename = `${query.type.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
  res.status(200).send(csv);
});
