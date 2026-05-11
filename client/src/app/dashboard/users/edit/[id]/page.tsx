"use client";
import UsersForm from "@/components/views/dashboard/users/users-form";
import { Role } from "@/types/enums";
import api from "@/utils/api/axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const defaultNameI18n = { az: "", ru: "" };

interface UpdateUserFormInputs {
  name: string;
  firstName?: { az?: string; ru?: string };
  lastName?: { az?: string; ru?: string };
  email: string;
  password?: string;
  role: Role;
  profession?: { az?: string; ru?: string };
  avatarUrl?: string;
  avatarFile?: File;
}

function normI18n(
  v: string | { az?: string; ru?: string } | null | undefined
): { az: string; ru: string } {
  if (v == null) return defaultNameI18n;
  if (typeof v === "string")
    return { az: v.trim(), ru: "" };
  return {
    az: (v.az ?? "").trim(),
    ru: (v.ru ?? "").trim(),
  };
}

export default function EditUserPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserFormInputs>();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get(`/users/${params.id}`);
        const prof = data.profile?.profession;
        const professionI18n =
          prof != null && typeof prof === "object"
            ? { az: (prof as { az?: string }).az ?? "", ru: (prof as { ru?: string }).ru ?? "" }
            : { az: typeof prof === "string" ? prof : "", ru: "" };

        reset({
          name: data.name,
          firstName: normI18n(data.firstName),
          lastName: normI18n(data.lastName),
          email: data.email,
          role: data.role,
          profession: professionI18n,
          avatarUrl: data.profile?.avatarUrl ?? "",
        });
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("İstifadəçi məlumatları yüklənmədi");
        router.push("/dashboard/users");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [params.id, reset, router]);

  const onSubmit = async (data: UpdateUserFormInputs) => {
    try {
      let avatarUrl = data.avatarUrl ?? "";
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
      const name =
        isAuthor && (firstAz || firstRu || lastAz || lastRu)
          ? `${firstAz || firstRu || ""} ${lastAz || lastRu || ""}`.trim()
          : data.name;
      const payload: Record<string, unknown> = {
        name,
        email: data.email,
        role: data.role,
        ...(avatarUrl !== undefined && { avatarUrl }),
      };
      if (isAuthor) {
        if (firstAz || firstRu) payload.firstName = { az: firstAz, ru: firstRu };
        if (lastAz || lastRu) payload.lastName = { az: lastAz, ru: lastRu };
        const profAz = data.profession?.az?.trim() ?? "";
        const profRu = data.profession?.ru?.trim() ?? "";
        if (profAz || profRu) payload.profession = { az: profAz, ru: profRu };
      }
      if (data.password?.trim()) {
        payload.password = data.password;
      }
      const response = await api.patch(`/users/${params.id}`, payload);

      if (response.status === 200) {
        toast.success("İstifadəçi məlumatları yeniləndi");
        router.push("/dashboard/users");
        router.refresh();
      }
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(
        error.response?.data?.message || "Xəta baş verdi. Yenidən cəhd edin"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 min-h-screen w-full flex items-center justify-center">
        <p>Yüklənir...</p>
      </div>
    );
  }

  return (
    <UsersForm
      mode="edit"
      onSubmit={onSubmit}
      register={register}
      control={control}
      errors={errors}
      isSubmitting={isSubmitting}
      handleSubmit={handleSubmit}
      router={router}
      setValue={setValue as (name: string, value: unknown) => void}
      showPasswordField={session?.user?.role === Role.ADMIN}
    />
  );
}
