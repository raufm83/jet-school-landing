"use client";
import { Role } from "@/types/enums";
import api from "@/utils/api/axios";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import UsersForm from "@/components/views/dashboard/users/users-form";

const defaultNameI18n = { az: "", ru: "" };

interface CreateUserFormInputs {
  name: string;
  firstName?: { az?: string; ru?: string };
  lastName?: { az?: string; ru?: string };
  email: string;
  password: string;
  role: Role;
  profession?: { az?: string; ru?: string };
  avatarUrl?: string;
  avatarFile?: File;
}

export default function CreateUserPage() {
  const router = useRouter();
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormInputs>({
    defaultValues: {
      name: "",
      firstName: defaultNameI18n,
      lastName: defaultNameI18n,
      email: "",
      password: "",
      role: Role.USER,
      profession: defaultNameI18n,
    },
  });

  const onSubmit = async (data: CreateUserFormInputs) => {
    try {
      let avatarUrl = data.avatarUrl || "";
      if (data.avatarFile instanceof File) {
        const formData = new FormData();
        formData.append("avatar", data.avatarFile);
        const { data: uploadRes } = await api.post<{ url: string }>(
          "/auth/upload-avatar",
          formData,
          { headers: { "Content-Type": undefined as unknown as string } }
        );
        avatarUrl = uploadRes?.url || "";
      }
      const isAuthor = data.role === Role.AUTHOR;
      const firstAz = data.firstName?.az?.trim() ?? "";
      const firstRu = data.firstName?.ru?.trim() ?? "";
      const lastAz = data.lastName?.az?.trim() ?? "";
      const lastRu = data.lastName?.ru?.trim() ?? "";
      const name = isAuthor && (firstAz || firstRu || lastAz || lastRu)
        ? `${firstAz || firstRu || ""} ${lastAz || lastRu || ""}`.trim()
        : data.name;
      const payload: Record<string, unknown> = {
        name,
        email: data.email,
        password: data.password,
        role: data.role,
        ...(avatarUrl && { avatarUrl }),
      };
      if (isAuthor) {
        if (firstAz || firstRu) payload.firstName = { az: firstAz, ru: firstRu };
        if (lastAz || lastRu) payload.lastName = { az: lastAz, ru: lastRu };
        const profAz = data.profession?.az?.trim() ?? "";
        const profRu = data.profession?.ru?.trim() ?? "";
        if (profAz || profRu) payload.profession = { az: profAz, ru: profRu };
      }
      const response = await api.post("/auth/register", payload);

      if (response.status === 201) {
        toast.success("İstifadəçi uğurla yaradıldı");
        router.push("/dashboard/users");
        router.refresh();
      }
    } catch (error: any) {
      console.error("İstifadəçi yaradılması uğursuz oldu:", error);
      toast.error(
        error.response?.data?.message || "Xəta baş verdi. Yenidən cəhd edin"
      );
    }
  };

  return (
    <UsersForm
      mode="create"
      onSubmit={onSubmit}
      register={register}
      control={control}
      errors={errors}
      isSubmitting={isSubmitting}
      handleSubmit={handleSubmit}
      router={router}
      setValue={setValue as (name: string, value: unknown) => void}
    />
  );
}
