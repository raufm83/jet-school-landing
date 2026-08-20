export interface ProjectFormInputs {
  title: { az: string; ru: string };
  description: { az: string; ru: string };
  imageUrl?: string;
  link: string;
  categoryId?: string;
}

export interface Project {
  id: string;
  description: {
    az: string;
    ru: string;
  };
  imageUrl: string;
  link: string;
  author: string;
  title: {
    az: string;
    ru: string;
  };
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name?: string;
    title?: {
      az: string;
      ru: string;
    };
  };
  order: number;
}

export interface ProjectResponse {
  items: Project[];
  total: number;
}
