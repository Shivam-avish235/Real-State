import { apiClient } from "@/lib/http";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type DealStage = "INQUIRY" | "NEGOTIATION" | "AGREEMENT" | "CLOSED" | "LOST";

export type DealCard = {
  id: string;
  title: string;
  stage: DealStage;
  status: "OPEN" | "WON" | "LOST" | "CANCELLED";
  dealValue: number;
  currency: string;
  client?: {
    id: string;
    firstName: string;
    lastName?: string | null;
  };
};

export type DealPipelineColumn = {
  stage: DealStage;
  count: number;
  totalValue: number;
  items: DealCard[];
};

export const dealsApi = {
  async getPipeline() {
    const response = await apiClient.get<ApiSuccess<DealPipelineColumn[]>>("/deals/pipeline");
    return response.data.data;
  },

  async moveStage(id: string, toStage: DealStage) {
    const response = await apiClient.post<ApiSuccess<unknown>>(`/deals/${id}/stage`, { toStage });
    return response.data.data;
  },

  async create(payload: {
    title: string;
    clientId: string;
    dealValue: number;
    stage?: DealStage;
  }) {
    const response = await apiClient.post<ApiSuccess<DealCard>>("/deals", payload);
    return response.data.data;
  }
};
