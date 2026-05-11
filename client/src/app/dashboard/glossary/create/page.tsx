"use client";
import GlossaryForm from "@/components/views/dashboard/glossary/glossary-form";
import api from "@/utils/api/axios";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Role } from "@/types/enums";

interface GlossaryFormInputs {
  term: {
    az: string;
    ru: string;
  };
  definition: {
    az: string;
    ru: string;
  };
  slug: {
    az: string;
    ru: string;
  };
  categoryId?: string;
  relatedTerms: string[];
  published: boolean;
}

export default function CreateGlossaryTermPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAuthor = session?.user?.role === Role.AUTHOR;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    getValues,
    watch,
  } = useForm<GlossaryFormInputs>({
    defaultValues: {
      published: false,
      relatedTerms: [],
      definition: {
        az: "",
        ru: "",
      },
    },
  });

  register("relatedTerms");
  register("definition.az", { required: "Tərif (AZ) tələb olunur" });
  register("definition.ru", { required: "Определение (RU) обязательно" });
  register("published");

  const onSubmit = async (data: GlossaryFormInputs) => {
    try {
      const formData = {
        ...data,
        // Author üçün avtomatik dərc olunsun
        published: isAuthor ? true : data.published,
        relatedTerms: Array.isArray(data.relatedTerms) ? data.relatedTerms : [],
      };

      const response = await api.post("/glossary", formData);

      if (response.status === 201) {
        toast.success("Termin uğurla yaradıldı");
        router.push("/dashboard/glossary");
        router.refresh();
      }
    } catch (error: any) {
      console.error("Yaradılma xətası:", error);
      toast.error(
        error.response?.data?.message || "Xəta baş verdi. Yenidən cəhd edin"
      );
    }
  };

  return (
    <GlossaryForm
      mode="create"
      onSubmit={onSubmit}
      register={register}
      errors={errors}
      isSubmitting={isSubmitting}
      handleSubmit={handleSubmit}
      router={router}
      setValue={setValue}
      getValues={getValues}
      watch={watch}
      isAuthor={isAuthor}
    />
  );
}
