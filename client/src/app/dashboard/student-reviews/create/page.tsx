"use client";

import ReviewForm from "@/components/views/dashboard/student-reviews/review-form";
import { ReviewFormInputs } from "@/types/student-reviews";
import api from "@/utils/api/axios";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function CreateReviewPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormInputs>();

  const onSubmit = async (data: ReviewFormInputs) => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        courseId: data.courseId,
        link: data.link,
      };
      const response = await api.post("/student-reviews", payload);
      if (response.status === 201) {
        toast.success("Rəy yaradıldı");
        router.push("/dashboard/student-reviews");
        router.refresh();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Xəta baş verdi");
    }
  };

  return (
    <ReviewForm
      mode="create"
      onSubmit={onSubmit}
      register={register}
      errors={errors}
      isSubmitting={isSubmitting}
      handleSubmit={handleSubmit}
      router={router}
    />
  );
}
