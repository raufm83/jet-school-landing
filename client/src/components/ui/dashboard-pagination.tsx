"use client";

import { Button, Pagination } from "@nextui-org/react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

export interface DashboardPaginationProps {
  page: number;
  total: number;
  onChange: (page: number) => void;
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  isCompact?: boolean;
  showShadow?: boolean;
  className?: string;
}

/**
 * Admin cədvəlləri üçün: əvvəl/sonra səhifə keçidi aydın ikonlarla (NextUI tək Chevron bəzən zəif görünür).
 */
export default function DashboardPagination({
  page,
  total,
  onChange,
  color = "warning",
  isCompact = true,
  showShadow = true,
  className,
}: DashboardPaginationProps) {
  const safeTotal = Math.max(1, total);
  const canPrev = page > 1;
  const canNext = page < safeTotal;

  return (
    <div
      className={`flex w-full flex-wrap items-center justify-center gap-1 sm:gap-2 ${className ?? ""}`}
    >
      <Button
        isIconOnly
        size={isCompact ? "sm" : "md"}
        variant="flat"
        className="min-h-8 min-w-8 bg-default-100 text-jsblack sm:min-h-9 sm:min-w-9"
        aria-label="Əvvəlki səhifə"
        isDisabled={!canPrev}
        onPress={() => {
          if (canPrev) onChange(page - 1);
        }}
      >
        <MdChevronLeft className="h-5 w-5 shrink-0" aria-hidden />
      </Button>

      <Pagination
        isCompact={isCompact}
        showControls={false}
        showShadow={showShadow}
        color={color}
        page={page}
        total={safeTotal}
        onChange={onChange}
      />

      <Button
        isIconOnly
        size={isCompact ? "sm" : "md"}
        variant="flat"
        className="min-h-8 min-w-8 bg-default-100 text-jsblack sm:min-h-9 sm:min-w-9"
        aria-label="Növbəti səhifə"
        isDisabled={!canNext}
        onPress={() => {
          if (canNext) onChange(page + 1);
        }}
      >
        <MdChevronRight className="h-5 w-5 shrink-0" aria-hidden />
      </Button>
    </div>
  );
}
