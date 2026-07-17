import SectionTitle from "@/components/shared/section-title";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import Button from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { MdArrowRightAlt } from "react-icons/md";
import ProjectCard from "@/components/views/landing/projects/project-card";
import type { Project } from "@/types/student-projects";

const fetchProjects = async () => {
  try {
    const res = await fetch(
      `${PUBLIC_API_BASE}/student-projects?sortBy=order&order=desc`,
      { next: { revalidate: 120 } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return null;
  }
};

export default async function Projects() {
  try {
    const t = await getTranslations("projects");
    const projects = await fetchProjects();
    if (!projects) return null;

    const sorted =
      Array.isArray(projects)
        ? projects.slice()
        : projects.items
          ? { ...projects, items: projects.items.slice() }
          : projects;

    const items: Project[] = Array.isArray(sorted)
      ? sorted
      : (sorted as { items?: Project[] }).items ?? [];
    const visibleItems = items.slice(0, 3);
    if (visibleItems.length === 0) return null;

    return (
      <div
        id="media"
        className="
          container mx-auto
          my-20 4xl:my-24
          p-0
          flex flex-col
          gap-8 4xl:gap-12
        "
      >
        <SectionTitle
          home
          as="h2"
          title={t("title")}
          description={t("description")}
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((project, idx) => (
            <div
              key={project.id}
              className="h-[327px] rounded-3xl shadow-lg 4xl:rounded-[48px]"
            >
              <ProjectCard
                loadEager={idx === 0}
                description={project.description}
                title={project.title}
                imageUrl={project.imageUrl}
                link={project.link}
                category={project.category}
              />
            </div>
          ))}
        </div>

        <Link href="/projects" aria-label={`${t("seeAll")} ${t("title")}`}>
          <Button
            iconPosition="right"
            className="
              items-center mx-auto
              py-3 4xl:py-4 px-6 4xl:px-8
              [@media(min-width:3500px)]:!text-2xl
            "
            icon={<MdArrowRightAlt size={24} className="[@media(min-width:3500px)]:!w-12 [@media(min-width:3500px)]:!h-12" />}
            text={t("seeAll")}
            ariaLabel={`${t("seeAll")} ${t("title")}`}
          />
        </Link>
      </div>
    );
  } catch (error) {
    console.error("Projects component error:", error);
    return null;
  }
}