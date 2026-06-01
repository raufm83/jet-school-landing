import { PostType, EventStatus } from "@/types/enums";
import LazyHtmlContent from "@/components/shared/lazy-html-content";
import { deferEmbedsInHtml } from "@/utils/deferEmbedsInHtml";
import { buildImageUrl } from "@/utils/imageUrl";
import { BLUR_PLACEHOLDER_SVG } from "@/utils/imagePlaceholder";
import Image from "next/image";
import { Locale } from "@/i18n/request";
import { MdCalendarToday, MdAccessTime } from "react-icons/md";
import { Link } from "@/i18n/routing";

interface PostHeroProps {
  locale: Locale;
  title: string;
  type: string;
  date: string;
  eventDate?: string;
  eventTime?: string;
  eventStatus?: EventStatus;
  content: string;
  tags: string[];
  imageUrl?: string;
  dateText: string;
  eventDateText: string;
  timeText: string;
  tagsText: string;
}

export default function PostHero({
  locale,
  title,
  type,
  date,
  eventDate,
  eventTime,
  eventStatus,
  content,
  tags,
  imageUrl,
  dateText,
  timeText,
  tagsText,
}: PostHeroProps) {

  const getEventStatusName = (status?: EventStatus) => {
    if (!status) return null;

    switch (status) {
      case EventStatus.UPCOMING:
        return locale === "az" ? "Gələcək" : "Предстоящий";
      case EventStatus.PAST:
        return locale === "az" ? "Keçmiş" : "Прошедший";
      case EventStatus.ONGOING:
        return locale === "az" ? "Davam edir" : "Активная";
      default:
        return status;
    }
  };

  // Determine which date to show (eventDate takes priority for events/offers end date)
  const displayDate = String(eventDate ?? date ?? "");
  // If eventTime is provided explicitly, use it. Otherwise try to parse from displayDate.
  const [datePart, extractedTime] = displayDate.split(" ");
  const timePart = eventTime || extractedTime;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex flex-wrap items-center gap-4">
        <span
          className={`px-4 py-2 rounded-full capitalize ${
            type === PostType.BLOG
              ? "bg-blue-100 text-blue-800"
              : type === PostType.NEWS
              ? "bg-green-100 text-green-800"
              : "bg-jsyellow/10 text-jsblack"
          }`}
        >
          {type}
        </span>

        <div className="flex items-center gap-2 bg-jsyellow/10 text-jsblack px-4 py-2 rounded-full">
          <MdCalendarToday className="text-jsblack opacity-60" />
          <span className="text-sm font-medium">{dateText}: {datePart}</span>
        </div>

        {timePart && (
          <div className="flex items-center gap-2 bg-jsyellow/10 text-jsblack px-4 py-2 rounded-full">
            <MdAccessTime className="text-jsblack opacity-60" />
            <span className="text-sm font-medium">{timeText}: {timePart}</span>
          </div>
        )}

        {eventStatus && (
          <span
            className={`px-4 py-2 rounded-full capitalize ${
              eventStatus === EventStatus.UPCOMING
                ? "bg-jsyellow/10 text-jsblack"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {getEventStatusName(eventStatus)}
          </span>
        )}
      </div>

      <h1 className="text-xl leading-[1.35] sm:text-2xl md:text-[clamp(1.3rem,2.2vw,1.65rem)] md:leading-[1.4] lg:text-[clamp(1.35rem,1.4vw,1.75rem)] lg:leading-[1.45] font-bold text-jsblack">
        {title}
      </h1>

      {imageUrl && (
        <div className="w-full relative overflow-hidden mt-10 rounded-[32px] aspect-[16/9] bg-jsyellow/10">
          <Image
            src={buildImageUrl(imageUrl)}
            alt={title}
            fill
            quality={85}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER_SVG}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 900px"
            className="object-cover object-center transition-transform duration-500 hover:scale-105"
            priority
            fetchPriority="high"
            decoding="async"
          />
        </div>
      )}

      <LazyHtmlContent
        html={deferEmbedsInHtml(content)}
        className="prose prose-post-article max-w-none prose-li:list-outside prose-li:ml-1 prose-li:pl-0"
      />


      {tags && tags.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">{tagsText}:</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Link
                key={index}
                href={{ pathname: "/search/tag/[tag]", params: { tag } }}
                className="rounded-full bg-jsyellow/10 px-3 py-1 text-sm text-jsblack transition-colors hover:bg-jsyellow/25 hover:underline"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}