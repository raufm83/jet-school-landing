"use client";

import api from "@/utils/api/axios";
import {
  Button,
  Card,
  Input,
  Select,
  SelectItem,
  Textarea,
} from "@nextui-org/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MdCategory, MdDescription, MdLink, MdTitle } from "react-icons/md";

interface CourseItem {
  id: string;
  title: { az: string; ru: string };
}

export default function ReviewForm({
  mode,
  onSubmit,
  register,
  errors,
  isSubmitting,
  handleSubmit,
  router,
}: {
  mode: "create" | "edit";
  onSubmit: (data: any) => void;
  register: any;
  errors: any;
  isSubmitting: boolean;
  handleSubmit: any;
  router: any;
}) {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await api.get("/courses?limit=500&includeUnpublished=true");
        setCourses(data.items ?? []);
      } catch {
        console.error("Error fetching courses");
      } finally {
        setIsLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="p-6 min-h-screen w-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <Card className="w-full max-w-xl p-6 bg-white shadow-lg mx-auto">
          <div className="text-center mb-8">
            <motion.h1
              className="text-2xl font-bold text-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {mode === "create"
                ? "Yeni Rəy Yarat"
                : "Rəyə Düzəliş Et"}
            </motion.h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                label="Başlıq (AZ)"
                variant="bordered"
                startContent={<MdTitle className="text-gray-400" />}
                isDisabled={isSubmitting}
                {...register("title.az", {
                  required: "Başlıq tələb olunur",
                  minLength: { value: 2, message: "Ən azı 2 simvol" },
                })}
                isInvalid={!!errors.title?.az}
                errorMessage={errors.title?.az?.message}
                classNames={{
                  input: "bg-transparent",
                  inputWrapper: [
                    "bg-white border-2 hover:border-jsyellow focus:border-jsyellow",
                  ],
                }}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="text"
                label="Заголовок (RU)"
                variant="bordered"
                startContent={<MdTitle className="text-gray-400" />}
                isDisabled={isSubmitting}
                {...register("title.ru", {
                  required: "Заголовок обязателен",
                  minLength: { value: 2, message: "Минимум 2 символа" },
                })}
                isInvalid={!!errors.title?.ru}
                errorMessage={errors.title?.ru?.message}
                classNames={{
                  input: "bg-transparent",
                  inputWrapper: [
                    "bg-white border-2 hover:border-jsyellow focus:border-jsyellow",
                  ],
                }}
              />
            </div>

            <div className="space-y-2">
              <Textarea
                label="Təsvir (AZ)"
                variant="bordered"
                startContent={<MdDescription className="text-gray-400" />}
                isDisabled={isSubmitting}
                {...register("description.az", { required: "Təsvir tələb olunur" })}
                isInvalid={!!errors.description?.az}
                errorMessage={errors.description?.az?.message}
                classNames={{
                  input: "bg-transparent",
                  inputWrapper: [
                    "bg-white border-2 hover:border-jsyellow focus:border-jsyellow",
                  ],
                }}
              />
            </div>
            <div className="space-y-2">
              <Textarea
                label="Описание (RU)"
                variant="bordered"
                startContent={<MdDescription className="text-gray-400" />}
                isDisabled={isSubmitting}
                {...register("description.ru", { required: "Описание обязательно" })}
                isInvalid={!!errors.description?.ru}
                errorMessage={errors.description?.ru?.message}
                classNames={{
                  input: "bg-transparent",
                  inputWrapper: [
                    "bg-white border-2 hover:border-jsyellow focus:border-jsyellow",
                  ],
                }}
              />
            </div>

            <div className="space-y-2">
              <Select
                label="Kurs"
                variant="bordered"
                startContent={<MdCategory className="text-gray-400" />}
                isDisabled={isSubmitting || isLoadingCourses}
                {...register("courseId")}
                isInvalid={!!errors.courseId}
                errorMessage={errors.courseId?.message}
                classNames={{
                  trigger:
                    "bg-white border-2 hover:border-jsyellow focus:border-jsyellow",
                  value: "bg-transparent",
                }}
                isLoading={isLoadingCourses}
              >
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {(course.title as { az?: string; ru?: string })?.az ||
                      (course.title as { az?: string; ru?: string })?.ru ||
                      course.id}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Input
                type="url"
                label="Youtube Linki"
                variant="bordered"
                startContent={<MdLink className="text-gray-400" />}
                isDisabled={isSubmitting}
                {...register("link", {
                  required: "Youtube linki tələb olunur",
                  pattern: {
                    value: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
                    message: "Düzgün Youtube linki daxil edin",
                  },
                })}
                isInvalid={!!errors.link}
                errorMessage={errors.link?.message}
                classNames={{
                  input: "bg-transparent",
                  inputWrapper: [
                    "bg-white border-2 hover:border-jsyellow focus:border-jsyellow",
                  ],
                }}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                onClick={() => router.back()}
                variant="light"
                className="text-gray-600"
                size="lg"
              >
                Ləğv et
              </Button>
              <Button
                type="submit"
                className="bg-jsyellow text-white hover:bg-jsyellow/90 disabled:opacity-50"
                size="lg"
                isLoading={isSubmitting}
                disabled={isSubmitting || isLoadingCourses}
              >
                {mode === "create"
                  ? isSubmitting
                    ? "Yaradılır..."
                    : "Yarat"
                  : isSubmitting
                  ? "Yenilənir..."
                  : "Yenilə"}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
