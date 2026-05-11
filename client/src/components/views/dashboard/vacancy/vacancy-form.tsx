"use client";

import { useEffect, useState } from "react";
import type { VacancyFormPayload } from "@/types/vacancy";
import {
  Button,
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Switch,
  Chip,
} from "@nextui-org/react";
import {
  UseFormRegister,
  FieldErrors,
  UseFormHandleSubmit,
  Controller,
  Control,
} from "react-hook-form";
import { MdArrowBack, MdTag } from "react-icons/md";
import { toast } from "sonner";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="h-48 w-full rounded-md border border-default-200 bg-default-50 flex items-center justify-center text-default-500 text-sm">
      Editor yüklənir...
    </div>
  ),
});

const quillToolbar = [
  [{ header: [1, 2, 3, 4, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ color: [] }, { background: [] }],
  ["link"],
  ["clean"],
];

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "link",
  "color",
  "background",
];

const EMPLOYMENT_OPTIONS = [
  { value: "FULL_TIME", label: "Full time" },
  { value: "PART_TIME", label: "Half time" },
  { value: "REMOTE", label: "Remote" },
  { value: "FREELANCE", label: "Freelance" },
];

const EXPERIENCE_OPTIONS = [
  { value: "NONE", label: "Tələb olunmur" },
  { value: "Y1", label: "1 il" },
  { value: "Y1_3", label: "1 – 3 il" },
  { value: "Y3_5", label: "3 – 5 il" },
  { value: "Y5_PLUS", label: "5 ildən yuxarı" },
];

interface VacancyFormProps {
  mode: "create" | "edit";
  onSubmit: (data: VacancyFormPayload) => Promise<void>;
  register: UseFormRegister<VacancyFormPayload>;
  control: Control<VacancyFormPayload>;
  errors: FieldErrors<VacancyFormPayload>;
  isSubmitting: boolean;
  handleSubmit: UseFormHandleSubmit<VacancyFormPayload>;
  router: AppRouterInstance;
  setValue: any;
  initialValues?: any;
}

/**
 * Üç dil-cütlü rich editor bloku (AZ + RU).
 * User tələbi: "hər 3 bölmə Editor ilə olsun" — description, requirements, workConditions.
 */
function RichTextPair({
  control,
  nameAz,
  nameRu,
  labelAz,
  labelRu,
  error,
}: {
  control: Control<VacancyFormPayload>;
  nameAz: `${"description" | "requirements" | "workConditions"}.az`;
  nameRu: `${"description" | "requirements" | "workConditions"}.ru`;
  labelAz: string;
  labelRu: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-default-600">
            {labelAz}
          </label>
          <Controller
            name={nameAz}
            control={control}
            render={({ field }) => (
              <div className="rounded-md bg-white">
                <ReactQuill
                  theme="snow"
                  value={field.value ?? ""}
                  onChange={(value) => field.onChange(value)}
                  modules={{ toolbar: quillToolbar }}
                  formats={quillFormats}
                  className="[&_.ql-container]:min-h-[160px] [&_.ql-editor]:min-h-[160px]"
                />
              </div>
            )}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-default-600">
            {labelRu}
          </label>
          <Controller
            name={nameRu}
            control={control}
            render={({ field }) => (
              <div className="rounded-md bg-white">
                <ReactQuill
                  theme="snow"
                  value={field.value ?? ""}
                  onChange={(value) => field.onChange(value)}
                  modules={{ toolbar: quillToolbar }}
                  formats={quillFormats}
                  className="[&_.ql-container]:min-h-[160px] [&_.ql-editor]:min-h-[160px]"
                />
              </div>
            )}
          />
        </div>
      </div>
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </div>
  );
}

