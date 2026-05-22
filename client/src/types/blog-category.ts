export interface BlogCategory {
  id: string;
  name: {
    az: string;
    ru: string;
  };
  order?: number;
  _count?: {
    posts: number;
  };
}

export interface BlogCategoriesResponse {
  items: BlogCategory[];
}

export type BlogCategoryListResponse = BlogCategoriesResponse;
