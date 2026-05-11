"use client";

import GalleryForm from "@/components/views/dashboard/gallery/gallery-form";
import { GalleryFormInputs, GalleryImage } from "@/types/gallery";
import api from "@/utils/api/axios";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function EditGalleryItemPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GalleryFormInputs>();

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const { data } = await api.get<GalleryImage>(`/gallery/${id}`);
        const title = (data.title as { az?: string; ru?: string }) || {};
        const imageAlt = (data.imageAlt as { az?: string; ru?: string }) || {};
        reset({
          title: {
            az: title.az ?? "",
            ru: title.ru ?? "",
          },
          imageAlt: {
            az: imageAlt.az ?? "",
            ru: imageAlt.ru ?? "",
          },
        });
      } catch (error) {
        console.error("Qaleriya məlumatı yüklənə bilmədi:", error);
        toast.error("Qaleriya məlumatı yüklənə bilmədi");
        router.push("/dashboard/gallery");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGallery();
  }, [id, reset, router]);

  const onSubmit = async (data: GalleryFormInputs) => {
    try {
      const imageFile = data.image instanceof File ? data.image : data.image?.[0];

      if (imageFile) {
        const formData = new FormData();
        if (data.title) {
          formData.append("title[az]", data.title.az);
          formData.append("title[ru]", data.title.ru);
        }
        if (data.imageAlt) {
          formData.append("imageAlt[az]", data.imageAlt.az ?? "");
          formData.append("imageAlt[ru]", data.imageAlt.ru ?? "");
        }
        formData.append("image", imageFile);

        const response = await api.patch(`/gallery/${id}`, formData);
        if (response.status === 200) {
          toast.success("Şəkil uğurla yeniləndi");
          router.push("/dashboard/gallery");
          router.refresh();
        }
        return;
      }

      const body: Record<string, string> = {};
      if (data.title) {
        body["title[az]"] = data.title.az;
        body["title[ru]"] = data.title.ru;
      }
      if (data.imageAlt) {
        body["imageAlt[az]"] = data.imageAlt.az ?? "";
        body["imageAlt[ru]"] = data.imageAlt.ru ?? "";
      }

      const response = await api.patch(`/gallery/${id}/details`, body);

      if (response.status === 200) {
        toast.success("Şəkil uğurla yeniləndi");
        router.push("/dashboard/gallery");
        router.refresh();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error("Yeniləmə xətası:", error);
      toast.error(
        err.response?.data?.message || "Xəta baş verdi. Yenidən cəhd edin"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 min-h-screen w-full flex items-center justify-center">
        <div className="text-gray-500">Yüklənir...</div>
      </div>
    );
  }

  return (
    <GalleryForm
      mode="edit"
      onSubmit={onSubmit}
      register={register}
      errors={errors}
      isSubmitting={isSubmitting}
      handleSubmit={handleSubmit}
      router={router}
      setValue={setValue}
    />
  );
}