export default function VacancyForm({
  mode,
  onSubmit,
  register,
  control,
  errors,
  isSubmitting,
  handleSubmit,
  router,
  setValue,
  initialValues,
}: VacancyFormProps) {
  const [tagInputAz, setTagInputAz] = useState("");
  const [tagInputRu, setTagInputRu] = useState("");
  const [tags, setTags] = useState<{ az: string[]; ru: string[] }>({
    az: initialValues?.tags?.az || [],
    ru: initialValues?.tags?.ru || [],
  });

  useEffect(() => {
    if (initialValues?.tags) {
      setTags({
        az: initialValues.tags.az || [],
        ru: initialValues.tags.ru || [],
      });
    }
  }, [initialValues]);

  const handleAddTag = () => {
    if (!tagInputAz.trim() || !tagInputRu.trim()) {
      toast.error("Hər iki dildə teq daxil edilməlidir.");
      return;
    }

    const azTag = tagInputAz.trim();
    const ruTag = tagInputRu.trim();

    if (tags.az.includes(azTag)) {
      toast.error("Bu teq artıq əlavə edilib.");
      return;
    }

    const newAz = [...tags.az, azTag];
    const newRu = [...tags.ru, ruTag];

    const newTags = { az: newAz, ru: newRu };
    setTags(newTags);
    setValue("tags", newTags, { shouldDirty: true });
    setTagInputAz("");
    setTagInputRu("");
  };

  const handleRemoveTag = (index: number) => {
    const newAz = tags.az.filter((_, i) => i !== index);
    const newRu = tags.ru.filter((_, i) => i !== index);
    const newTags = { az: newAz, ru: newRu };
    setTags(newTags);
    setValue("tags", newTags, { shouldDirty: true });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="p-6 w-full max-w-4xl mx-auto">
      <Button
        variant="light"
        className="mb-4"
        startContent={<MdArrowBack />}
        onPress={() => router.push("/dashboard/vacancies")}
      >
        Geri
      </Button>

      <Card>
        <CardBody className="gap-6 p-6">
          <div>
            <h1 className="text-2xl font-bold">
              {mode === "create" ? "Yeni vakansiya" : "Vakansiya redaktə"}
            </h1>
            <p className="text-gray-500 text-sm">
              Başlıq və mətnlər hər iki dil üçün. Slug boş qalsa, başlıqdan
              avtomatik yaradılır.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Vakansiya adı (AZ)"
                placeholder="Məs: Frontend Developer"
                {...register("title.az", { required: "Məcburidir" })}
                errorMessage={errors.title?.az?.message as string}
                isInvalid={!!errors.title?.az}
              />
              <Input
                label="Vakansiya adı (RU)"
                placeholder="Название вакансии"
                {...register("title.ru", { required: "Məcburidir" })}
                errorMessage={errors.title?.ru?.message as string}
                isInvalid={!!errors.title?.ru}
              />
            </div>

            <section className="flex flex-col gap-2">
              <header>
                <h2 className="text-base font-semibold text-default-700">
                  İş haqqında məlumat
                </h2>
                <p className="text-xs text-default-500">
                  Vakansiya səhifəsində əsas təsvir. Rich-text editordan istifadə edin.
                </p>
              </header>
              <RichTextPair
                control={control}
                nameAz="description.az"
                nameRu="description.ru"
                labelAz="İş haqqında məlumat (AZ)"
                labelRu="Информация о вакансии (RU)"
                error={
                  (errors.description?.az?.message as string) ||
                  (errors.description?.ru?.message as string)
                }
              />
            </section>

            <section className="flex flex-col gap-2">
              <header>
                <h2 className="text-base font-semibold text-default-700">
                  Namizədə tələblər
                </h2>
                <p className="text-xs text-default-500">
                  Bacarıqlar, təhsil, təcrübə və s.
                </p>
              </header>
              <RichTextPair
                control={control}
                nameAz="requirements.az"
                nameRu="requirements.ru"
                labelAz="Namizədə Tələblər (AZ)"
                labelRu="Требования к кандидату (RU)"
                error={
                  (errors.requirements?.az?.message as string) ||
                  (errors.requirements?.ru?.message as string)
                }
              />
            </section>

            <section className="flex flex-col gap-2">
              <header>
                <h2 className="text-base font-semibold text-default-700">
                  İş şəraiti
                </h2>
                <p className="text-xs text-default-500">
                  İş rejimi, bonuslar, ofis, sığorta və s.
                </p>
              </header>
              <RichTextPair
                control={control}
                nameAz="workConditions.az"
                nameRu="workConditions.ru"
                labelAz="İş şəraiti (AZ)"
                labelRu="Условия работы (RU)"
              />
            </section>

            <div className="flex flex-col gap-4">
              <Input
                type="date"
                label="Son müraciət tarixi (deadline)"
                {...register("deadline")}
                description="Kartda və vakansiya səhifəsində göstərilir."
              />
              <div className="grid md:grid-cols-2 gap-4">
                <Controller
                  name="employmentType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Rejim"
                      placeholder="Seçin"
                      selectedKeys={field.value ? new Set([field.value]) : new Set()}
                      onSelectionChange={(keys) => {
                        const v = Array.from(keys)[0] as string;
                        field.onChange(v || "");
                      }}
                    >
                      {EMPLOYMENT_OPTIONS.map((o) => (
                        <SelectItem key={o.value}>{o.label}</SelectItem>
                      ))}
                    </Select>
                  )}
                />
                <Controller
                  name="experienceLevel"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Təcrübə müddəti"
                      placeholder="Seçin"
                      selectedKeys={field.value ? new Set([field.value]) : new Set()}
                      onSelectionChange={(keys) => {
                        const v = Array.from(keys)[0] as string;
                        field.onChange(v || "");
                      }}
                    >
                      {EXPERIENCE_OPTIONS.map((o) => (
                        <SelectItem key={o.value}>{o.label}</SelectItem>
                      ))}
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium flex items-center gap-2">
                <MdTag className="text-gray-400" /> Teqlər (AZ / RU)
              </label>

              <div className="flex flex-wrap gap-2 mb-2">
                {tags.az.map((t, i) => (
                  <Chip
                    key={i}
                    onClose={() => handleRemoveTag(i)}
                    variant="flat"
                    color="warning"
                    className="h-auto py-1"
                  >
                    <div className="flex flex-col items-start px-1">
                      <span className="text-xs font-bold">{t}</span>
                      <span className="text-[10px] opacity-70 border-t border-warning/20 w-full mt-0.5">
                        {tags.ru[i] || "—"}
                      </span>
                    </div>
                  </Chip>
                ))}
                {tags.az.length === 0 && (
                  <span className="text-gray-400 text-sm italic">
                    Teqlər əlavə edilməyib
                  </span>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-2">
                <Input
                  placeholder="Teq (AZ)..."
                  variant="bordered"
                  value={tagInputAz}
                  onChange={(e) => setTagInputAz(e.target.value)}
                  onKeyDown={handleKeyDown}
                  isDisabled={isSubmitting}
                />
                <Input
                  placeholder="Тег (RU)..."
                  variant="bordered"
                  value={tagInputRu}
                  onChange={(e) => setTagInputRu(e.target.value)}
                  onKeyDown={handleKeyDown}
                  isDisabled={isSubmitting}
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  isDisabled={!tagInputAz.trim() || !tagInputRu.trim() || isSubmitting}
                  className="bg-jsyellow text-white h-14 md:h-auto"
                >
                  Əlavə et
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Slug (AZ) — istəyə bağlı"
                placeholder="frontend-developer"
                {...register("slug.az")}
                description="Boşdursa başlıqdan yaradılır"
              />
              <Input
                label="Slug (RU) — istəyə bağlı"
                placeholder="frontend-razrabotchik"
                {...register("slug.ru")}
              />
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    isSelected={field.value}
                    onValueChange={field.onChange}
                  >
                    Aktiv (saytda görünsün)
                  </Switch>
                )}
              />
              <Input
                type="number"
                label="Sıra (order)"
                className="max-w-xs"
                placeholder="0"
                {...register("order", { valueAsNumber: true })}
                description="Kiçik rəqəm siyahıda əvvəl görünür."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="bordered"
                onPress={() => router.push("/dashboard/vacancies")}
              >
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
