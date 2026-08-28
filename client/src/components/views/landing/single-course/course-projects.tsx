"use client";

import React from "react";
import Link from "next/link";
import { Project } from "@/types/student-projects";
import ProjectCard from "@/components/views/landing/projects/project-card";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { useTranslations } from "next-intl";

interface CourseProjectsProps {
  projects: Project[];
  locale: string;
}

export default function CourseProjects({ projects, locale }: CourseProjectsProps) {
  const t = useTranslations("singleCoursePage");
  
  if (!projects || projects.length === 0) return null;

  const displayProjects = projects.slice(0, 4);

  return (
    <div className="w-full flex flex-col gap-6 md:gap-8">
      <h2 className="text-[clamp(28px,3vw,46px)] [@media(min-width:3500px)]:!text-6xl font-bold text-jsblack">
        {t("projects") || "Layihələr"}
      </h2>

      {/* Desktop Grid (Hidden on Mobile) */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-6">
        {displayProjects.map((project, index) => (
          <ProjectCard
            key={project.id}
            loadEager={index === 0}
            imageUrl={project.imageUrl}
            link={project.link}
            title={project.title!}
            description={project.description!}
            category={project.category!}
          />
        ))}
      </div>

      {/* Mobile Carousel (Hidden on Desktop) */}
      <div className="block lg:hidden w-full overflow-hidden">
        <Swiper
          modules={[Autoplay]}
          spaceBetween={16}
          slidesPerView={1}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          className="!overflow-hidden py-4"
        >
          {displayProjects.map((project, index) => (
            <SwiperSlide key={project.id}>
              <ProjectCard
                loadEager={index === 0}
                imageUrl={project.imageUrl}
                link={project.link}
                title={project.title!}
                description={project.description!}
                category={project.category!}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="mt-4">
        <Link
          href={`/${locale}/projects`}
          target="_blank"
          className="inline-block text-jsyellow font-semibold underline decoration-2 underline-offset-8 [text-decoration-skip-ink:none] hover:text-jsblack transition-colors text-lg"
        >
          {t("seeAllProjects") || "Bütün layihələrə bax"}
        </Link>
      </div>
    </div>
  );
}
