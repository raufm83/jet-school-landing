"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import GlossaryCategoryDropdown from "./glossary-category-dropdown";

interface Category {
  _id: string;
  name: Record<string, string>;
  slug: string;
}

interface GlossarySearchFilterProps {
  language: string;
  categories: Category[];
  searchPlaceholder: string;
  allCategoriesText: string;
  initialSearch?: string;
  initialCategory?: string;
}

export default function GlossarySearchFilter({
  language,
  categories,
  searchPlaceholder,
  allCategoriesText,
  initialSearch = "",
  initialCategory = "",
}: GlossarySearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateQueryParams = (search: string, category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    
    params.delete("page"); // Reset page on filter change
    
    router.push(`/glossary/terms?${params.toString()}`);
  };

  const debouncedUpdate = (search: string, category: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      updateQueryParams(search, category);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);



  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedUpdate(value, selectedCategory);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateQueryParams(searchQuery, selectedCategory);
  };

  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory);
    updateQueryParams(searchQuery, newCategory);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-10 flex flex-col md:flex-row gap-4">
      <form onSubmit={handleSubmit} className="relative flex-1">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
          className="w-full px-6 py-3.5 pr-12 bg-white border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-jsyellow/50 transition-all text-sm sm:text-base"
        />
        <button
          type="submit"
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-jsblack"
        >
          <FiSearch size={20} />
        </button>
      </form>
      
      <div className="w-full md:w-64">
        <GlossaryCategoryDropdown
          value={selectedCategory}
          onChange={handleCategoryChange}
          ariaLabel={allCategoriesText}
          options={[
            { value: "", label: allCategoriesText },
            ...categories.map((cat) => ({
              value: (cat as any).id || cat._id,
              label: cat.name?.[language] || cat.name?.az || cat.slug,
            })),
          ]}
        />
      </div>
    </div>
  );
}
