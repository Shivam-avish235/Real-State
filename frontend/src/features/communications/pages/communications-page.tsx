import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { communicationsApi } from "@/features/communications/api/communications.api";

export const CommunicationsPage = () => {
  const queryClient = useQueryClient();
  const [timelineForm, setTimelineForm] = useState<{ type: "NOTE" | "CALL" | "EMAIL"; subject: string; description: string }>({
    type: "NOTE",
    subject: "",
    description: ""
  });
  const [reminderForm, setReminderForm] = useState({ title: "", dueAt: "", description: "" });

  const { data: timeline } = useQuery({
    queryKey: ["timeline"],
    queryFn: communicationsApi.listTimeline
  });

  const { data: reminders } = useQuery({
    queryKey: ["reminders"],
    queryFn: communicationsApi.listReminders
  });

  const createActivityMutation = useMutation({
    mutationFn: communicationsApi.createActivity,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["timeline"] });
      setTimelineForm({ type: "NOTE", subject: "", description: "" });
    }
  });

  const scheduleReminderMutation = useMutation({
    mutationFn: communicationsApi.scheduleReminder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reminders"] });
      setReminderForm({ title: "", dueAt: "", description: "" });
    }
  });

  const completeReminderMutation = useMutation({
    mutationFn: communicationsApi.completeReminder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reminders"] });
    }
  });

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label htmlFor="activity-type">Type</Label>
              <select
                id="activity-type"
                className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                value={timelineForm.type}
                onChange={(event) => setTimelineForm((prev) => ({ ...prev, type: event.target.value as "NOTE" | "CALL" | "EMAIL" }))}
              >
                <option value="NOTE">Note</option>
                <option value="CALL">Call</option>
                <option value="EMAIL">Email</option>
              </select>
            </div>
            <div>
              <Label htmlFor="activity-subject">Subject</Label>
              <Input
                id="activity-subject"
                value={timelineForm.subject}
                onChange={(event) => setTimelineForm((prev) => ({ ...prev, subject: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="activity-description">Description</Label>
              <Input
                id="activity-description"
                value={timelineForm.description}
                onChange={(event) => setTimelineForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
            <Button
              onClick={() =>
                createActivityMutation.mutate({
                  type: timelineForm.type,
                  subject: timelineForm.subject,
                  description: timelineForm.description
                })
              }
              disabled={createActivityMutation.isPending || !timelineForm.type}
            >
              {createActivityMutation.isPending ? "Saving..." : "Add Activity"}
            </Button>
          </div>

          <div className="space-y-2">
            {timeline?.map((item) => (
              <div key={item.id} className="rounded-lg border bg-muted/40 p-3">
                <p className="font-medium">{item.type}</p>
                <p className="text-sm">{item.subject ?? "No subject"}</p>
                <p className="text-xs text-muted-foreground">{new Date(item.performedAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Follow-up Reminders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div>
              <Label htmlFor="reminder-title">Title</Label>
              <Input
                id="reminder-title"
                value={reminderForm.title}
                onChange={(event) => setReminderForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="reminder-due">Due date</Label>
              <Input
                id="reminder-due"
                type="datetime-local"
                value={reminderForm.dueAt}
                onChange={(event) => setReminderForm((prev) => ({ ...prev, dueAt: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="reminder-description">Description</Label>
              <Input
                id="reminder-description"
                value={reminderForm.description}
                onChange={(event) => setReminderForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
            <Button
              onClick={() =>
                scheduleReminderMutation.mutate({
                  title: reminderForm.title,
                  dueAt: new Date(reminderForm.dueAt).toISOString(),
                  description: reminderForm.description || undefined
                })
              }
              disabled={scheduleReminderMutation.isPending || !reminderForm.title || !reminderForm.dueAt}
            >
              {scheduleReminderMutation.isPending ? "Scheduling..." : "Schedule Reminder"}
            </Button>
          </div>

          <div className="space-y-2">
            {reminders?.map((item) => (
              <div key={item.id} className="rounded-lg border bg-muted/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">Due: {new Date(item.dueAt).toLocaleString()}</p>
                    <p className="text-xs">{item.status}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => completeReminderMutation.mutate(item.id)}
                    disabled={item.status === "COMPLETED" || completeReminderMutation.isPending}
                  >
                    Complete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
