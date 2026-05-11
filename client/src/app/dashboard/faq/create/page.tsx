"use client";

import FaqForm from "@/components/views/dashboard/faq/faq-form";
import { FaqFormPayload } from "@/types/faq";
import api from "@/utils/api/axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const defaults: FaqFormPayload = {
  question: { az: "", ru: "" },
  answer: { az: "", ru: "" },
  order: 0,
};

export default function CreateFaqPage() {
  const router = useRouter();
  const [selectedPages, setSelectedPages] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FaqFormPayload>({ defaultValues: defaults });

  const onSubmit = async (data: FaqFormPayload) => {
    try {
      const res = await api.post("/faq", {
        question: data.question,
        answer: data.answer,
        order: Number.isFinite(data.order) ? data.order : 0,
        pages: selectedPages.length ? selectedPages : undefined,
      });
      if (res.status === 201) {
        toast.success("FAQ yaradıldı");
        router.push("/dashboard/faq");
        router.refresh();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Xəta baş verdi");
    }
  };

  return (
    <FaqForm
      mode="create"
      onSubmit={onSubmit}
      register={register}
      errors={errors}
      isSubmitting={isSubmitting}
      handleSubmit={handleSubmit}
      router={router}
      selectedPages={selectedPages}
      onSelectedPagesChange={setSelectedPages}
    />
  );
}
