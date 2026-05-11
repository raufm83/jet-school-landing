export interface GalleryFormInputs {
  title?: {
    az: string;
    ru: string;
  };
  imageAlt?: {
    az: string;
    ru: string;
  };
  image?: FileList;
}

export interface GalleryImage {
  id: string;
  title?: { az: string; ru: string } | null;
  imageAlt?: { az: string; ru: string } | null;
  imageUrl: string;
  order?: number;
  createdAt: string;
}

export interface GalleryResponse {
  items: GalleryImage[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}
