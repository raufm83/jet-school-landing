import SectionTitle from "@/components/shared/section-title";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import { TeamMember } from "@/types/team";
import { getLocale, getTranslations } from "next-intl/server";
import { Locale } from "@/i18n/request";
import dynamic from "next/dynamic";
import TeamMemberCard from "./team-member-card";

const TeamSlider = dynamic(() => import("./team-slider"));

const getTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    const res = await fetch(
      `${PUBLIC_API_BASE}/team/active?limit=30`,
      { next: { revalidate: 120 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data;
  } catch {
    return [];
  }
};

interface ITeamSectionProps {
  title?: string;
  description?: string;
  teamMembers?: TeamMember[];
  /** default: true — əks halda şəbəkə (grid) */
  isSlider?: boolean;
  /** Kurs səhifəsində müəllim vəzifəsi (position) göstər */
  isCoursePage?: boolean;
  /** Ana səhifə — SectionTitle ölçüsü */
  home?: boolean;
}

export default async function TeamSection({
  title,
  description,
  teamMembers: propTeamMembers,
  isSlider = true,
  isCoursePage = false,
  home = false,
}: ITeamSectionProps = {}) {
  const [locale, t, fetchedTeamMembers] = await Promise.all([
    getLocale() as Promise<Locale>,
    getTranslations("aboutPage"),
    !propTeamMembers ? getTeamMembers() : Promise.resolve(null),
  ]);

  const finalTeamMembers = propTeamMembers || fetchedTeamMembers || [];
  const finalTitle = title || t("team.title");

  if (finalTeamMembers.length === 0) {
    return null;
  }

  if (!isSlider) {
    return (
      <section className={isCoursePage ? "mt-10" : "container mx-auto mt-10 px-4"}>
        <SectionTitle home={home} title={finalTitle} description={description} />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {finalTeamMembers.map((teamMember, index) => (
            <TeamMemberCard
              key={teamMember.id}
              member={teamMember}
              locale={locale}
              loadEager={index < 2}
              isCoursePage={isCoursePage}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={isCoursePage ? "mt-10 w-full overflow-hidden" : "container mx-auto mt-10 w-full overflow-hidden px-4"}>
      <SectionTitle home={home} title={finalTitle} description={description} />
      <TeamSlider
        teamMembers={finalTeamMembers}
        locale={locale}
        isCoursePage={isCoursePage}
      />
    </section>
  );
}
