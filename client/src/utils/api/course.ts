import { cache } from "react";
import { CONTENT_ISR_SECONDS } from "@/constants/content-isr";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";

export const getCourseDetails = cache(async function getCourseDetails(slug: string) {
  try {
    const res = await fetch(
      `${PUBLIC_API_BASE}/courses/slug/${slug}`,
      { next: { revalidate: CONTENT_ISR_SECONDS } }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch course data");
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching course details:", error);
    throw error;
  }
});

export const getAllCourses = cache(async function getAllCourses({ limit = 24, page = 1 }: any) {
  try {
    const res = await fetch(
      `${PUBLIC_API_BASE}/courses?${new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
      })}`,
      { next: { revalidate: CONTENT_ISR_SECONDS } }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch courses");
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching all courses:", error);
    throw error;
  }
});
