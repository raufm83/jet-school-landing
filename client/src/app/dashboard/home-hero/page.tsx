"use client";

import api from "@/utils/api/axios";
import az from "@/messages/az.json";
import ru from "@/messages/ru.json";
import { buildImageUrl } from "@/utils/imageUrl";
import type { HomeHeroApiRecord } from "@/utils/api/home-hero";
import { defaultHeroBodyHtml } from "@/utils/hero-default-html";
import { Button, Card, Input } from "@nextui-org/react";
import { motion } from "framer-motion";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { MdHome } from "react-icons/md";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="h-56 w-full rounded-md border border-default-200 bg-default-50 flex items-center justify-center text-default-500 text-sm">
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

type FormShape = {
  bodyHtml: { az: string; ru: string };
  imageAlt: { az: string; ru: string };
  imageUrl: string;
};

function defaults(): FormShape {
  return {
    bodyHtml: {
      az: defaultHeroBodyHtml("az"),
      ru: defaultHeroBodyHtml("ru"),
    },
    imageAlt: { az: az.hero.imageAlt, ru: ru.hero.imageAlt },
    imageUrl: "",
  };
}

function recordToForm(r: HomeHeroApiRecord): FormShape {
  return {
    bodyHtml: {
      az:
        r.bodyHtml?.az?.trim() !== "" && r.bodyHtml?.az != null
          ? r.bodyHtml.az
          : defaultHeroBodyHtml("az"),
      ru:
        r.bodyHtml?.ru?.trim() !== "" && r.bodyHtml?.ru != null
          ? r.bodyHtml.ru
          : defaultHeroBodyHtml("ru"),
    },
    imageAlt: r.imageAlt ?? { az: "", ru: "" },
    imageUrl: r.imageUrl ?? "",
  };
}

export default function HomeHeroAdminPage() {
  const router = useRouter();
  const savedServerImagePathRef = useRef("");
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<FormShape>({
    defaultValues: defaults(),
  });

  const watchedUrl = watch("imageUrl");

  useEffect(() => {
    if (!imageFile) {
      setFilePreview(null);
      return;
    }
    const u = URL.createObjectURL(imageFile);
    setFilePreview(u);
    return () => URL.revokeObjectURL(u);
  }, [imageFile]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<HomeHeroApiRecord | null>("/home-hero");
        if (data && typeof data === "object" && "id" in data) {
          setConfigured(true);
          savedServerImagePathRef.current = data.imageUrl?.trim() ?? "";
          reset(recordToForm(data));
        } else {
          setConfigured(false);
          savedServerImagePathRef.current = "";
          reset(defaults());
        }
      } catch {
        setConfigured(false);
        savedServerImagePathRef.current = "";
        reset(defaults());
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [reset]);

  const onSubmit = async (data: FormShape) => {
    const azEmpty = !data.bodyHtml.az?.replace(/<[^>]+>/g, "").trim();
    const ruEmpty = !data.bodyHtml.ru?.replace(/<[^>]+>/g, "").trim();
    if (azEmpty || ruEmpty) {
      toast.error("Hər iki dildə mətn yazın (boş HTML qəbul olunmur)");
      return;
    }

    if (
      !configured &&
      !imageFile &&
      !savedServerImagePathRef.current.trim() &&
      !data.imageUrl?.trim()
    ) {
      toast.error("İlk dəfə hero yaratmaq üçün şəkil yükləyin");
      return;
    }

    let imageUrlForPatch: string | undefined;

    try {
      if (imageFile) {
        const fd = new FormData();
        fd.append("image", imageFile);
        const { data: uploaded } = await api.post<{ imageUrl: string }>(
          "/home-hero/image",
          fd
        );
        imageUrlForPatch = uploaded.imageUrl;
        savedServerImagePathRef.current = uploaded.imageUrl;
      } else if (!configured) {
        imageUrlForPatch =
          savedServerImagePathRef.current.trim() ||
          data.imageUrl?.trim() ||
          undefined;
      }

      const payload: {
        bodyHtml: { az: string; ru: string };
        imageAlt: { az: string; ru: string };
        imageUrl?: string;
      } = {
        bodyHtml: data.bodyHtml,
        imageAlt: data.imageAlt,
      };
      if (imageUrlForPatch) {
        payload.imageUrl = imageUrlForPatch;
      }

      await api.patch("/home-hero", payload);

      toast.success(configured ? "Hero yeniləndi" : "Hero yaradıldı");
      setImageFile(null);
      router.refresh();
      const { data: fresh } = await api.get<HomeHeroApiRecord | null>("/home-hero");
      if (fresh && typeof fresh === "object" && "id" in fresh) {
        setConfigured(true);
        savedServerImagePathRef.current = fresh.imageUrl?.trim() ?? "";
        reset(recordToForm(fresh));
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Xəta baş verdi");
    }
  };

  const previewSrc =
    filePreview ??
    (watchedUrl?.trim() ? buildImageUrl(watchedUrl) : "/boy.webp");

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <p>Yüklənir...</p>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen w-full flex justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl"
      >
        <Card className="p-6 bg-white shadow-lg">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <MdHome size={48} className="text-jsyellow" />
            </div>
            <h1 className="text-2xl font-bold text-black">Ana səhifə Hero</h1>
            <p className="text-sm text-gray-500 mt-2 max-w-2xl mx-auto">
              Məzmun üçün ümumi mətn redaktoru (AZ və RU). Yalnız mətni
              dəyişirsinizsə şəkil faylı seçməyin — köhnə şəkil saxlanılır.
              {!configured && " İlk dəfə hero yaratmaq üçün əvvəlcə şəkil yükləyin."}
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="relative w-[200px] h-[200px] rounded-3xl overflow-hidden border border-jsyellow/30 bg-neutral-100">
              <Image
                src={previewSrc}
                alt=""
                fill
                className="object-cover"
                sizes="200px"
                unoptimized={previewSrc.startsWith("blob:")}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-default-700">
                  Məzmun (AZ)
                </label>
                <Controller
                  name="bodyHtml.az"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <div className="rounded-md bg-white border border-default-200">
                      <ReactQuill
                        theme="snow"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        modules={{ toolbar: quillToolbar }}
                        formats={quillFormats}
                        className="[&_.ql-container]:min-h-[220px] [&_.ql-editor]:min-h-[220px]"
                      />
                    </div>
                  )}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-default-700">
                  Материал (RU)
                </label>
                <Controller
                  name="bodyHtml.ru"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <div className="rounded-md bg-white border border-default-200">
                      <ReactQuill
                        theme="snow"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        modules={{ toolbar: quillToolbar }}
                        formats={quillFormats}
                        className="[&_.ql-container]:min-h-[220px] [&_.ql-editor]:min-h-[220px]"
                      />
                    </div>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Şəkil alt mətn (AZ)"
                variant="bordered"
                {...register("imageAlt.az")}
              />
              <Input
                label="Alt изображения (RU)"
                variant="bordered"
                {...register("imageAlt.ru")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hero şəkli — ilk yaradılanda və ya dəyişmək istəndikdə seçin
                (yalnız mətn üçün boş buraxın)
              </label>
              <p className="text-xs text-default-500 mb-2">Tövsiyə olunan ölçü: 900x600 (3:2) — maksimum 900px, 2MB.</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="block w-full text-sm"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="flat"
                onPress={() => router.push("/dashboard")}
              >
                Ləğv et
              </Button>
              <Button
                type="submit"
                className="bg-jsyellow text-white"
                isLoading={isSubmitting}
              >
                Yadda saxla
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
