"use client";
import ProjectForm from "@/components/views/dashboard/student-projects/project-form";
import { ProjectFormInputs } from "@/types/student-projects";
import api from "@/utils/api/axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

export default function EditProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [originalData, setOriginalData] = useState<ProjectFormInputs | null>(
    null
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormInputs>();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data } = await api.get(`/student-projects/${params.id}`);
        
        let initialCategoryId = data.category?.id || data.categoryId;

        // Fetch courses to find matching course by name for the dropdown
        try {
          const coursesRes = await api.get("/courses?limit=100");
          const courses = coursesRes.data?.items || [];
          const categoryName = data.category?.name;
          
          if (categoryName) {
            const matchedCourse = courses.find((c: any) => 
              (c.title?.az && c.title.az.toLowerCase() === categoryName.toLowerCase()) ||
              (c.title?.ru && c.title.ru.toLowerCase() === categoryName.toLowerCase()) ||
              (c.name && c.name.toLowerCase() === categoryName.toLowerCase())
            );
            
            if (matchedCourse) {
              initialCategoryId = matchedCourse.id;
            }
          }
        } catch (e) {
          console.error("Kursları yükləmə xətası:", e);
        }

        const formData = {
          ...data,
          categoryId: initialCategoryId,
        };
        setOriginalData(formData);
        reset(formData);
      } catch (error) {
        console.error("Layihə məlumatlarını yükləmə xətası:", error);
        toast.error("Layihə məlumatları yüklənə bilmədi");
        router.push("/dashboard/student-projects");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [params.id, reset, router]);

  const onSubmit = async (formData: ProjectFormInputs) => {
    try {
      const changedData = getChangedFields(originalData, formData);

   
      if (Object.keys(changedData).length === 0) {
        toast.info("Heç bir dəyişiklik edilmədi");
        router.push("/dashboard/student-projects");
        return;
      }

      if (changedData.categoryId) {
        const coursesRes = await api.get("/courses?limit=100");
        const courses = coursesRes.data?.items || [];
        changedData.categoryId = await ensureCategoryId(changedData.categoryId, courses);
      }

      const response = await api.patch(
        `/student-projects/${params.id}`,
        changedData
      );

      if (response.status === 200) {
        toast.success("Layihə uğurla yeniləndi");
        router.push("/dashboard/student-projects");
        router.refresh();
      }
    } catch (error: any) {
      console.error("Yeniləmə xətası:", error);
      toast.error(
        error.response?.data?.message || "Xəta baş verdi. Yenidən cəhd edin"
      );
    }
  };

  const getChangedFields = (
    original: any,
    updated: any
  ): Partial<ProjectFormInputs> => {
    if (!original) return updated;

    const changes: Partial<ProjectFormInputs> = {};

    if (
      original.title?.az !== updated.title?.az ||
      original.title?.ru !== updated.title?.ru
    ) {
      changes.title = { ...updated.title };
    }

    if (
      original.description?.az !== updated.description?.az ||
      original.description?.ru !== updated.description?.ru
    ) {
      changes.description = { ...updated.description };
    }

    // Compare link
    if (original.link !== updated.link) {
      changes.link = updated.link;
    }

    // Compare category
    if (original.categoryId !== updated.categoryId) {
      changes.categoryId = updated.categoryId;
    }

    return changes;
  };

  if (isLoading) {
    return (
      <div className="p-6 min-h-screen w-full flex items-center justify-center">
        <p>Yüklənir...</p>
      </div>
    );
  }

  return (
    <ProjectForm
      mode="edit"
      initialValues={originalData as ProjectFormInputs}
      onSubmit={onSubmit}
      register={register}
      errors={errors}
      isSubmitting={isSubmitting}
      handleSubmit={handleSubmit}
      router={router}
    />
  );
}
