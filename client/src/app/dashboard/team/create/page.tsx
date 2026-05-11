"use client";

import TeamMemberForm from "@/components/views/dashboard/team/team-member-form";
import { TeamMemberFormInputs } from "@/types/team";
import api from "@/utils/api/axios";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function CreateTeamMemberPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TeamMemberFormInputs>();

  const onSubmit = async (data: TeamMemberFormInputs) => {
    try {
      const formData = new FormData();
      formData.append("name[az]", data.name.az);
      formData.append("name[ru]", data.name.ru);
      formData.append("surname[az]", data.surname.az);
      formData.append("surname[ru]", data.surname.ru);
      formData.append(
        "bio",
        JSON.stringify({
          az: data.bio.az,
          ru: data.bio.ru,
        })
      );
      if (data.image) {
        const file = data.image instanceof File ? data.image : data.image[0];
        if (file) formData.append("image", file);
      }

      const response = await api.post("/team", formData);

      if (response.status === 201) {
        toast.success("Komanda üzvü uğurla əlavə edildi");
        router.push("/dashboard/team");
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
    <TeamMemberForm
      mode="create"
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
