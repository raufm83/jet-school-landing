"use client";

import VacancyForm from "@/components/views/dashboard/vacancy/vacancy-form";
import type { Vacancy, VacancyFormPayload } from "@/types/vacancy";
import api from "@/utils/api/axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

function deadlineInputFromIso(iso?: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function deadlineToApi(raw: string): string | null {
  const t = raw?.trim();
  if (!t) return null;
  return `${t}T12:00:00.000Z`;
}

export default function EditVacancyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VacancyFormPayload>({
    defaultValues: {
      title: { az: "", ru: "" },
      description: { az: "", ru: "" },
      requirements: { az: "", ru: "" },
      workConditions: { az: "", ru: "" },
      deadline: "",
      employmentType: "",
      experienceLevel: "",
      slug: { az: "", ru: "" },
      isActive: true,
      order: 0,
      tags: { az: [], ru: [] },
    },
  });
 
  const [initialData, setInitialData] = useState<Vacancy | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<Vacancy>(`/vacancies/manage/${params.id}`);
        reset({
          title: data.title || { az: "", ru: "" },
          description: data.description || { az: "", ru: "" },
          requirements: data.requirements || { az: "", ru: "" },
          workConditions: data.workConditions || { az: "", ru: "" },
          deadline: deadlineInputFromIso(data.deadline),
          employmentType: data.employmentType ?? "",
          experienceLevel: data.experienceLevel ?? "",
          slug: data.slug || { az: "", ru: "" },
          isActive: data.isActive ?? true,
          order: data.order ?? 0,
          tags: data.tags || { az: [], ru: [] },
        });
        setInitialData(data);
      } catch (e) {
        console.error(e);
        toast.error("Vakansiya yüklənə bilmədi");
        router.push("/dashboard/vacancies");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id, reset, router]);

  const onSubmit = async (data: VacancyFormPayload) => {
    try {
      const body: Record<string, unknown> = {
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        workConditions: data.workConditions,
        slug: {
          az: data.slug.az.trim(),
          ru: data.slug.ru.trim(),
        },
        isActive: data.isActive,
        order: Number.isFinite(data.order) ? data.order : 0,
        tags: data.tags,
        deadline: deadlineToApi(data.deadline),
        employmentType: data.employmentType?.trim() || null,
        experienceLevel: data.experienceLevel?.trim() || null,
      };
      const res = await api.patch(`/vacancies/manage/${params.id}`, body);
      if (res.status === 200) {
        toast.success("Yeniləndi");
        router.push("/dashboard/vacancies");
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
    <VacancyForm
      mode="edit"
      onSubmit={onSubmit}
      register={register}
      control={control}
      errors={errors}
      isSubmitting={isSubmitting}
      handleSubmit={handleSubmit}
      router={router}
      setValue={setValue}
      initialValues={initialData}
    />
  );
}
