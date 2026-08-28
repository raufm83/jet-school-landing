"use client";
import ProjectForm from "@/components/views/dashboard/student-projects/project-form";
import { ProjectFormInputs } from "@/types/student-projects";
import api from "@/utils/api/axios";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const ensureCategoryId = async (
  categoryId: string,
  categories?: any[]
) => {
  if (!categoryId) return categoryId;

  const categoryName = categories?.find((c: any) => c.id === categoryId)?.title?.az || 
                       categories?.find((c: any) => c.id === categoryId)?.title?.ru || 
                       categories?.find((c: any) => c.id === categoryId)?.name;

  if (!categoryName) return categoryId;

  try {
    const { data } = await api.get("/student-project-categories");
    const existingCategory = data.items?.find(
      (c: any) => c.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (existingCategory) {
      return existingCategory.id;
    }

    const { data: newCategory } = await api.post(
      "/student-project-categories",
      {
        name: categoryName,
      }
    );
    return newCategory.id;
  } catch (error) {
    console.error("Kateqoriya xətası:", error);
    return categoryId; // fallback to sending the original id
  }
};

export default function CreateProjectPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormInputs>();

  const onSubmit = async (data: ProjectFormInputs) => {
    try {
      // Create project categories dynamically matching the course names
      const coursesRes = await api.get("/courses?limit=100");
      const courses = coursesRes.data?.items || [];
      const realCategoryId = await ensureCategoryId(data.categoryId || "", courses);
      
      const payload = { ...data, categoryId: realCategoryId };

      const response = await api.post("/student-projects", payload);

      if (response.status === 201) {
        toast.success("Layihə uğurla yaradıldı");
        router.push("/dashboard/student-projects");
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
    <ProjectForm
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
