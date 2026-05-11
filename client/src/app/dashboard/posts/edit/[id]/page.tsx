"use client";
import { useEffect, useState, useRef } from "react";
import PostForm from "@/components/views/dashboard/post/post-form";
import { PostType, Role } from "@/types/enums";
import { Post, PostFormInputs } from "@/types/post";
import api from "@/utils/api/axios";
import { formatApiError } from "@/utils/api/formatApiError";
import { buildImageUrl } from "@/utils/imageUrl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const isAuthor = session?.user?.role === Role.AUTHOR;
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const fileInputAzRef = useRef<HTMLInputElement>(null);
  const fileInputRuRef = useRef<HTMLInputElement>(null);
  const [previewUrlAz, setPreviewUrlAz] = useState<string | null>(null);
  const [previewUrlRu, setPreviewUrlRu] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
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
      postType: PostType.BLOG,
      published: false,
      eventDate: undefined,
      eventStatus: undefined,
    },
  });

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const { data } = await api.get<Post>(`/posts/${params.id}`);

        const imageUrl = data.imageUrl
          ? typeof data.imageUrl === "string"
            ? { az: data.imageUrl, ru: data.imageUrl }
            : { az: data.imageUrl?.az ?? "", ru: data.imageUrl?.ru ?? "" }
          : { az: "", ru: "" };
        const imageAlt = data.imageAlt
          ? { az: data.imageAlt.az ?? "", ru: data.imageAlt.ru ?? "" }
          : { az: "", ru: "" };
        const tagsRaw = data.tags;
        const tags = Array.isArray(tagsRaw)
          ? { az: tagsRaw, ru: tagsRaw }
          : (tagsRaw && typeof tagsRaw === "object" && "az" in tagsRaw && "ru" in tagsRaw)
          ? { az: tagsRaw.az ?? [], ru: tagsRaw.ru ?? [] }
          : { az: [] as string[], ru: [] as string[] };
        reset({
          title: data.title,
          content: data.content,
          slug: data.slug,
          imageUrl,
          imageAlt,
          tags,
          postType: data.postType,
          published: data.published,
          eventDate: data.eventDate ? new Date(data.eventDate).toISOString() : undefined,
          offerStartDate: data.offerStartDate ? new Date(data.offerStartDate).toISOString() : undefined,
          offerEndDate: data.offerEndDate ? new Date(data.offerEndDate).toISOString() : undefined,
          eventStatus: data.eventStatus,
        });
        if (imageUrl.az) setPreviewUrlAz(buildImageUrl(imageUrl.az));
        if (imageUrl.ru) setPreviewUrlRu(buildImageUrl(imageUrl.ru));
      } catch (error: unknown) {
        console.error("Post yüklənmədi:", error);
        toast.error(formatApiError(error, "Post yüklənə bilmədi."));
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params.id, reset]);

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
          formData.append("eventDate", new Date(data.eventDate).toISOString());
        }
      }

      if (data.postType === PostType.OFFERS) {
        if (data.offerStartDate) {
           formData.append("offerStartDate", new Date(data.offerStartDate).toISOString());
        }
        if (data.offerEndDate) {
           formData.append("offerEndDate", new Date(data.offerEndDate).toISOString());
        }
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

      const response = await api.patch(`/posts/${params.id}`, formData);

      if (response.status === 200) {
        toast.success("Post uğurla yeniləndi");
        router.push("/dashboard/posts");
        router.refresh();
      }
    } catch (error: unknown) {
      console.error("Yeniləmə xətası:", error);
      toast.error(formatApiError(error, "Post yenilənə bilmədi."));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse">Yüklənir...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <h1 className="text-2xl font-bold">Post tapılmadı</h1>
        <button
          className="mt-4 px-4 py-2 bg-jsyellow text-white rounded-md"
          onClick={() => router.push("/dashboard/posts")}
        >
          Geri qayıt
        </button>
      </div>
    );
  }

  return (
    <PostForm
      mode="edit"
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
