import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { leadsApi, type LeadSource, type LeadStatus } from "@/features/leads/api/leads.api";

export const LeadsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    source: "MANUAL" as LeadSource
  });

  const { data, isLoading } = useQuery({
    queryKey: ["leads", search],
    queryFn: () => leadsApi.list({ search })
  });

  const createLeadMutation = useMutation({
    mutationFn: leadsApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
      setForm({ firstName: "", lastName: "", email: "", phone: "", source: "MANUAL" });
    }
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) => leadsApi.update(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
    }
  });

  const convertLeadMutation = useMutation({
    mutationFn: (id: string) => leadsApi.convert(id, { clientType: "BUYER" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Lead Intake</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <div className="md:col-span-2">
              <Label htmlFor="lead-first-name">First name</Label>
              <Input
                id="lead-first-name"
                value={form.firstName}
                onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="lead-last-name">Last name</Label>
              <Input
                id="lead-last-name"
                value={form.lastName}
                onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="lead-email">Email</Label>
              <Input
                id="lead-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="lead-phone">Phone</Label>
              <Input
                id="lead-phone"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="lead-source">Source</Label>
              <select
                id="lead-source"
                className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                value={form.source}
                onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value as LeadSource }))}
              >
                <option value="MANUAL">Manual</option>
                <option value="WEBSITE">Website</option>
                <option value="PORTAL">Portal</option>
                <option value="REFERRAL">Referral</option>
                <option value="SOCIAL_MEDIA">Social Media</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="API">API</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <Button
            onClick={() =>
              createLeadMutation.mutate({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim() || undefined,
                email: form.email.trim() || undefined,
                phone: form.phone.trim(),
                source: form.source
              })
            }
            disabled={!form.firstName.trim() || !form.phone.trim() || createLeadMutation.isPending}
          >
            {createLeadMutation.isPending ? "Saving..." : "Add Lead"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Lead Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Search leads" value={search} onChange={(event) => setSearch(event.target.value)} />

          {isLoading ? <p className="text-sm text-muted-foreground">Loading leads...</p> : null}

          <div className="grid gap-3 md:grid-cols-2">
            {data?.items?.map((lead) => {
              const canConvert = lead.status !== "CLOSED" && lead.status !== "LOST";

              return (
                <div key={lead.id} className="rounded-lg border bg-card/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {lead.firstName} {lead.lastName ?? ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lead.source} | score {lead.score}
                      </p>
                    </div>
                    <span className="rounded-full border px-2 py-0.5 text-xs font-medium">{lead.status}</span>
                  </div>

                  <p className="mt-2 text-sm">{lead.phone}</p>
                  <p className="text-sm text-muted-foreground">{lead.email ?? "No email"}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateLeadMutation.mutate({ id: lead.id, status: "CONTACTED" })}
                      disabled={lead.status !== "NEW" || updateLeadMutation.isPending}
                    >
                      Mark Contacted
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => convertLeadMutation.mutate(lead.id)}
                      disabled={!canConvert || convertLeadMutation.isPending}
                    >
                      Convert to Client
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
