"use client";
import ModuleForm from "@/components/views/dashboard/modules/module-form";
import { ModuleFormInputs } from "@/types/course";
import api from "@/utils/api/axios";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";

interface CourseOption {
  id: string;
  title: { az: string; ru: string };
}

export default function CreateModulePage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      content: [{ az: "", ru: "", order: 1, isActive: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "content",
  });

  const fetchCourses = useCallback(async () => {
    try {
      setCoursesLoading(true);
      const { data } = await api.get(
        "/courses?page=1&limit=100&includeUnpublished=true"
      );
      setCourses(Array.isArray(data?.items) ? data.items : []);
    } catch {
      toast.error("Kurslar yüklənə bilmədi");
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const onSubmit = async (data: ModuleFormInputs) => {
    try {
      const response = await api.post("/course-modules", data);
      if (response.status === 201) {
        const moduleId: string = response.data.id;

        if (selectedCourseIds.length > 0) {
          const results = await Promise.allSettled(
            selectedCourseIds.map((courseId, i) =>
              api.post(`/course-modules/assign/${courseId}`, {
                moduleId,
                order: i,
              })
            )
          );
          const failed = results.filter((r) => r.status === "rejected").length;
          if (failed > 0) {
            toast.warning(
              `Modul yaradıldı, lakin ${failed} kursa əlavə edilə bilmədi`
            );
          } else {
            toast.success("Modul uğurla yaradıldı və kurslara əlavə edildi");
          }
        } else {
          toast.success("Modul uğurla yaradıldı");
        }

        router.push("/dashboard/modules");
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Xəta baş verdi");
    }
  };

  return (
    <ModuleForm
      mode="create"
      onSubmit={onSubmit}
      register={register}
      errors={errors}
      isSubmitting={isSubmitting}
      handleSubmit={handleSubmit}
      router={router}
      fields={fields}
      append={append}
      remove={remove}
      courses={courses}
      selectedCourseIds={selectedCourseIds}
      onCourseToggle={handleCourseToggle}
      coursesLoading={coursesLoading}
    />
  );
}
