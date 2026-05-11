"use client";
import { create } from "zustand";
import { PostType } from "@/types/enums";

type State = {
  title: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  postType: PostType | null;
  setTitle: (t: string | null) => void;
  setCategoryName: (name: string | null) => void;
  setCategorySlug: (slug: string | null) => void;
  setPostType: (type: PostType | null) => void;
  clear: () => void;
};

export const useBreadcrumbStore = create<State>((set) => ({
  title: null,
  categoryName: null,
  categorySlug: null,
  postType: null,
  setTitle: (t) => set({ title: t }),
  setCategoryName: (name) => set({ categoryName: name }),
  setCategorySlug: (slug) => set({ categorySlug: slug }),
  setPostType: (type) => set({ postType: type }),
  clear: () => set({ title: null, categoryName: null, categorySlug: null, postType: null }),
}));
