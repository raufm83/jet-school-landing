"use client";

import FaqForm from "@/components/views/dashboard/faq/faq-form";
import { FaqFormPayload, FaqItem } from "@/types/faq";
import api from "@/utils/api/axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function EditFaqPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FaqFormPayload>({
    defaultValues: {
      question: { az: "", ru: "" },
      answer: { az: "", ru: "" },
      order: 0,
    },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<FaqItem>(`/faq/${params.id}`);
        reset({
          question: data.question || { az: "", ru: "" },
          answer: data.answer || { az: "", ru: "" },
          order: data.order ?? 0,
        });
        const pages =
          Array.isArray(data.pages) && data.pages.length
            ? data.pages
            : data.page
              ? [data.page]
              : [];
        setSelectedPages(pages);
      } catch (e) {
        console.error(e);
        toast.error("FAQ yüklənə bilmədi");
        router.push("/dashboard/faq");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id, reset, router]);

  const onSubmit = async (data: FaqFormPayload) => {
    try {
      const res = await api.patch(`/faq/${params.id}`, {
        question: data.question,
        answer: data.answer,
        order: Number.isFinite(data.order) ? data.order : 0,
        pages: selectedPages,
      });
      if (res.status === 200) {
        toast.success("Yeniləndi");
        router.push("/dashboard/faq");
        router.refresh();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Xəta baş verdi");
    }
  };

  if (loading) {
    return (
      <div className="p-6 min-h-[40vh] flex items-center justify-center">
        <p>Yüklənir...</p>
      </div>
    );
  }

  return (
    <FaqForm
      mode="edit"
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
