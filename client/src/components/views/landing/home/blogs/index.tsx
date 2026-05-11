// src/components/views/landing/home/blogs.tsx
import SectionTitle from "@/components/shared/section-title";
import Button from "@/components/ui/button";
import { getAllHomeMediaPosts } from "@/utils/api/post";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { MdArrowRightAlt } from "react-icons/md";
import dynamic from "next/dynamic";

const PostsSlider = dynamic(() => import("./slider"));

export default async function Blogs() {
  try {
    const [t, posts] = await Promise.all([
      getTranslations("blogs"),
      getAllHomeMediaPosts(),
    ]);
    if (!posts?.items?.length) return null;

    return (
      <div
        id="blogs"
        className="
          container mx-auto
          px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16
          2xl:px-0 3xl:px-24 4xl:px-32
          my-20 4xl:my-24
          flex flex-col gap-8 4xl:gap-12
        "
      >
        <SectionTitle home title={t("title")} description={t("description")} />

        <div>
          <PostsSlider data={posts} />
        </div>

        <Link href="/news">
          <Button
            iconPosition="right"
            className="items-center mx-auto py-3 [@media(min-width:3500px)]:!text-2xl px-6 4xl:py-4 4xl:px-8"
            icon={<MdArrowRightAlt size={24} className="[@media(min-width:3500px)]:!w-12 [@media(min-width:3500px)]:!h-12" />}
            text={t("seeAll")}
          />
        </Link>
      </div>
    );
  } catch (error) {
    console.error("Blogs component error:", error);
    return null;
  }
}
