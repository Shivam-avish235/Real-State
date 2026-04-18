import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { integrationsApi, type WebhookEventType } from "@/features/integrations/api/integrations.api";

const webhookEventOptions: WebhookEventType[] = [
  "LEAD_CREATED",
  "LEAD_UPDATED",
  "DEAL_STAGE_CHANGED",
  "DEAL_CLOSED",
  "PROPERTY_CREATED",
  "PROPERTY_UPDATED",
  "NOTIFICATION_SENT"
];

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
};

export const IntegrationsPage = () => {
  const queryClient = useQueryClient();
  const [credentialForm, setCredentialForm] = useState({ name: "", scopes: "" });
  const [webhookForm, setWebhookForm] = useState({ name: "", url: "", eventType: "LEAD_CREATED" as WebhookEventType });
  const [latestApiKey, setLatestApiKey] = useState<string | null>(null);
  const [latestWebhookSecret, setLatestWebhookSecret] = useState<string | null>(null);

  const { data: credentials } = useQuery({
    queryKey: ["integrations", "credentials"],
    queryFn: () => integrationsApi.listCredentials()
  });

  const { data: webhooks } = useQuery({
    queryKey: ["integrations", "webhooks"],
    queryFn: () => integrationsApi.listWebhookEndpoints()
  });

  const createCredentialMutation = useMutation({
    mutationFn: integrationsApi.createCredential,
    onSuccess: async (result) => {
      setLatestApiKey(result.apiKey);
      setCredentialForm({ name: "", scopes: "" });
      await queryClient.invalidateQueries({ queryKey: ["integrations", "credentials"] });
    }
  });

  const revokeCredentialMutation = useMutation({
    mutationFn: integrationsApi.revokeCredential,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["integrations", "credentials"] });
    }
  });

  const rotateCredentialMutation = useMutation({
    mutationFn: (id: string) => integrationsApi.rotateCredential(id),
    onSuccess: async (result) => {
      setLatestApiKey(result.apiKey);
      await queryClient.invalidateQueries({ queryKey: ["integrations", "credentials"] });
    }
  });

  const createWebhookMutation = useMutation({
    mutationFn: integrationsApi.createWebhookEndpoint,
    onSuccess: async (result) => {
      setLatestWebhookSecret(result.secret);
      setWebhookForm({ name: "", url: "", eventType: "LEAD_CREATED" });
      await queryClient.invalidateQueries({ queryKey: ["integrations", "webhooks"] });
    }
  });

  const triggerWebhookMutation = useMutation({
    mutationFn: ({ id, eventType }: { id: string; eventType: WebhookEventType }) =>
      integrationsApi.triggerWebhook(id, {
        eventType,
        payload: {
          sample: true,
          triggeredAt: new Date().toISOString()
        }
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["integrations", "webhooks"] });
    }
  });

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">API Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div>
              <Label htmlFor="credential-name">Name</Label>
              <Input
                id="credential-name"
                value={credentialForm.name}
                onChange={(event) => setCredentialForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="credential-scopes">Scopes (comma separated)</Label>
              <Input
                id="credential-scopes"
                value={credentialForm.scopes}
                onChange={(event) => setCredentialForm((prev) => ({ ...prev, scopes: event.target.value }))}
              />
            </div>
            <Button
              onClick={() =>
                createCredentialMutation.mutate({
                  name: credentialForm.name.trim(),
                  scopes: credentialForm.scopes
                    .split(",")
                    .map((scope) => scope.trim())
                    .filter((scope) => scope.length > 0)
                })
              }
              disabled={!credentialForm.name.trim() || createCredentialMutation.isPending}
            >
              {createCredentialMutation.isPending ? "Saving..." : "Create API Credential"}
            </Button>
          </div>

          {latestApiKey ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              New API Key: {latestApiKey}
            </div>
          ) : null}

          <div className="space-y-2">
            {credentials?.items.map((credential) => (
              <div key={credential.id} className="rounded-lg border bg-muted/30 p-3">
                <p className="font-medium">{credential.name}</p>
                <p className="text-xs text-muted-foreground">Status: {credential.isActive ? "ACTIVE" : "INACTIVE"}</p>
                <p className="text-xs text-muted-foreground">Scopes: {toStringArray(credential.scopes).join(", ") || "none"}</p>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!credential.isActive || revokeCredentialMutation.isPending}
                    onClick={() => revokeCredentialMutation.mutate(credential.id)}
                  >
                    Revoke
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={rotateCredentialMutation.isPending}
                    onClick={() => rotateCredentialMutation.mutate(credential.id)}
                  >
                    Rotate Key
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Webhook Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div>
              <Label htmlFor="webhook-name">Name</Label>
              <Input
                id="webhook-name"
                value={webhookForm.name}
                onChange={(event) => setWebhookForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="webhook-url">URL</Label>
              <Input
                id="webhook-url"
                value={webhookForm.url}
                onChange={(event) => setWebhookForm((prev) => ({ ...prev, url: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="webhook-event">Primary event</Label>
              <select
                id="webhook-event"
                className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                value={webhookForm.eventType}
                onChange={(event) => setWebhookForm((prev) => ({ ...prev, eventType: event.target.value as WebhookEventType }))}
              >
                {webhookEventOptions.map((eventType) => (
                  <option key={eventType} value={eventType}>
                    {eventType}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={() =>
                createWebhookMutation.mutate({
                  name: webhookForm.name.trim(),
                  url: webhookForm.url.trim(),
                  events: [webhookForm.eventType]
                })
              }
              disabled={!webhookForm.name.trim() || !webhookForm.url.trim() || createWebhookMutation.isPending}
            >
              {createWebhookMutation.isPending ? "Saving..." : "Create Webhook"}
            </Button>
          </div>

          {latestWebhookSecret ? (
            <div className="rounded-md border border-sky-300 bg-sky-50 p-3 text-sm text-sky-900">
              New Webhook Secret: {latestWebhookSecret}
            </div>
          ) : null}

          <div className="space-y-2">
            {webhooks?.items.map((endpoint) => {
              const events = toStringArray(endpoint.events);
              const triggerEvent = webhookEventOptions.find((eventType) => events.includes(eventType)) ?? "LEAD_CREATED";

              return (
                <div key={endpoint.id} className="rounded-lg border bg-muted/30 p-3">
                  <p className="font-medium">{endpoint.name}</p>
                  <p className="text-xs text-muted-foreground">{endpoint.url}</p>
                  <p className="text-xs text-muted-foreground">Events: {events.join(", ") || "none"}</p>
                  <p className="text-xs text-muted-foreground">Failures: {endpoint.failureCount}</p>
                  <Button
                    size="sm"
                    className="mt-2"
                    variant="outline"
                    onClick={() => triggerWebhookMutation.mutate({ id: endpoint.id, eventType: triggerEvent })}
                    disabled={triggerWebhookMutation.isPending}
                  >
                    Send Test Event
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
