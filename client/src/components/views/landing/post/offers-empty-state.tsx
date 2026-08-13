import Image from "next/image";

type OffersEmptyStateProps = {
  title: string;
  line1?: string;
  line2?: string;
  imageSrc?: string;
};

export default function OffersEmptyState({
  title,
  line1,
  line2,
  imageSrc = "/images/no-campaigns.svg",
}: OffersEmptyStateProps) {
  return (
    <div className="flex min-h-[min(48vh,480px)] flex-col items-center justify-center px-4 py-12 text-center animate-in fade-in duration-700">
      <div
        className="mb-10 w-full max-w-[min(100%,20rem)] sm:max-w-[22rem]"
        aria-hidden
      >
        <Image
          src={imageSrc}
          alt={title || "Empty State"}
          title={title || undefined}
          width={400}
          height={300}
          className="h-auto w-full [filter:drop-shadow(0_10px_28px_rgba(252,174,30,0.12))]"
          priority={false}
        />
      </div>
      <h2 className="mb-4 max-w-lg text-balance font-semibold text-jsblack text-xl sm:text-2xl md:text-[1.65rem] leading-snug tracking-tight">
        {title}
      </h2>
      {line1 && (
        <p className="max-w-md text-pretty text-sm leading-relaxed text-slate-500 sm:text-base">
          {line1}
        </p>
      )}
      {line2 && (
        <p className="mt-2 max-w-md text-pretty text-sm leading-relaxed text-slate-500 sm:text-base">
          {line2}
        </p>
      )}
    </div>
  );
}
