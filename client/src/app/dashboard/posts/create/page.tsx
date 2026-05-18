"use client";
import PostForm from "@/components/views/dashboard/post/post-form";
import { EventStatus, PostType, Role } from "@/types/enums";
import { PostFormInputs } from "@/types/post";
import api from "@/utils/api/axios";
import { formatApiError } from "@/utils/api/formatApiError";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
export default function CreatePostPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAuthor = session?.user?.role === Role.AUTHOR;
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PostFormInputs>({
    defaultValues: {
      title: { az: "", ru: "" },
      content: { az: "", ru: "" },
      slug: { az: "", ru: "" },
      imageUrl: { az: "", ru: "" },
      imageAlt: { az: "", ru: "" },
      tags: { az: [], ru: [] },
      blogCategoryId: "",
      postType: PostType.BLOG,
      published: false,
      eventDate: undefined,
      eventStatus: undefined,
      offerStartDate: undefined,
      offerEndDate: undefined,
    },
  });

  const fileInputAzRef = useRef<HTMLInputElement>(null);
  const fileInputRuRef = useRef<HTMLInputElement>(null);
  const [previewUrlAz, setPreviewUrlAz] = useState<string | null>(null);
  const [previewUrlRu, setPreviewUrlRu] = useState<string | null>(null);

  const handleFileChange = (lang: "az" | "ru", event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setValue(lang === "az" ? "imageAz" : "imageRu", file);
      const url = URL.createObjectURL(file);
      if (lang === "az") setPreviewUrlAz(url); else setPreviewUrlRu(url);
    }
  };

  const onSubmit = async (data: PostFormInputs) => {
    try {
      const formData = new FormData();

      formData.append("title[az]", data.title.az);
      formData.append("title[ru]", data.title.ru);
      formData.append("content[az]", data.content.az);
      formData.append("content[ru]", data.content.ru);
      formData.append("slug[az]", data.slug.az);
      formData.append("slug[ru]", data.slug.ru);

      formData.append("published", String(data.published));
      formData.append("postType", isAuthor ? PostType.BLOG : data.postType);

      if (data.tags?.az?.length) {
        data.tags.az.forEach((tag: string) => formData.append("tagsAz", tag));
      }
      if (data.tags?.ru?.length) {
        data.tags.ru.forEach((tag: string) => formData.append("tagsRu", tag));
      }

      if (data.postType === PostType.EVENT) {
        if (data.eventDate) {
          formData.append("eventDate", data.eventDate);
        }
        const eventStatus = data.eventStatus || EventStatus.UPCOMING;
        formData.append("eventStatus", eventStatus);
      }

      if (data.postType === PostType.OFFERS) {
        if (data.offerStartDate) {
          formData.append("offerStartDate", data.offerStartDate);
        }
        if (data.offerEndDate) {
          formData.append("offerEndDate", data.offerEndDate);
        }
      }

      const effectiveType = isAuthor ? PostType.BLOG : data.postType;
      if (effectiveType === PostType.BLOG) {
        formData.append("blogCategoryId", (data.blogCategoryId ?? "").trim());
      }

      if (data.imageAlt?.az !== undefined) formData.append("imageAlt[az]", data.imageAlt.az ?? "");
      if (data.imageAlt?.ru !== undefined) formData.append("imageAlt[ru]", data.imageAlt.ru ?? "");

      if (data.imageAz) {
        const file = data.imageAz instanceof File ? data.imageAz : (data.imageAz as FileList)?.[0];
        if (file instanceof File) formData.append("imageAz", file);
      }
      if (data.imageRu) {
        const file = data.imageRu instanceof File ? data.imageRu : (data.imageRu as FileList)?.[0];
        if (file instanceof File) formData.append("imageRu", file);
      }

      const response = await api.post("/posts", formData);

      if (response.status === 201) {
        toast.success("Post uğurla yaradıldı");
        router.push("/dashboard/posts");
        router.refresh();
      }
    } catch (error: unknown) {
      console.error("Yaratma xətası:", error);
      toast.error(formatApiError(error, "Post yaradıla bilmədi."));
    }
  };

  return (
    <PostForm
      mode="create"
      onSubmit={onSubmit}
      register={register}
      errors={errors}
      isSubmitting={isSubmitting}
      handleSubmit={handleSubmit}
      router={router}
      watch={watch}
      setValue={setValue}
      control={control}
      fileInputAzRef={fileInputAzRef}
      fileInputRuRef={fileInputRuRef}
      handleFileChange={handleFileChange}
      previewUrlAz={previewUrlAz}
      previewUrlRu={previewUrlRu}
      isAuthor={isAuthor}
    />
  );
}
