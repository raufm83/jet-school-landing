export interface BlogCategory {
  id: string;
  name: {
    az: string;
    ru: string;
  };
  _count?: {
    posts: number;
  };
}

export interface BlogCategoriesResponse {
  items: BlogCategory[];
}
