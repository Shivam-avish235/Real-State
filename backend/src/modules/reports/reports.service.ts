import { ReportType, type Prisma, type UserRole } from "@prisma/client";

import { prisma } from "../../config/prisma";

import type { ExportReportQueryInput, ReportRangeQueryInput } from "./reports.validation";

type UserContext = {
  userId: string;
  role: UserRole;
};

type DateRange = {
  startDate?: Date;
  endDate?: Date;
};

const buildDateFilter = (field: "createdAt" | "closeDate", range: DateRange): Prisma.DealWhereInput => {
  if (!range.startDate && !range.endDate) {
    return {};
  }

  return {
    [field]: {
      gte: range.startDate,
      lte: range.endDate
    }
  } as Prisma.DealWhereInput;
};

const buildLeadDateFilter = (range: DateRange): Prisma.LeadWhereInput => {
  if (!range.startDate && !range.endDate) {
    return {};
  }

  return {
    createdAt: {
      gte: range.startDate,
      lte: range.endDate
    }
  };
};

const buildDealScopeFilter = (context: UserContext): Prisma.DealWhereInput => {
  if (context.role === "AGENT") {
    return {
      ownerId: context.userId
    };
  }

  return {};
};

const buildLeadScopeFilter = (context: UserContext): Prisma.LeadWhereInput => {
  if (context.role === "AGENT") {
    return {
      assignedToId: context.userId
    };
  }

  return {};
};

const toCsv = (rows: Record<string, unknown>[]): string => {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    if (value === null || value === undefined) {
      return "";
    }

    const str = String(value);

    if (str.includes(",") || str.includes("\n") || str.includes("\"")) {
      return `"${str.replace(/\"/g, '""')}"`;
    }

    return str;
  };

  const body = rows.map((row) => headers.map((header) => escape(row[header])).join(",")).join("\n");

  return `${headers.join(",")}\n${body}`;
};

export class ReportsService {
  static async getDashboardSummary(range: ReportRangeQueryInput, context: UserContext) {
    const dealScope = buildDealScopeFilter(context);
    const leadScope = buildLeadScopeFilter(context);

    const wonDealsWhere: Prisma.DealWhereInput = {
      AND: [dealScope, { OR: [{ status: "WON" }, { stage: "CLOSED" }] }, buildDateFilter("closeDate", range)].filter(Boolean) as Prisma.DealWhereInput[]
    };

    const openDealsWhere: Prisma.DealWhereInput = {
      AND: [dealScope, { status: "OPEN" }, buildDateFilter("createdAt", range)].filter(Boolean) as Prisma.DealWhereInput[]
    };

    const leadWhere: Prisma.LeadWhereInput = {
      AND: [leadScope, buildLeadDateFilter(range)].filter(Boolean) as Prisma.LeadWhereInput[]
    };

    const [totalLeads, closedLeads, totalClients, wonDeals, openDeals, revenueAgg] = await prisma.$transaction([
      prisma.lead.count({ where: leadWhere }),
      prisma.lead.count({ where: { AND: [leadWhere, { status: "CLOSED" }] } }),
      prisma.client.count({ where: context.role === "AGENT" ? { ownerAgentId: context.userId } : {} }),
      prisma.deal.count({ where: wonDealsWhere }),
      prisma.deal.count({ where: openDealsWhere }),
      prisma.deal.aggregate({
        where: wonDealsWhere,
        _sum: {
          dealValue: true,
          commissionAmount: true
        }
      })
    ]);

    const conversionRate = totalLeads > 0 ? Number(((closedLeads / totalLeads) * 100).toFixed(2)) : 0;

    return {
      totalLeads,
      closedLeads,
      conversionRate,
      totalClients,
      wonDeals,
      openDeals,
      revenue: Number(revenueAgg._sum.dealValue ?? 0),
      commission: Number(revenueAgg._sum.commissionAmount ?? 0)
    };
  }

