import React, { useEffect, useRef, useState } from "react";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { MdKeyboardArrowDown } from "react-icons/md";
import { useOnClickOutside } from "@/hooks/useClickOutside";

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps {
  options: Option[];
  label?: string;
  description?: string;
  error?: FieldError | string;
  value?: string | number;
  registration?: Partial<UseFormRegisterReturn>;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  className?: string;
  maxHeight?: string;
  maxVisibleOptions?: number;
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      label,
      error,
      value,
      onChange,
      placeholder = "Select an option",
      className = "",
      registration,
      maxVisibleOptions = 6,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<Option | null>(
      options.find((opt) => opt.value === value) || null
    );
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const selectRef = useRef<HTMLDivElement>(null);
    const highlightedOptionRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(selectRef, () => setIsOpen(false));

    const errorMessage = error
      ? typeof error === "string"
        ? error
        : error.message
      : undefined;

    useEffect(() => {
      if (value) {
        const option = options.find((opt) => opt.value === value);
        if (option) setSelectedOption(option);
      }
    }, [value, options]);

    useEffect(() => {
      if (highlightedOptionRef.current && isOpen) {
        highlightedOptionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }, [highlightedIndex, isOpen]);

    const handleSelect = (option: Option) => {
      setSelectedOption(option);
      setIsOpen(false);
      setHighlightedIndex(-1);
      if (onChange) onChange(option.value);
      if (registration?.onChange) {
        const event = {
          target: { value: option.value, name: registration.name },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        registration.onChange(event);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
        return;
      }
      if (!isOpen) return;
      switch (e.key) {
        case "Escape":
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev <= 0 ? options.length - 1 : prev - 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev >= options.length - 1 ? 0 : prev + 1));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (highlightedIndex >= 0) handleSelect(options[highlightedIndex]);
          break;
      }
    };

    const optionHeight = 48;
    const maxDropdownHeight = `${Math.min(maxVisibleOptions, options.length) * optionHeight}px`;

    return (
      <div className="flex flex-col gap-2 w-full" ref={ref}>
        <div className="relative" ref={selectRef}>
          <div
            tabIndex={0}
            role="button"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-labelledby={label}
            className={`
              w-full h-12 px-4 py-3
              bg-[#fef7eb] border border-jsyellow rounded-[32px]
              text-jsblack font-semibold outline-none cursor-pointer
              flex justify-between items-center
              transition-all duration-200 ease-in-out
              hover:shadow-md hover:scale-[1.01]
              focus:ring-2 focus:ring-jsyellow/50 focus:ring-offset-2
              [@media(min-width:3500px)]:!text-3xl
              ${errorMessage ? "border-red-500 bg-red-50" : ""}
              ${className}
            `}
            onClick={() => setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
          >
            <span className={!selectedOption ? "text-gray-400 [@media(min-width:3500px)]:!text-3xl" : "[@media(min-width:3500px)]:!text-3xl"}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <MdKeyboardArrowDown
              className="w-6 h-6 [@media(min-width:3500px)]:!w-10 [@media(min-width:3500px)]:!h-10 text-jsyellow transition-transform duration-200"
              style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </div>

          {isOpen && (
            <div
              role="listbox"
              className="absolute z-50 w-full mt-2 bg-white border border-jsyellow rounded-[24px] overflow-hidden shadow-xl"
              style={{
                maxHeight: maxDropdownHeight,
                animation: "selectDropIn 0.15s ease-out forwards",
              }}
            >
              <div
                className="overflow-y-auto overflow-x-hidden"
                style={{ maxHeight: maxDropdownHeight }}
              >
                {options.map((option, index) => (
                  <div
                    key={option.value}
                    ref={highlightedIndex === index ? highlightedOptionRef : null}
                    role="option"
                    aria-selected={selectedOption?.value === option.value}
                    className={`
                      px-4 sm:px-6 py-3 cursor-pointer
                      transition-colors duration-150
                      text-sm sm:text-base
                      [@media(min-width:3500px)]:!text-3xl [@media(min-width:3500px)]:!py-4
                      border-b border-gray-100 last:border-b-0
                      ${highlightedIndex === index ? "bg-jsyellow/20 text-jsblack font-medium" : "hover:bg-[#fef7eb] text-gray-700"}
                      ${selectedOption?.value === option.value ? "bg-jsyellow/10 font-semibold text-jsblack" : ""}
                    `}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{option.label}</span>
                      {selectedOption?.value === option.value && (
                        <div className="w-4 h-4 [@media(min-width:3500px)]:!w-6 [@media(min-width:3500px)]:!h-6 bg-jsyellow rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                          <svg className="w-2.5 h-2.5 [@media(min-width:3500px)]:!w-4 [@media(min-width:3500px)]:!h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {options.length > maxVisibleOptions && (
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent pointer-events-none opacity-80" />
              )}
            </div>
          )}
        </div>

        {errorMessage && (
          <span className="text-sm [@media(min-width:3500px)]:!text-xl text-red-500 pl-2 animate-[fadeIn_0.2s_ease]">
            {errorMessage}
          </span>
        )}

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes selectDropIn {
            from { opacity: 0; transform: translateY(-8px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        ` }} />
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
