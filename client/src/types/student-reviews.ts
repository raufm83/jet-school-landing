export interface ReviewFormInputs {
  title: { az: string; ru: string };
  description: { az: string; ru: string };
  courseId: string;
  link: string;
}

export interface StudentReview {
  id: string;
  title: { az: string; ru: string } | null;
  description: { az: string; ru: string } | null;
  courseId: string;
  course: {
    id: string;
    title: { az: string; ru: string };
  } | null;
  link: string | null;
  imageUrl: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewResponse {
  items: StudentReview[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
  };
}
