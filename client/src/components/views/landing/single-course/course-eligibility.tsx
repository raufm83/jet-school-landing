import SectionTitle from "@/components/shared/section-title";
import { CourseEligibility } from "@/types/course";
import { getIcon } from "@/utils/icon";

interface IEligibilitySectionProps {
  eligibility: CourseEligibility[];
  title: string;
  locale: "az" | "ru";
}

export default function EligibilitySection({
  eligibility,
  title,
  locale,
}: IEligibilitySectionProps) {
  const sorted = [...eligibility].sort((a, b) => {
    const d = (a.order ?? 0) - (b.order ?? 0);
    if (d !== 0) return d;
    return (a.eligibilityId ?? "").localeCompare(b.eligibilityId ?? "");
  });

  return (
    <div className="mt-10 pt-4 sm:mt-14 sm:pt-6 lg:mt-20 lg:pt-10">
      <SectionTitle title={title} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {sorted.map((criteria, index) => {
          const IconComponent = getIcon(criteria.eligibility.icon);

          return (
            <div
              key={criteria.id ?? index}
              className="rounded-[32px] border border-jsyellow bg-[#fef7eb] p-6 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg hover:shadow-[rgba(252,174,30,0.15)]"
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-jsyellow p-4 text-white">
                  <IconComponent className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold [@media(min-width:3500px)]:!text-3xl">
                  {criteria.eligibility.title[locale]}
                </h3>
                <p className="text-gray-600 [@media(min-width:3500px)]:!text-2xl">
                  {criteria.eligibility.description[locale]}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
