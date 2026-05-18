import { EventStatus, PostType } from "./enums";

interface MultilingualText {
  az: string;
  ru: string;
}

export interface Post {
  id: string;
  title: MultilingualText;
  content: MultilingualText;
  slug: MultilingualText;
  published: boolean;
  /** Hero/cover image per locale — { az?: string, ru?: string } or legacy single string */
  imageUrl?: string | MultilingualText;
  imageAlt?: MultilingualText;
  /** Tags per locale; legacy posts may have flat string[] */
  tags: string[] | { az: string[]; ru: string[] };
  postType: PostType;
  eventDate?: Date | string;
  eventStatus?: EventStatus;
  authorId: string;
  /** Yalnız postType === BLOG üçün; əks halda backend null qaytarır */
  blogCategory?: { id: string; name: { az: string; ru: string } } | null;
  author: {
    id: string;
    name: string;
    /** Müəllif üçün dillər üzrə ad (və ya köhnə formatda tək string) */
    firstName?: string | { az?: string; ru?: string } | null;
    lastName?: string | { az?: string; ru?: string } | null;
    role?: string;
    profile?: {
      avatarUrl?: string | null;
      /** İxtisas: string (köhnə) və ya { az?, ru? } */
      profession?: string | { az?: string; ru?: string } | null;
    } | null;
  };
  createdAt: string;
  updatedAt: string;
  offerStartDate?: Date | string;
  offerEndDate?: Date | string;
}

export interface PostFormInputs {
  title: MultilingualText;
  content: MultilingualText;
  slug: MultilingualText;
  published: boolean;
  /** Hero image per locale */
  imageUrl?: { az?: string; ru?: string };
  /** Image alt text per locale (SEO) */
  imageAlt?: { az?: string; ru?: string };
  imageAz?: FileList | File;
  imageRu?: FileList | File;
  /** Legacy single image (kept for form compatibility) */
  image?: FileList | File;
  tags: { az: string[]; ru: string[] };
  /** Bloq üçün kateqoriya ObjectId; boş saxlamaq olar */
  blogCategoryId?: string;
  postType: PostType;
  eventDate?: string;
  eventStatus?: EventStatus;
  offerStartDate?: string;
  offerEndDate?: string;
}

export interface PostsResponse {
  items: Post[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
