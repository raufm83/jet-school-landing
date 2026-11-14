"use client";

import { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";

interface DropdownOption {
  value: string;
  label: string;
}

interface GlossaryCategoryDropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
}

export default function GlossaryCategoryDropdown({
  value,
  options,
  onChange,
  ariaLabel,
}: GlossaryCategoryDropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = options[selectedIndex] ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  const openList = () => {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const choose = (v: string) => {
    setOpen(false);
    if (v !== value) onChange(v);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return openList();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((i) => (i + step + options.length) % options.length);
      return;
    }
    if (e.key === "Enter" && open && activeIndex >= 0) {
      e.preventDefault();
      choose(options[activeIndex].value);
    }
  };

  return (
    <div ref={rootRef} className="relative w-full" onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openList())}
        className={`flex w-full items-center justify-between gap-3 rounded-full border bg-white px-6 py-3.5 text-left text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-jsyellow/50 sm:text-base ${
          open ? "border-jsyellow ring-2 ring-jsyellow/40" : "border-gray-200"
        }`}
      >
        <span className="truncate text-jsblack">{selected?.label}</span>
        <FiChevronDown
          size={18}
          className={`shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-gray-200 bg-white py-2 shadow-lg md:min-w-full md:w-max md:max-w-[22rem]"
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value || "all"}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => choose(opt.value)}
                className={`flex cursor-pointer items-start justify-between gap-3 px-5 py-2.5 text-sm text-jsblack sm:text-base ${
                  isSelected
                    ? "bg-jsyellow/25 font-semibold"
                    : i === activeIndex
                      ? "bg-jsyellow/10"
                      : ""
                }`}
              >
                <span className="break-words">{opt.label}</span>
                {isSelected && <FiCheck size={18} className="mt-0.5 shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
