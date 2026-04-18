import { apiClient } from "@/lib/http";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type TimelineItem = {
  id: string;
  type: string;
  direction: string;
  subject?: string | null;
  description?: string | null;
  performedAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
};

export type ReminderItem = {
  id: string;
  title: string;
  description?: string | null;
  dueAt: string;
  status: "PENDING" | "SENT" | "COMPLETED" | "CANCELLED";
};

export const communicationsApi = {
  async listTimeline() {
    const response = await apiClient.get<ApiSuccess<{ items: TimelineItem[] }>>("/communications/timeline");
    return response.data.data.items;
  },

  async createActivity(payload: {
    type: "CALL" | "SMS" | "EMAIL" | "NOTE" | "MEETING" | "SITE_VISIT" | "TASK" | "STATUS_CHANGE" | "SYSTEM";
    subject?: string;
    description?: string;
    clientId?: string;
    leadId?: string;
    dealId?: string;
  }) {
    const response = await apiClient.post<ApiSuccess<TimelineItem>>("/communications/timeline", payload);
    return response.data.data;
  },

  async listReminders() {
    const response = await apiClient.get<ApiSuccess<{ items: ReminderItem[] }>>("/communications/reminders");
    return response.data.data.items;
  },

  async scheduleReminder(payload: {
    title: string;
    dueAt: string;
    description?: string;
    assignedToId?: string;
    clientId?: string;
    leadId?: string;
    dealId?: string;
  }) {
    const response = await apiClient.post<ApiSuccess<ReminderItem>>("/communications/reminders", payload);
    return response.data.data;
  },

  async completeReminder(id: string) {
    const response = await apiClient.post<ApiSuccess<ReminderItem>>(`/communications/reminders/${id}/complete`, {});
    return response.data.data;
  }
};
