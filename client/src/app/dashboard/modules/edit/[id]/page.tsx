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

export default function EditModulePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [assignedCourseIds, setAssignedCourseIds] = useState<string[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

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
    const fetchModule = async () => {
      try {
        const { data } = await api.get(`/course-modules/${params.id}`);

        // Mövcud kurs assignmentlərini çıxar
        const currentCourseIds: string[] = Array.isArray(data?.courses)
          ? data.courses
              .map((c: any) => c.courseId ?? c.course?.id)
              .filter(Boolean)
          : [];
        setAssignedCourseIds(currentCourseIds);

        reset({
          ...data,
          id: undefined,
          courses: undefined,
          content: Array.isArray(data?.content)
            ? data.content.map((item: any) => ({
                ...item,
                isActive: item?.isActive !== false,
              }))
            : [],
        });
      } catch (error) {
        console.error("Modul məlumatları yüklənmədi:", error);
        toast.error("Modul məlumatları yüklənə bilmədi");
        router.push("/dashboard/modules");
      } finally {
        setIsLoading(false);
      }
    };

    fetchModule();
    fetchCourses();
  }, [params.id, reset, router, fetchCourses]);

  const handleCourseToggle = async (courseId: string) => {
    if (toggling) return;
    const isAssigned = assignedCourseIds.includes(courseId);
    setToggling(courseId);
    try {
      if (isAssigned) {
        await api.delete(`/course-modules/assign/${courseId}/${params.id}`);
        setAssignedCourseIds((prev) => prev.filter((id) => id !== courseId));
        toast.success("Kursdan çıxarıldı");
      } else {
        await api.post(`/course-modules/assign/${courseId}`, {
          moduleId: params.id,
          order: assignedCourseIds.length,
        });
        setAssignedCourseIds((prev) => [...prev, courseId]);
        toast.success("Kursa əlavə edildi");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Əməliyyat uğursuz oldu");
    } finally {
      setToggling(null);
    }
  };

  const onSubmit = async (data: ModuleFormInputs) => {
    try {
      const response = await api.patch(`/course-modules/${params.id}`, data);
      if (response.status === 200) {
        toast.success("Modul uğurla yeniləndi");
        router.push("/dashboard/modules");
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Xəta baş verdi");
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
    <ModuleForm
      mode="edit"
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
      selectedCourseIds={assignedCourseIds}
      onCourseToggle={handleCourseToggle}
      coursesLoading={coursesLoading}
    />
  );
}
