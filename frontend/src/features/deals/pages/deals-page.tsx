import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientsApi } from "@/features/clients/api/clients.api";
import { dealsApi, type DealStage } from "@/features/deals/api/deals.api";
import { DealKanbanBoard } from "@/features/deals/components/deal-kanban-board";

export const DealsPage = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: "", clientId: "", dealValue: "" });

  const { data: pipeline, isLoading } = useQuery({
    queryKey: ["deal-pipeline"],
    queryFn: dealsApi.getPipeline
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => clientsApi.list({ limit: 100 })
  });

  const createDealMutation = useMutation({
    mutationFn: dealsApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["deal-pipeline"] });
      setForm({ title: "", clientId: "", dealValue: "" });
    }
  });

  const moveStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: DealStage }) => dealsApi.moveStage(id, stage),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["deal-pipeline"] });
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Deal Pipeline Management</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <Label htmlFor="deal-title">Title</Label>
            <Input id="deal-title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
          </div>
          <div>
            <Label htmlFor="deal-client">Client</Label>
            <select
              id="deal-client"
              className="h-10 w-full rounded-md border bg-card px-3 text-sm"
              value={form.clientId}
              onChange={(event) => setForm((prev) => ({ ...prev, clientId: event.target.value }))}
            >
              <option value="">Select client</option>
              {clients?.items.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName ?? ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="deal-value">Deal Value</Label>
            <Input
              id="deal-value"
              type="number"
              value={form.dealValue}
              onChange={(event) => setForm((prev) => ({ ...prev, dealValue: event.target.value }))}
            />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              onClick={() =>
                createDealMutation.mutate({
                  title: form.title,
                  clientId: form.clientId,
                  dealValue: Number(form.dealValue),
                  stage: "INQUIRY"
                })
              }
              disabled={!form.title || !form.clientId || !form.dealValue || createDealMutation.isPending}
            >
              {createDealMutation.isPending ? "Creating..." : "Create Deal"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading deal pipeline...</p> : null}

      {pipeline ? (
        <DealKanbanBoard
          columns={pipeline}
          onMoveDeal={(dealId, stage) => {
            void moveStageMutation.mutate({ id: dealId, stage });
          }}
        />
      ) : null}
    </div>
  );
};
