"use client";

import ReviewForm from "@/components/views/dashboard/student-reviews/review-form";
import { ReviewFormInputs } from "@/types/student-reviews";
import api from "@/utils/api/axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function EditReviewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormInputs>();

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const { data } = await api.get(`/student-reviews/${id}`);
        const title = (data.title as { az?: string; ru?: string }) || {};
        const description = (data.description as { az?: string; ru?: string }) || {};
        reset({
          title: {
            az: title.az ?? "",
            ru: title.ru ?? "",
          },
          description: {
            az: description.az ?? "",
            ru: description.ru ?? "",
          },
          courseId: data.courseId ?? "",
          link: data.link ?? "",
        });
      } catch {
        toast.error("Rəy yüklənə bilmədi");
        router.push("/dashboard/student-reviews");
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [id, reset, router]);

  const onSubmit = async (data: ReviewFormInputs) => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        courseId: data.courseId,
        link: data.link,
      };
      await api.patch(`/student-reviews/${id}`, payload);
      toast.success("Rəy yeniləndi");
      router.push("/dashboard/student-reviews");
      router.refresh();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Xəta baş verdi");
    }
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Yüklənir...</p>
      </div>
    );
  }

  return (
    <ReviewForm
      mode="edit"
      onSubmit={onSubmit}
      register={register}
      errors={errors}
      isSubmitting={isSubmitting}
      handleSubmit={handleSubmit}
      router={router}
    />
  );
}
