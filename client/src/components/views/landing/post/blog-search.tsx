"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { FiSearch } from "react-icons/fi";

interface BlogSearchProps {
  placeholderText: string;
  initialQuery?: string;
}

export default function BlogSearch({
  placeholderText,
  initialQuery = "",
}: BlogSearchProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (key !== "q" && key !== "page") params.set(key, value);
    });
    const q = searchQuery.trim();
    if (q) params.set("q", q);

    const qs = params.toString();
    const href = `/${locale}/blog/${qs ? `?${qs}` : ""}`;
    router.push(href);
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholderText}
          className="w-full px-6 py-4 pr-12 bg-white border border-gray-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-jsyellow/50 transition-all"
        />
        <button
          type="submit"
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-jsblack"
          aria-label={placeholderText}
        >
          <FiSearch size={20} />
        </button>
      </form>
    </div>
  );
}
