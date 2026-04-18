import { apiClient } from "@/lib/http";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type DashboardSummary = {
  totalLeads: number;
  closedLeads: number;
  conversionRate: number;
  totalClients: number;
  wonDeals: number;
  openDeals: number;
  revenue: number;
  commission: number;
};

export type RevenueTrendPoint = {
  label: string;
  revenue: number;
  commission: number;
  count: number;
};

export type AgentPerformance = {
  agentId: string;
  agentName: string;
  email: string;
  wonDeals: number;
  dealValue: number;
  commission: number;
  totalLeads: number;
  closedLeads: number;
  leadConversionRate: number;
};

export const reportsApi = {
  async getSummary() {
    const response = await apiClient.get<ApiSuccess<DashboardSummary>>("/reports/dashboard-summary");
    return response.data.data;
  },

  async getRevenueTrend() {
    const response = await apiClient.get<ApiSuccess<RevenueTrendPoint[]>>("/reports/revenue-trend");
    return response.data.data;
  },

  async getAgentPerformance() {
    const response = await apiClient.get<ApiSuccess<AgentPerformance[]>>("/reports/agent-performance");
    return response.data.data;
  },

  async exportCsv(type: "SALES" | "LEAD_CONVERSION" | "AGENT_PERFORMANCE" | "REVENUE") {
    const response = await apiClient.get<string>("/reports/export/csv", {
      params: { type },
      responseType: "text"
    });

    return response.data;
  }
};
