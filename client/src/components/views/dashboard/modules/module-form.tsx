"use client";
import { ModuleFormInputs } from "@/types/course";
import { Button, Card, Checkbox, Input, Spinner, Textarea } from "@nextui-org/react";
import { motion } from "framer-motion";
import { MdAdd, MdDelete, MdDescription, MdTitle } from "react-icons/md";

interface CourseOption {
  id: string;
  title: { az: string; ru: string };
}

interface ModuleFormProps {
  mode: "create" | "edit";
  onSubmit: (data: ModuleFormInputs) => Promise<void>;
  register: any;
  errors: any;
  isSubmitting: boolean;
  handleSubmit: any;
  router: any;
  fields: any;
  append: any;
  remove: any;
  courses?: CourseOption[];
  selectedCourseIds?: string[];
  onCourseToggle?: (courseId: string) => void;
  coursesLoading?: boolean;
}

export default function ModuleForm({
  mode,
  onSubmit,
  register,
  errors,
  isSubmitting,
  handleSubmit,
  router,
  fields,
  append,
  remove,
  courses,
  selectedCourseIds = [],
  onCourseToggle,
  coursesLoading,
}: ModuleFormProps) {
  return (
    <div className="p-6 min-h-screen w-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <Card className="w-full max-w-2xl p-6 bg-white shadow-lg mx-auto">
          <div className="text-center mb-8">
            <motion.h1
              className="text-2xl font-bold text-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {mode === "create" ? "Yeni Modul Yarat" : "Modula Düzəliş Et"}
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
                })}
                isInvalid={!!errors.title?.az}
                errorMessage={errors.title?.az?.message}
                classNames={{
                  input: "bg-transparent",
                  inputWrapper: [
                    "bg-white border-2 hover:border-primary focus:border-primary",
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
                })}
                isInvalid={!!errors.title?.ru}
                errorMessage={errors.title?.ru?.message}
                classNames={{
                  input: "bg-transparent",
                  inputWrapper: [
                    "bg-white border-2 hover:border-primary focus:border-primary",
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
                {...register("description.az")}
                isInvalid={!!errors.description?.az}
                errorMessage={errors.description?.az?.message}
                classNames={{
                  input: "bg-transparent",
                  inputWrapper: [
                    "bg-white border-2 hover:border-primary focus:border-primary",
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
                {...register("description.ru")}
                isInvalid={!!errors.description?.ru}
                errorMessage={errors.description?.ru?.message}
                classNames={{
                  input: "bg-transparent",
                  inputWrapper: [
                    "bg-white border-2 hover:border-primary focus:border-primary",
                  ],
                }}
              />
            </div>

            <div className="space-y-4">
              {fields.map((field: any, index: number) => (
                <Card key={field.id} className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">Kontent {index + 1}</p>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 accent-jsyellow"
                          disabled={isSubmitting}
                          {...register(`content.${index}.isActive`)}
                        />
                        Aktiv
                      </label>
                      <Button
                        isIconOnly
                        color="danger"
                        variant="light"
                        onClick={() => remove(index)}
                      >
                        <MdDelete size={20} />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Input
                      label="Kontentin adı (AZ)"
                      {...register(`content.${index}.az`)}
                      isInvalid={!!errors.content?.[index]?.az}
                      errorMessage={errors.content?.[index]?.az?.message}
                    />
                    <Input
                      label="Название контента (RU)"
                      {...register(`content.${index}.ru`)}
                      isInvalid={!!errors.content?.[index]?.ru}
                      errorMessage={errors.content?.[index]?.ru?.message}
                    />
                    <Input
                      type="number"
                      label="Sıra"
                      {...register(`content.${index}.order`)}
                      isInvalid={!!errors.content?.[index]?.order}
                      errorMessage={errors.content?.[index]?.order?.message}
                    />
                  </div>
                </Card>
              ))}
              <Button
                type="button"
                variant="bordered"
                startContent={<MdAdd />}
                onClick={() =>
                  append({ az: "", ru: "", order: fields.length + 1, isActive: true })
                }
              >
                Kontent əlavə et
              </Button>
            </div>

            {/* Kurs Assignment bölməsi */}
            {courses !== undefined && (
              <div className="space-y-2 pt-2">
                <p className="font-semibold text-sm text-gray-700">
                  Kurslara əlavə et
                </p>
                {coursesLoading ? (
                  <div className="flex items-center gap-2 py-2">
                    <Spinner size="sm" color="warning" />
                    <span className="text-sm text-gray-400">Kurslar yüklənir...</span>
                  </div>
                ) : courses.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">Kurs tapılmadı</p>
                ) : (
                  <div className="border rounded-xl p-3 space-y-2 max-h-52 overflow-y-auto">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center gap-3 p-1 rounded-lg hover:bg-default-50"
                      >
                        <Checkbox
                          isSelected={selectedCourseIds.includes(course.id)}
                          onValueChange={() => onCourseToggle?.(course.id)}
                          isDisabled={isSubmitting}
                        />
                        <div>
                          <p className="text-sm font-medium">{course.title.az}</p>
                          <p className="text-xs text-default-400">{course.title.ru}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                disabled={isSubmitting}
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
