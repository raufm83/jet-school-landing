"use client";
import { create } from "zustand";

type SchemaNode = Record<string, unknown>;

type State = {
  orgNode: SchemaNode | null;
  websiteNode: SchemaNode | null;
  breadcrumbNode: SchemaNode | null;
  setOrgNode: (node: SchemaNode | null) => void;
  setWebsiteNode: (node: SchemaNode | null) => void;
  setBreadcrumbNode: (node: SchemaNode | null) => void;
  clear: () => void;
};

export const useSchemaStore = create<State>((set) => ({
  orgNode: null,
  websiteNode: null,
  breadcrumbNode: null,
  setOrgNode: (node) => set({ orgNode: node }),
  setWebsiteNode: (node) => set({ websiteNode: node }),
  setBreadcrumbNode: (node) => set({ breadcrumbNode: node }),
  clear: () => set({ orgNode: null, websiteNode: null, breadcrumbNode: null }),
}));