  static async getSalesReport(range: ReportRangeQueryInput, context: UserContext) {
    const where: Prisma.DealWhereInput = {
      AND: [
        buildDealScopeFilter(context),
        { OR: [{ status: "WON" }, { stage: "CLOSED" }] },
        buildDateFilter("closeDate", range)
      ].filter(Boolean) as Prisma.DealWhereInput[]
    };

    const deals = await prisma.deal.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true
          }
        }
      },
      orderBy: {
        closeDate: "desc"
      }
    });

    const totals = deals.reduce(
      (acc, deal) => {
        acc.dealValue += Number(deal.dealValue);
        acc.commission += Number(deal.commissionAmount ?? 0);
        return acc;
      },
      { dealValue: 0, commission: 0 }
    );

    return {
      totals,
      deals
    };
  }

  static async getLeadConversion(range: ReportRangeQueryInput, context: UserContext) {
    const where: Prisma.LeadWhereInput = {
      AND: [buildLeadScopeFilter(context), buildLeadDateFilter(range)].filter(Boolean) as Prisma.LeadWhereInput[]
    };

    const leads = await prisma.lead.findMany({
      where,
      select: {
        id: true,
        status: true,
        source: true,
        createdAt: true
      }
    });

    const total = leads.length;
    const closed = leads.filter((lead) => lead.status === "CLOSED").length;

    const bySource = leads.reduce<Record<string, { total: number; closed: number }>>((acc, lead) => {
      const source = lead.source;
      const current = acc[source] ?? { total: 0, closed: 0 };
      current.total += 1;
      if (lead.status === "CLOSED") {
        current.closed += 1;
      }
      acc[source] = current;
      return acc;
    }, {});

    return {
      total,
      closed,
      conversionRate: total > 0 ? Number(((closed / total) * 100).toFixed(2)) : 0,
      bySource
    };
  }

  static async getAgentPerformance(range: ReportRangeQueryInput, context: UserContext) {
    const dealWhere: Prisma.DealWhereInput = {
      AND: [buildDealScopeFilter(context), buildDateFilter("closeDate", range), { OR: [{ status: "WON" }, { stage: "CLOSED" }] }].filter(Boolean) as Prisma.DealWhereInput[]
    };

    const leadWhere: Prisma.LeadWhereInput = {
      AND: [buildLeadScopeFilter(context), buildLeadDateFilter(range)].filter(Boolean) as Prisma.LeadWhereInput[]
    };

    const [deals, leads] = await prisma.$transaction([
      prisma.deal.findMany({
        where: dealWhere,
        select: {
          ownerId: true,
          dealValue: true,
          commissionAmount: true,
          owner: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      prisma.lead.findMany({
        where: leadWhere,
        select: {
          assignedToId: true,
          status: true
        }
      })
    ]);

    const bucket = new Map<string, {
      agentId: string;
      agentName: string;
      email: string;
      wonDeals: number;
      dealValue: number;
      commission: number;
      totalLeads: number;
      closedLeads: number;
    }>();

    for (const deal of deals) {
      const item = bucket.get(deal.ownerId) ?? {
        agentId: deal.ownerId,
        agentName: `${deal.owner.firstName} ${deal.owner.lastName}`,
        email: deal.owner.email,
        wonDeals: 0,
        dealValue: 0,
        commission: 0,
        totalLeads: 0,
        closedLeads: 0
      };

      item.wonDeals += 1;
      item.dealValue += Number(deal.dealValue);
      item.commission += Number(deal.commissionAmount ?? 0);
      bucket.set(deal.ownerId, item);
    }

    for (const lead of leads) {
      if (!lead.assignedToId) {
        continue;
      }

      const item = bucket.get(lead.assignedToId) ?? {
        agentId: lead.assignedToId,
        agentName: "Unknown Agent",
        email: "",
        wonDeals: 0,
        dealValue: 0,
        commission: 0,
        totalLeads: 0,
        closedLeads: 0
      };

      item.totalLeads += 1;
      if (lead.status === "CLOSED") {
        item.closedLeads += 1;
      }

      bucket.set(lead.assignedToId, item);
    }

    return Array.from(bucket.values()).map((entry) => ({
      ...entry,
      leadConversionRate: entry.totalLeads > 0 ? Number(((entry.closedLeads / entry.totalLeads) * 100).toFixed(2)) : 0
    }));
  }

  static async getRevenueTrend(range: ReportRangeQueryInput, context: UserContext) {
    const where: Prisma.DealWhereInput = {
      AND: [
        buildDealScopeFilter(context),
        { OR: [{ status: "WON" }, { stage: "CLOSED" }] },
        buildDateFilter("closeDate", range)
      ].filter(Boolean) as Prisma.DealWhereInput[]
    };

    const deals = await prisma.deal.findMany({
      where,
      select: {
        closeDate: true,
        dealValue: true,
        commissionAmount: true
      }
    });

    const trend = deals.reduce<Record<string, { label: string; revenue: number; commission: number; count: number }>>((acc, deal) => {
      const date = deal.closeDate ?? new Date();
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      const item = acc[key] ?? { label: key, revenue: 0, commission: 0, count: 0 };

      item.revenue += Number(deal.dealValue);
      item.commission += Number(deal.commissionAmount ?? 0);
      item.count += 1;
      acc[key] = item;

      return acc;
    }, {});

    return Object.values(trend).sort((a, b) => a.label.localeCompare(b.label));
  }

  static async exportCsv(query: ExportReportQueryInput, context: UserContext) {
    const range = {
      startDate: query.startDate,
      endDate: query.endDate
    };

    let rows: Record<string, unknown>[] = [];

    if (query.type === ReportType.SALES) {
      const sales = await this.getSalesReport(range, context);
      rows = sales.deals.map((deal) => ({
        dealId: deal.id,
        title: deal.title,
        stage: deal.stage,
        status: deal.status,
        closeDate: deal.closeDate?.toISOString() ?? "",
        dealValue: Number(deal.dealValue),
        commission: Number(deal.commissionAmount ?? 0),
        owner: `${deal.owner.firstName} ${deal.owner.lastName}`,
        client: `${deal.client.firstName} ${deal.client.lastName ?? ""}`.trim()
      }));
    }

    if (query.type === ReportType.LEAD_CONVERSION) {
      const conversion = await this.getLeadConversion(range, context);
      rows = Object.entries(conversion.bySource).map(([source, values]) => ({
        source,
        totalLeads: values.total,
        closedLeads: values.closed,
        conversionRate: values.total > 0 ? Number(((values.closed / values.total) * 100).toFixed(2)) : 0
      }));
    }

    if (query.type === ReportType.AGENT_PERFORMANCE) {
      const performance = await this.getAgentPerformance(range, context);
      rows = performance.map((item) => ({
        agentId: item.agentId,
        agentName: item.agentName,
        email: item.email,
        wonDeals: item.wonDeals,
        dealValue: item.dealValue,
        commission: item.commission,
        totalLeads: item.totalLeads,
        closedLeads: item.closedLeads,
        leadConversionRate: item.leadConversionRate
      }));
    }

    if (query.type === ReportType.REVENUE) {
      const revenue = await this.getRevenueTrend(range, context);
      rows = revenue.map((item) => ({
        period: item.label,
        dealsClosed: item.count,
        revenue: item.revenue,
        commission: item.commission
      }));
    }

    const csv = toCsv(rows);

    await prisma.reportExport.create({
      data: {
        type: query.type,
        format: "CSV",
        generatedById: context.userId,
        filters: {
          startDate: query.startDate?.toISOString(),
          endDate: query.endDate?.toISOString()
        },
        fileName: `${query.type.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
      }
    });

    return csv;
  }
}
