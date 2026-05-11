"use client";

import VacancyForm from "@/components/views/dashboard/vacancy/vacancy-form";
import type { VacancyFormPayload } from "@/types/vacancy";
import api from "@/utils/api/axios";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const defaults: VacancyFormPayload = {
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
};

function deadlineToApi(raw: string): string | null {
  const t = raw?.trim();
  if (!t) return null;
  return `${t}T12:00:00.000Z`;
}

export default function CreateVacancyPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<VacancyFormPayload>({ defaultValues: defaults });

  const onSubmit = async (data: VacancyFormPayload) => {
    try {
      const body: Record<string, unknown> = {
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        workConditions: data.workConditions,
        isActive: data.isActive,
        order: Number.isFinite(data.order) ? data.order : 0,
        tags: data.tags,
        deadline: deadlineToApi(data.deadline),
        employmentType: data.employmentType?.trim() || null,
        experienceLevel: data.experienceLevel?.trim() || null,
      };
      if (data.slug.az.trim() || data.slug.ru.trim()) {
        body.slug = {
          az: data.slug.az.trim(),
          ru: data.slug.ru.trim(),
        };
      }
      const res = await api.post("/vacancies", body);
      if (res.status === 201) {
        toast.success("Vakansiya yaradıldı");
        router.push("/dashboard/vacancies");
        router.refresh();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Xəta baş verdi");
    }
  };

  return (
    <VacancyForm
      mode="create"
      onSubmit={onSubmit}
      register={register}
      control={control}
      errors={errors}
      isSubmitting={isSubmitting}
      handleSubmit={handleSubmit}
      router={router}
      setValue={setValue}
    />
  );
}
