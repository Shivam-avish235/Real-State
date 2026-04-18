import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reportsApi } from "@/features/reports/api/reports.api";

const downloadCsv = (content: string, fileName: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const ReportsPage = () => {
  const { data: summary } = useQuery({ queryKey: ["report-summary"], queryFn: reportsApi.getSummary });
  const { data: revenueTrend } = useQuery({ queryKey: ["report-revenue"], queryFn: reportsApi.getRevenueTrend });
  const { data: agentPerformance } = useQuery({ queryKey: ["report-agent-performance"], queryFn: reportsApi.getAgentPerformance });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Reports & Analytics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Total Leads</p>
            <p className="text-2xl font-semibold">{summary?.totalLeads ?? 0}</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Clients</p>
            <p className="text-2xl font-semibold">{summary?.totalClients ?? 0}</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-2xl font-semibold">{summary?.revenue?.toLocaleString?.() ?? 0}</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Conversion %</p>
            <p className="text-2xl font-semibold">{summary?.conversionRate ?? 0}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueTrend ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="hsl(200 87% 37%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="commission" fill="hsl(28 88% 60%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agent Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {agentPerformance?.map((agent) => (
            <div key={agent.agentId} className="rounded-lg border bg-muted/40 p-3">
              <p className="font-medium">{agent.agentName}</p>
              <p className="text-xs text-muted-foreground">Won deals: {agent.wonDeals}</p>
              <p className="text-xs text-muted-foreground">Conversion: {agent.leadConversionRate}%</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Export</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              const csv = await reportsApi.exportCsv("SALES");
              downloadCsv(csv, "sales-report.csv");
            }}
          >
            Export Sales CSV
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              const csv = await reportsApi.exportCsv("LEAD_CONVERSION");
              downloadCsv(csv, "lead-conversion-report.csv");
            }}
          >
            Export Lead Conversion CSV
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              const csv = await reportsApi.exportCsv("AGENT_PERFORMANCE");
              downloadCsv(csv, "agent-performance-report.csv");
            }}
          >
            Export Agent Performance CSV
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              const csv = await reportsApi.exportCsv("REVENUE");
              downloadCsv(csv, "revenue-report.csv");
            }}
          >
            Export Revenue CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
