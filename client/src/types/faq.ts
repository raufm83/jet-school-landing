export interface FaqItem {
  id: string;
  question: { az: string; ru: string };
  answer: { az: string; ru: string };
  order: number;
  page?: string;
  pages?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FaqListResponse {
  items: FaqItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FaqFormPayload {
  question: { az: string; ru: string };
  answer: { az: string; ru: string };
  order: number;
}
