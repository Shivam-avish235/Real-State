import { ReportType } from "@prisma/client";
import { z } from "zod";

export const reportRangeQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
});

export const exportReportQuerySchema = z.object({
  type: z.nativeEnum(ReportType),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
});

export type ReportRangeQueryInput = z.infer<typeof reportRangeQuerySchema>;
export type ExportReportQueryInput = z.infer<typeof exportReportQuerySchema>;
