"use client";

import { FaqFormPayload } from "@/types/faq";
import {
  Button,
  Card,
  CardBody,
  Checkbox,
  Input,
  Textarea,
} from "@nextui-org/react";
import {
  UseFormRegister,
  FieldErrors,
  UseFormHandleSubmit,
} from "react-hook-form";
import { MdArrowBack } from "react-icons/md";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import api from "@/utils/api/axios";
import { useEffect, useRef, useState } from "react";

const STATIC_PAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "home", label: "Ana Səhifə" },
  { value: "about", label: "Haqqımızda" },
  { value: "courses", label: "Kurslar" },
];

interface CourseOption {
  id: string;
  title: { az: string; ru: string };
  slug: { az: string; ru: string };
}

function safeText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

async function fetchAllCoursesForFaq(): Promise<CourseOption[]> {
  const limit = 100;
  let page = 1;
  const all: CourseOption[] = [];
  let totalPages = 1;
  do {
    const { data } = await api.get<{
      items?: CourseOption[];
      meta?: { totalPages?: number };
    }>(`/courses?limit=${limit}&page=${page}&includeUnpublished=true`);
    const items = data?.items ?? [];
    all.push(...items);
    totalPages = data?.meta?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages && totalPages > 0);
  return all;
}

interface FaqFormProps {
  mode: "create" | "edit";
  onSubmit: (data: FaqFormPayload) => Promise<void>;
  register: UseFormRegister<FaqFormPayload>;
  errors: FieldErrors<FaqFormPayload>;
  isSubmitting: boolean;
  handleSubmit: UseFormHandleSubmit<FaqFormPayload>;
  router: AppRouterInstance;
  selectedPages: string[];
  onSelectedPagesChange: (pages: string[]) => void;
}

export default function FaqForm({
  mode,
  onSubmit,
  register,
  errors,
  isSubmitting,
  handleSubmit,
  router,
  selectedPages,
  onSelectedPagesChange,
}: FaqFormProps) {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const coursesFetchGen = useRef(0);

  useEffect(() => {
    const gen = ++coursesFetchGen.current;
    setCoursesError(null);
    setCoursesLoading(true);
    fetchAllCoursesForFaq()
      .then((items) => {
        if (gen !== coursesFetchGen.current) return;
        setCourses(items);
        if (items.length === 0) {
          setCoursesError("Heç bir kurs tapılmadı.");
        }
      })
      .catch(() => {
        if (gen !== coursesFetchGen.current) return;
        setCoursesError("Kurslar yüklənə bilmədi.");
        setCourses([]);
      })
      .finally(() => {
        if (gen === coursesFetchGen.current) {
          setCoursesLoading(false);
        }
      });
  }, []);

  const togglePage = (key: string, checked: boolean) => {
    const set = new Set(selectedPages);
    if (checked) set.add(key);
    else set.delete(key);
    onSelectedPagesChange([...set]);
  };

  return (
    <div className="p-6 w-full max-w-4xl mx-auto">
      <Button
        variant="light"
        className="mb-4"
        startContent={<MdArrowBack />}
        onPress={() => router.push("/dashboard/faq")}
      >
        Geri
      </Button>

      <Card>
        <CardBody className="gap-6 p-6">
          <div>
            <h1 className="text-2xl font-bold">
              {mode === "create" ? "Yeni FAQ" : "FAQ redaktə"}
            </h1>
            <p className="text-gray-500 text-sm">
              Sual və cavab hər iki dil üçün doldurulmalıdır. Hansı səhifələrdə
              görünsün — aşağıdan bir və ya bir neçə işarələyin (statik və/və ya
              kurs single).
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-default-200/80 bg-gradient-to-b from-default-50/80 to-white p-5 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-default-500">
                Statik səhifələr
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STATIC_PAGE_OPTIONS.map((opt) => (
                  <Checkbox
                    key={opt.value}
                    isSelected={selectedPages.includes(opt.value)}
                    onValueChange={(v) => togglePage(opt.value, v)}
                  >
                    {opt.label}
                  </Checkbox>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-default-200/80 bg-gradient-to-b from-default-50/80 to-white p-5 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-default-500">
                Dinamik — kurs single səhifəsi
              </h3>
              {coursesLoading ? (
                <p className="text-sm text-default-500">Kurslar yüklənir...</p>
              ) : coursesError ? (
                <p className="text-sm text-danger">{coursesError}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {courses.map((c) => {
                    const slug =
                      String(c.slug?.az ?? c.id ?? "").trim() || String(c.id);
                    const key = `course:${slug}`;
                    const titleAz = safeText(c.title?.az) || "Adsız kurs";
                    const titleRu = safeText(c.title?.ru);
                    const line = titleRu ? `${titleAz} · ${titleRu}` : titleAz;
                    return (
                      <Checkbox
                        key={c.id}
                        isSelected={selectedPages.includes(key)}
                        onValueChange={(v) => togglePage(key, v)}
                      >
                        {line}
                      </Checkbox>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Textarea
                label="Sual (AZ)"
                placeholder="Azərbaycan dilində sual"
                minRows={2}
                {...register("question.az", { required: "Məcburidir" })}
                errorMessage={errors.question?.az?.message as string}
                isInvalid={!!errors.question?.az}
              />
              <Textarea
                label="Sual (RU)"
                placeholder="Вопрос на русском"
                minRows={2}
                {...register("question.ru", { required: "Məcburidir" })}
                errorMessage={errors.question?.ru?.message as string}
                isInvalid={!!errors.question?.ru}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Textarea
                label="Cavab (AZ)"
                placeholder="Azərbaycan dilində cavab"
                minRows={5}
                {...register("answer.az", { required: "Məcburidir" })}
                errorMessage={errors.answer?.az?.message as string}
                isInvalid={!!errors.answer?.az}
              />
              <Textarea
                label="Cavab (RU)"
                placeholder="Ответ на русском"
                minRows={5}
                {...register("answer.ru", { required: "Məcburidir" })}
                errorMessage={errors.answer?.ru?.message as string}
                isInvalid={!!errors.answer?.ru}
              />
            </div>

            <Input
              type="number"
              label="Sıra (order)"
              placeholder="0"
              {...register("order", { valueAsNumber: true })}
              description="Kiçik rəqəm siyahıda əvvəl görünür."
            />

            <div className="flex gap-3 justify-end">
              <Button variant="bordered" onPress={() => router.push("/dashboard/faq")}>
                Ləğv et
              </Button>
              <Button
                type="submit"
                className="bg-jsyellow text-white"
                isLoading={isSubmitting}
              >
                {mode === "create" ? "Yarat" : "Yadda saxla"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
