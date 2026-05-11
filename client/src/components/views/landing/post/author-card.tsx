import { Post } from "@/types/post";
import { buildImageUrl } from "@/utils/imageUrl";
import Image from "next/image";

interface PostAuthorCardProps {
  author: Post["author"];
  authorLabel?: string;
  locale?: "az" | "ru";
}

function getNamePart(
  value: string | { az?: string; ru?: string } | null | undefined,
  locale: "az" | "ru"
): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  const v = value[locale] ?? value.az ?? value.ru;
  return (v ?? "").trim();
}

export default function PostAuthorCard({ author, authorLabel = "Müəllif", locale = "az" }: PostAuthorCardProps) {
  if (!author) return null;

  const avatarUrl = author.profile?.avatarUrl;
  const professionRaw = author.profile?.profession;
  const profession =
    professionRaw != null && typeof professionRaw === "object"
      ? (professionRaw[locale] ?? professionRaw.az ?? professionRaw.ru ?? "")
      : (typeof professionRaw === "string" ? professionRaw : "");
  const first = getNamePart(author.firstName, locale);
  const last = getNamePart(author.lastName, locale);
  const displayName =
    first || last ? [first, last].filter(Boolean).join(" ") : author.name;
  const imgSrc = avatarUrl ? buildImageUrl(avatarUrl) : null;

  return (
    <section
      className="rounded-xl border border-gray-200/80 bg-gray-50/60 px-4 py-3"
      aria-label={authorLabel}
    >
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={displayName}
              width={64}
              height={64}
              className="h-full w-full object-cover"
              sizes="64px"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-lg font-semibold text-jsyellow"
              aria-hidden
            >
              {(displayName || "?").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
            {authorLabel}
          </p>
          <p className="text-sm font-semibold text-gray-800 leading-tight">
            {displayName}
          </p>
          {profession && (
            <p className="text-sm font-normal text-gray-500 leading-tight mt-0.5">
              {profession}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
