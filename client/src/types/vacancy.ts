export interface VacancySlugI18n {
  az: string;
  ru: string;
}

export interface Vacancy {
  id: string;
  title: { az: string; ru: string };
  description: { az: string; ru: string };
  requirements?: { az: string; ru: string };
  /** İş şəraiti — HTML (editor ilə yaradılır) */
  workConditions?: { az: string; ru: string };
  /** @deprecated — yeni kartlarda istifadə olunmur */
  tags?: { az: string[]; ru: string[] };
  slug: VacancySlugI18n;
  deadline?: string | null;
  employmentType?: string | null;
  experienceLevel?: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface VacancyListResponse {
  items: Vacancy[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface VacancyFormPayload {
  title: { az: string; ru: string };
  description: { az: string; ru: string };
  requirements: { az: string; ru: string };
  /** İş şəraiti — rich HTML (editor ilə yaradılır) */
  workConditions: { az: string; ru: string };
  /** YYYY-MM-DD və ya boş */
  deadline: string;
  employmentType: string;
  experienceLevel: string;
  slug: { az: string; ru: string };
  isActive: boolean;
  order: number;
  tags?: { az: string[]; ru: string[] };
}
