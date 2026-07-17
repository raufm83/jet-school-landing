"use client";
import { cn } from "@/utils/cn";
import React from "react";
import type { IconType } from "react-icons";

interface IButton {
  text?: string;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary";
  onClick?: () => void;
  icon?: IconType | React.ReactElement;
  iconSize?: number;
  iconPosition?: "left" | "right";
  className?: string;
  fontWeight?: "normal" | "bold" | "semibold" | "extrabold";
  ariaLabel?: string;
}

export default function Button({
  text,
  variant = "primary",
  type = "button",
  icon: Icon,
  className,
  iconPosition = "left",
  iconSize = 16,
  fontWeight = "semibold",
  onClick,
  ariaLabel,
}: IButton) {
  const renderIcon = () => {
    if (!Icon) return null;

    if (React.isValidElement(Icon)) {
      return Icon;
    }

    if (typeof Icon === "function") {
      return <Icon size={iconSize} />;
    }

    return null;
  };

  return (
    <button
      aria-label={ariaLabel}
      className={cn(
        variant === "primary" &&
          "bg-jsyellow hover:bg-white border-2 border-transparent hover:border-jsyellow text-jsblack hover:text-[#D97706]",
        variant === "secondary" && "bg-white text-[#D97706] hover:bg-gray-50 border-2 border-[#D97706]",
        "py-3 px-8 rounded-[30px]",
        "flex items-center transition-all duration-300 justify-center gap-2 group",
        iconPosition === "right" && "flex-row-reverse",
        fontWeight === "normal" && "font-normal",
        fontWeight === "bold" && "font-bold",
        fontWeight === "semibold" && "font-semibold",
        fontWeight === "extrabold" && "font-extrabold",
        className,
        "w-fit"
      )}
      onClick={onClick}
      type={type}
    >
      <span className="transition-transform duration-300 group-hover:scale-110">
        {renderIcon()}
      </span>
      {text && (
        <span className="[@media(min-width:3000px)]:!text-3xl">
          {text}
        </span>
      )}
    </button>
  );
}
