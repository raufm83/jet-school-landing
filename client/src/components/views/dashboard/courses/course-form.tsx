"use client";
import { PUBLIC_API_ORIGIN } from "@/constants/public-api-base";
import { slugifyText } from "@/utils/slugify";
import {
  Button,
  Card,
  Chip,
  ChipProps,
  Input,
  Select,
  SelectItem,
  Switch,
} from "@nextui-org/react";
import {
  MdAccessTime,
  MdDescription,
  MdLink,
  MdSignalCellular4Bar,
  MdStar,
  MdTitle,
  MdTag,
  MdImage,
  MdPeople,
} from "react-icons/md";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import "react-quill/dist/quill.snow.css";
import Image from "next/image";
import { optimizeImageFile } from "@/utils/imageOptimization";
import { toast } from "sonner";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ color: [] }, { background: [] }],
    ["link"],
    ["clean"],
  ],
};

const formats = [
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

export default function CourseForm({
  mode,
  onSubmit,
  register,
  errors,
  isSubmitting,
  handleSubmit,
  router,
  watch,
  setValue,
  initialValues,
}: any) {
  const [tagsAz, setTagsAz] = useState<string[]>(
    initialValues?.newTags?.az || []
  );
  const [tagsRu, setTagsRu] = useState<string[]>(
    initialValues?.newTags?.ru || []
  );
  const [tagInputAz, setTagInputAz] = useState("");
  const [tagInputRu, setTagInputRu] = useState("");

  const [descriptionAz, setDescriptionAz] = useState("");
  const [descriptionRu, setDescriptionRu] = useState("");
  const [shortDescriptionAz, setShortDescriptionAz] = useState("");
  const [shortDescriptionRu, setShortDescriptionRu] = useState("");
  
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    if (mode === "edit" && initialValues) {
      const watchedDescAz = watch("description.az");
      const watchedDescRu = watch("description.ru");
      const watchedShortDescAz = watch("shortDescription.az");
      const watchedShortDescRu = watch("shortDescription.ru");
      
      if (watchedDescAz) setDescriptionAz(watchedDescAz);
      if (watchedDescRu) setDescriptionRu(watchedDescRu);
      if (watchedShortDescAz) setShortDescriptionAz(watchedShortDescAz);
      if (watchedShortDescRu) setShortDescriptionRu(watchedShortDescRu);

      if (initialValues?.imageUrl) {
        setImagePreview(initialValues.imageUrl);
      }
    }
  }, [mode, watch, initialValues]);

  useEffect(() => {
    if (initialValues) {
      if (initialValues.newTags?.az) setTagsAz(initialValues.newTags.az);
      if (initialValues.newTags?.ru) setTagsRu(initialValues.newTags.ru);
    }
  }, [initialValues]);

  const levels = [
    { value: { az: "Başlanğıc", ru: "Начинающий" } },
    { value: { az: "Orta", ru: "Средний" } },
    { value: { az: "Qabaqcıl", ru: "Продвинутый" } },
  ];

  const isPublished = watch("published", false);

  const handleTitleChange = (lang: string, value: string) => {
    const slugValue = slugifyText(value);
    setValue(`slug.${lang}`, slugValue);
  };

  const handleDescriptionChange = (lang: string, value: string) => {
    setValue(`description.${lang}`, value);
    if (lang === "az") {
      setDescriptionAz(value);
    } else {
      setDescriptionRu(value);
    }
  };

  const handleShortDescriptionChange = (lang: string, value: string) => {
    setValue(`shortDescription.${lang}`, value);
    if (lang === "az") {
      setShortDescriptionAz(value);
    } else {
      setShortDescriptionRu(value);
    }
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    let finalFile = file;
    if (file.size > 2 * 1024 * 1024 || file.type !== "image/webp") {
      finalFile = await optimizeImageFile(file, {
        maxDimension: 1024,
        quality: 0.9,
        maxSizeBytes: 2 * 1024 * 1024,
      });
    }

    if (finalFile.size > 2 * 1024 * 1024) {
      toast.error("Şəklin ölçüsü 2MB-dan böyükdür. Daha kiçik şəkil seçin.");
      event.target.value = "";
      return;
    }

    setValue("image", finalFile);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(finalFile);
  };

  const getImageUrl = (url?: string): string => {
    if (!url) return "/default-course-image.jpg";
    if (url.startsWith("data:")) return url;
    if (url.startsWith("http://api.jetschool.az")) {
      return url.replace("http://", "https://");
    }
    if (url.startsWith("http")) return url;
    const cdnUrl =
      process.env.NEXT_PUBLIC_CDN_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/i, "") ||
      PUBLIC_API_ORIGIN;
    const base = cdnUrl.replace(/\/+$/, "").replace(/\/uploads$/, "");
    if (url.startsWith("/uploads")) {
      return base + url;
    }
    return `${base}/uploads/${url.replace(/^\/+/, "")}`;
  };

  const removeImage = () => {
    setImagePreview("");
    setValue("image", null);
    const fileInput = document.getElementById("course-image") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const getTagColor = (tag: string): ChipProps["color"] => {
    const colors: ChipProps["color"][] = [
      "primary", "secondary", "success", "warning", "danger",
    ];
    const index = tag.length % colors.length;
    return colors[index];
  };

  const handleAddTag = () => {
    if (!tagInputAz.trim() || !tagInputRu.trim()) {
      toast.error("Hər iki dildə teq daxil edilməlidir.");
      return;
    }

    const azTag = tagInputAz.trim();
    const ruTag = tagInputRu.trim();

    if (tagsAz.includes(azTag)) {
      toast.error("Bu teq artıq əlavə edilib.");
      return;
    }

    const newAz = [...tagsAz, azTag];
    const newRu = [...tagsRu, ruTag];

    setTagsAz(newAz);
    setTagsRu(newRu);
    setValue("newTags.az", newAz);
    setValue("newTags.ru", newRu);
    
    setTagInputAz("");
    setTagInputRu("");
  };

  const handleRemoveTag = (index: number) => {
    const newAz = tagsAz.filter((_, i) => i !== index);
    const newRu = tagsRu.filter((_, i) => i !== index);
    setTagsAz(newAz);
    setTagsRu(newRu);
    setValue("newTags.az", newAz);
    setValue("newTags.ru", newRu);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="p-6 min-h-screen w-full flex items-center justify-center">
      <div className="w-full">
        <Card className="w-full max-w-4xl p-6 bg-white shadow-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-black">
              {mode === "create" ? "Yeni Kurs Yarat" : "Kursa Düzəliş Et"}
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" encType="multipart/form-data">

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <MdImage className="text-gray-400" />
                <label className="text-sm font-medium">Kurs Şəkli</label>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {imagePreview ? (
                  <div className="relative">
                    <div className="relative w-[200px] h-48 rounded-lg overflow-hidden">
                      <Image
                        src={getImageUrl(imagePreview)}
                        alt="Course preview"
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        className="object-cover"
                        unoptimized={imagePreview.startsWith("data:")}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white min-w-0 w-8 h-8 p-0"
                      size="sm"
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MdImage className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <label htmlFor="course-image" className="cursor-pointer">
                        <span className="text-primary hover:text-primary/80"> Şəkil seçin </span>
                        <span className="text-gray-500"> və ya buraya atın</span>
                      </label>
                      <input
                        id="course-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Tövsiyə olunan ölçü: 1280x720 (16:9). PNG, JPG, GIF (max. 2MB, avtomatik WebP-ə çevriləcək)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MdDescription className="text-gray-400" /> Qısa Təsvir (AZ)
                </label>
                <Input
                  type="text"
                  variant="bordered"
                  placeholder="Texnologiya dünyasına ilk addımını at!"
                  value={shortDescriptionAz}
                  onChange={(e) => handleShortDescriptionChange("az", e.target.value)}
                  isDisabled={isSubmitting}
                  classNames={{
                    input: "bg-transparent",
                    inputWrapper: ["bg-white border-2 hover:border-primary focus:border-primary"],
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MdDescription className="text-gray-400" /> Краткое описание (RU)
                </label>
                <Input
                  type="text"
                  variant="bordered"
                  placeholder="Сделай первый шаг в мир технологий!"
                  value={shortDescriptionRu}
                  onChange={(e) => handleShortDescriptionChange("ru", e.target.value)}
                  isDisabled={isSubmitting}
                  classNames={{
                    input: "bg-transparent",
                    inputWrapper: ["bg-white border-2 hover:border-primary focus:border-primary"],
                  }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Rəng Teması</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Arxa Plan Rəngi</label>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-12 h-10 rounded border" {...register("backgroundColor")} />
                    <Input variant="bordered" placeholder="#FEF3C7" {...register("backgroundColor")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kənar Rəngi</label>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-12 h-10 rounded border" {...register("borderColor")} />
                    <Input variant="bordered" placeholder="#F59E0B" {...register("borderColor")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mətn Rəngi</label>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-12 h-10 rounded border" {...register("textColor")} />
                    <Input variant="bordered" placeholder="#1F2937" {...register("textColor")} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  label="Başlıq (AZ)"
                  variant="bordered"
                  startContent={<MdTitle className="text-gray-400" />}
                  {...register("title.az", {
                    required: "Başlıq tələb olunur",
                    onChange: (e: any) => handleTitleChange("az", e.target.value),
                  })}
                  isInvalid={!!errors.title?.az}
                  errorMessage={errors.title?.az?.message}
                />
                <Input
                  label="Slug (AZ)"
                  variant="bordered"
                  startContent={<MdLink className="text-gray-400" />}
                  isDisabled
                  {...register("slug.az")}
                />
              </div>

              <div className="space-y-2">
                <Input
                  label="Заголовок (RU)"
                  variant="bordered"
                  startContent={<MdTitle className="text-gray-400" />}
                  {...register("title.ru", {
                    required: "Заголовок обязателен",
                    onChange: (e: any) => handleTitleChange("ru", e.target.value),
                  })}
                  isInvalid={!!errors.title?.ru}
                  errorMessage={errors.title?.ru?.message}
                />
                <Input
                  label="Slug (RU)"
                  variant="bordered"
                  startContent={<MdLink className="text-gray-400" />}
                  isDisabled
                  {...register("slug.ru")}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MdDescription className="text-gray-400" /> Təsvir (AZ)
                </label>
                <div className="h-64">
                  <ReactQuill
                    theme="snow"
                    value={descriptionAz}
                    onChange={(value) => handleDescriptionChange("az", value)}
                    modules={modules}
                    formats={formats}
                    className="h-48 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MdDescription className="text-gray-400" /> Описание (RU)
                </label>
                <div className="h-64">
                  <ReactQuill
                    theme="snow"
                    value={descriptionRu}
                    onChange={(value) => handleDescriptionChange("ru", value)}
                    modules={modules}
                    formats={formats}
                    className="h-48 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="number"
                label="Müddət (ay)"
                variant="bordered"
                startContent={<MdAccessTime className="text-gray-400" />}
                {...register("duration", {
                  required: "Müddət tələb olunur",
                  valueAsNumber: true,
                })}
              />
              <Input
                label="Yaş Aralığı"
                variant="bordered"
                startContent={<MdPeople className="text-gray-400" />}
                {...register("ageRange")}
              />
            </div>

            <Input
              type="number"
              label="Sıra (order)"
              variant="bordered"
              placeholder="0"
              startContent={<MdSignalCellular4Bar className="text-gray-400" />}
              description="Siyahıda görünmə ardıcıllığı. Kiçik rəqəm əvvəl görünür. Boş buraxsanız 0 sayılacaq."
              {...register("order", { valueAsNumber: true })}
            />

            <div className="space-y-4">
              <Select
                label="Səviyyə (AZ)"
                variant="bordered"
                startContent={<MdSignalCellular4Bar className="text-gray-400" />}
                {...register("level.az")}
                defaultSelectedKeys={[initialValues?.level?.az || "Başlanğıc"]}
              >
                {levels.map((l) => <SelectItem key={l.value.az} value={l.value.az}>{l.value.az}</SelectItem>)}
              </Select>
              <Select
                label="Уровень (RU)"
                variant="bordered"
                startContent={<MdSignalCellular4Bar className="text-gray-400" />}
                {...register("level.ru")}
                defaultSelectedKeys={[initialValues?.level?.ru || "Начинающий"]}
              >
                {levels.map((l) => <SelectItem key={l.value.ru} value={l.value.ru}>{l.value.ru}</SelectItem>)}
              </Select>
            </div>

            <Input
              label="İkon"
              variant="bordered"
              startContent={<MdStar className="text-gray-400" />}
              {...register("icon")}
            />

            <div className="space-y-4">
              <label className="text-sm font-medium flex items-center gap-2">
                <MdTag className="text-gray-400" /> Teqlər (AZ / RU)
              </label>
              
              <div className="flex flex-wrap gap-2 mb-2 min-h-[50px]">
                {tagsAz.map((tag, index) => (
                  <Chip
                    key={index}
                    onClose={() => handleRemoveTag(index)}
                    color={getTagColor(tag)}
                    variant="flat"
                    className="h-auto py-1"
                  >
                    <div className="flex flex-col items-start px-1">
                      <span className="text-xs font-bold">{tag}</span>
                      <span className="text-[10px] opacity-70 border-t border-warning/20 w-full mt-0.5">{tagsRu[index] || "—"}</span>
                    </div>
                  </Chip>
                ))}
              </div>

              <div className="flex flex-col md:flex-row gap-2">
                <Input
                  label="Teq (AZ)"
                  variant="bordered"
                  value={tagInputAz}
                  onChange={(e) => setTagInputAz(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Input
                  label="Тег (RU)"
                  variant="bordered"
                  value={tagInputRu}
                  onChange={(e) => setTagInputRu(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button onClick={handleAddTag} className="bg-jsyellow text-white h-auto"> Əlavə et </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-small font-medium">Status</span>
                <span className="text-tiny text-default-400">
                  Kurs {isPublished ? "dərc ediləcək" : "qaralama kimi saxlanılacaq"}
                </span>
              </div>
              <Switch isSelected={isPublished} size="lg" color="warning" {...register("published")}>
                {isPublished ? "Dərc edilib" : "Qaralama"}
              </Switch>
            </div>

            <div className="flex justify-end space-x-4">
              <Button onClick={() => router.back()} variant="light"> Ləğv et </Button>
              <Button type="submit" className="bg-jsyellow text-white" isLoading={isSubmitting}>
                {mode === "create" ? "Yarat" : "Yenilə"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}