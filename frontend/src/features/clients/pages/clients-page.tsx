import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientsApi } from "@/features/clients/api/clients.api";

export const ClientsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    type: "BUYER" as "BUYER" | "SELLER" | "BOTH",
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });

  const { data, isLoading } = useQuery({
    queryKey: ["clients", search],
    queryFn: () => clientsApi.list({ search })
  });

  const createClientMutation = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      setForm({ type: "BUYER", firstName: "", lastName: "", email: "", phone: "" });
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Client Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <div className="md:col-span-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
          </div>

          <Button
            onClick={() =>
              createClientMutation.mutate({
                ...form,
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim() || undefined,
                email: form.email.trim() || undefined,
                phone: form.phone.trim()
              })
            }
            disabled={!form.firstName.trim() || !form.phone.trim() || createClientMutation.isPending}
          >
            {createClientMutation.isPending ? "Saving..." : "Add Client"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Client Directory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Search clients" value={search} onChange={(event) => setSearch(event.target.value)} />

          {isLoading ? <p className="text-sm text-muted-foreground">Loading clients...</p> : null}

          <div className="grid gap-3 md:grid-cols-2">
            {data?.items?.map((client) => (
              <div key={client.id} className="rounded-lg border bg-card/70 p-4">
                <p className="font-semibold">
                  {client.firstName} {client.lastName ?? ""}
                </p>
                <p className="text-sm text-muted-foreground">{client.type}</p>
                <p className="text-sm">{client.phone}</p>
                <p className="text-sm text-muted-foreground">{client.email ?? "No email"}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
