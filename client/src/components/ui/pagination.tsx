"use client";

import Link from "next/link";
import { Suspense } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { useSearchParams } from "next/navigation";
import { Locale } from "@/i18n/request";
import { PostType } from "@/types/enums";
import {
  buildPostListingPageUrl,
  getPostListingPaginationTarget,
  type PostListingPaginationTarget,
} from "@/utils/post-listing-pagination";

interface PaginationProps {
  locale: Locale;
  currentPage: number;
  totalPages: number;
  listingType?: PostType;
  paginationBasePath?: string;
  target?: PostListingPaginationTarget;
}

function PaginationInner({
  locale,
  currentPage,
  totalPages,
  listingType,
  paginationBasePath,
  target: targetProp,
}: PaginationProps) {
  const searchParams = useSearchParams();
  const target =
    targetProp ??
    getPostListingPaginationTarget(listingType, paginationBasePath);

  const pageUrl = (page: number) =>
    buildPostListingPageUrl(locale, target, page, searchParams);

  const getPageNumbers = (): (number | string)[] => {
    const delta = 2;
    const range: (number | string)[] = [];

    range.push(1);

    if (totalPages <= 1 + 2 * delta) {
      for (let i = 2; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      for (
        let i = Math.max(2, currentPage - delta);
        i <= Math.min(totalPages - 1, currentPage + delta);
        i++
      ) {
        range.push(i);
      }

      if (typeof range[0] === "number" && range[0] > 2) {
        range.unshift("dots1");
      }
      if (
        typeof range[range.length - 1] === "number" &&
        (range[range.length - 1] as number) < totalPages - 1
      ) {
        range.push("dots2");
      }

      if (range[range.length - 1] !== totalPages) {
        range.push(totalPages);
      }
    }

    return range;
  };

  const pages = getPageNumbers();
  const prevPageUrl = currentPage > 1 ? pageUrl(currentPage - 1) : null;
  const nextPageUrl =
    currentPage < totalPages ? pageUrl(currentPage + 1) : null;

  return (
    <div className="flex items-center justify-center space-x-2">
      {prevPageUrl ? (
        <Link
          href={prevPageUrl}
          className="flex items-center justify-center h-10 w-10 rounded-full border border-jsyellow text-jsblack hover:bg-jsyellow/10 transition-colors"
          aria-label="Previous page"
        >
          <MdChevronLeft className="w-5 h-5" />
        </Link>
      ) : (
        <span className="flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-300 cursor-not-allowed">
          <MdChevronLeft className="w-5 h-5" />
        </span>
      )}

      {pages.map((page, index) => {
        if (page === "dots1" || page === "dots2") {
          return (
            <span
              key={`dots-${index}`}
              className="flex items-center justify-center h-10 w-10 text-gray-600"
            >
              ...
            </span>
          );
        }

        return (
          <Link
            key={`page-${page}`}
            href={pageUrl(page as number)}
            className={`flex items-center justify-center h-10 w-10 rounded-full transition-colors ${
              currentPage === page
                ? "bg-jsyellow text-white"
                : "border border-jsyellow text-jsblack hover:bg-jsyellow/10"
            }`}
          >
            {page}
          </Link>
        );
      })}

      {nextPageUrl ? (
        <Link
          href={nextPageUrl}
          className="flex items-center justify-center h-10 w-10 rounded-full border border-jsyellow text-jsblack hover:bg-jsyellow/10 transition-colors"
          aria-label="Next page"
        >
          <MdChevronRight className="w-5 h-5" />
        </Link>
      ) : (
        <span className="flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 text-gray-300 cursor-not-allowed">
          <MdChevronRight className="w-5 h-5" />
        </span>
      )}
    </div>
  );
}

export default function Pagination(props: PaginationProps) {
  if (props.totalPages <= 1) return null;

  return (
    <Suspense
      fallback={
        <div className="flex h-10 items-center justify-center" aria-hidden />
      }
    >
      <PaginationInner {...props} />
    </Suspense>
  );
}
