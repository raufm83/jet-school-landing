"use client";

import api from "@/utils/api/axios";
import { buildImageUrl } from "@/utils/imageUrl";
import type { AboutHeroApiRecord, AboutMissionVisionRecord } from "@/utils/api/about-hero";
import { defaultAboutIntroHtml } from "@/utils/about-intro-default-html";
import az from "@/messages/az.json";
import ru from "@/messages/ru.json";
import { Button, Card, Input } from "@nextui-org/react";
import { motion } from "framer-motion";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { MdInfo } from "react-icons/md";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="h-56 w-full rounded-md border border-default-200 bg-default-50 flex items-center justify-center text-default-500 text-sm">
      Editor yuklenir...
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
  missionVision: {
    sectionTitle: { az: string; ru: string };
    missionTitle: { az: string; ru: string };
    missionDescription: { az: string; ru: string };
    visionTitle: { az: string; ru: string };
    visionDescription: { az: string; ru: string };
    imageUrl: string;
    imageAlt: { az: string; ru: string };
  };
};

function defaultMissionVision(): FormShape["missionVision"] {
  return {
    sectionTitle: {
      az: az.aboutPage?.mission?.sectionTitle || "Missiyamiz ve vizyonumuz",
      ru: ru.aboutPage?.mission?.sectionTitle || "Nasha missiya i videnie",
    },
    missionTitle: {
      az: az.aboutPage?.mission?.title || "Missiya",
      ru: ru.aboutPage?.mission?.title || "Missiya",
    },
    missionDescription: {
      az: az.aboutPage?.mission?.description || "",
      ru: ru.aboutPage?.mission?.description || "",
    },
    visionTitle: {
      az: az.aboutPage?.vision?.title || "Vizyon",
      ru: ru.aboutPage?.vision?.title || "Videnie",
    },
    visionDescription: {
      az: az.aboutPage?.vision?.description || "",
      ru: ru.aboutPage?.vision?.description || "",
    },
    imageUrl: "",
    imageAlt: {
      az: "Missiya ve vizyon",
      ru: "Missiya i videnie",
    },
  };
}

function defaults(): FormShape {
  return {
    bodyHtml: {
      az: defaultAboutIntroHtml("az"),
      ru: defaultAboutIntroHtml("ru"),
    },
    imageAlt: { az: "JET School haqqimizda", ru: "JET School o nas" },
    imageUrl: "",
    missionVision: defaultMissionVision(),
  };
}

function normalizeMissionVision(
  raw: AboutMissionVisionRecord | null | undefined
): FormShape["missionVision"] {
  const d = defaultMissionVision();
  return {
    sectionTitle: {
      az: raw?.sectionTitle?.az ?? d.sectionTitle.az,
      ru: raw?.sectionTitle?.ru ?? d.sectionTitle.ru,
    },
    missionTitle: {
      az: raw?.missionTitle?.az ?? d.missionTitle.az,
      ru: raw?.missionTitle?.ru ?? d.missionTitle.ru,
    },
    missionDescription: {
      az: raw?.missionDescription?.az ?? d.missionDescription.az,
      ru: raw?.missionDescription?.ru ?? d.missionDescription.ru,
    },
    visionTitle: {
      az: raw?.visionTitle?.az ?? d.visionTitle.az,
      ru: raw?.visionTitle?.ru ?? d.visionTitle.ru,
    },
    visionDescription: {
      az: raw?.visionDescription?.az ?? d.visionDescription.az,
      ru: raw?.visionDescription?.ru ?? d.visionDescription.ru,
    },
    imageUrl: raw?.imageUrl ?? d.imageUrl,
    imageAlt: {
      az: raw?.imageAlt?.az ?? d.imageAlt.az,
      ru: raw?.imageAlt?.ru ?? d.imageAlt.ru,
    },
  };
}

function recordToForm(r: AboutHeroApiRecord): FormShape {
  return {
    bodyHtml: {
      az:
        r.bodyHtml?.az?.trim() !== "" && r.bodyHtml?.az != null
          ? r.bodyHtml.az
          : defaultAboutIntroHtml("az"),
      ru:
        r.bodyHtml?.ru?.trim() !== "" && r.bodyHtml?.ru != null
          ? r.bodyHtml.ru
          : defaultAboutIntroHtml("ru"),
    },
    imageAlt: r.imageAlt ?? { az: "", ru: "" },
    imageUrl: r.imageUrl ?? "",
    missionVision: normalizeMissionVision(r.missionVision),
  };
}

export default function AboutHeroAdminPage() {
  const router = useRouter();
  const savedServerImagePathRef = useRef("");
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const savedServerMissionImagePathRef = useRef("");
  const [missionImageFile, setMissionImageFile] = useState<File | null>(null);
  const [missionFilePreview, setMissionFilePreview] = useState<string | null>(null);

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
  const watchedMissionImageUrl = watch("missionVision.imageUrl");

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
    if (!missionImageFile) {
      setMissionFilePreview(null);
      return;
    }
    const u = URL.createObjectURL(missionImageFile);
    setMissionFilePreview(u);
    return () => URL.revokeObjectURL(u);
  }, [missionImageFile]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<AboutHeroApiRecord | null>("/about-hero");
        if (data && typeof data === "object" && "id" in data) {
          setConfigured(true);
          savedServerImagePathRef.current = data.imageUrl?.trim() ?? "";
          savedServerMissionImagePathRef.current =
            data.missionVision?.imageUrl?.trim() ?? "";
          reset(recordToForm(data));
        } else {
          setConfigured(false);
          savedServerImagePathRef.current = "";
          savedServerMissionImagePathRef.current = "";
          reset(defaults());
        }
      } catch {
        setConfigured(false);
        savedServerImagePathRef.current = "";
        savedServerMissionImagePathRef.current = "";
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
      toast.error("Her iki dilde metn yazin (bosh HTML qebul olunmur)");
      return;
    }

    if (
      !configured &&
      !imageFile &&
      !savedServerImagePathRef.current.trim() &&
      !data.imageUrl?.trim()
    ) {
      toast.error("Ilk defe yaratmaq ucun shekil yukleyin");
      return;
    }

    let imageUrlForPatch: string | undefined;
    let missionImageUrlForPatch: string | undefined;

    try {
      if (imageFile) {
        const fd = new FormData();
        fd.append("image", imageFile);
        const { data: uploaded } = await api.post<{ imageUrl: string }>(
          "/about-hero/image",
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

      if (missionImageFile) {
        const fd = new FormData();
        fd.append("image", missionImageFile);
        const { data: uploadedMission } = await api.post<{ imageUrl: string }>(
          "/about-hero/image",
          fd
        );
        missionImageUrlForPatch = uploadedMission.imageUrl;
        savedServerMissionImagePathRef.current = uploadedMission.imageUrl;
      } else if (!configured) {
        missionImageUrlForPatch =
          savedServerMissionImagePathRef.current.trim() ||
          data.missionVision.imageUrl?.trim() ||
          undefined;
      }

      const payload: {
        bodyHtml: { az: string; ru: string };
        imageAlt: { az: string; ru: string };
        imageUrl?: string;
        missionVision: FormShape["missionVision"];
      } = {
        bodyHtml: data.bodyHtml,
        imageAlt: data.imageAlt,
        missionVision: {
          ...data.missionVision,
          ...(missionImageUrlForPatch && { imageUrl: missionImageUrlForPatch }),
        },
      };
      if (imageUrlForPatch) {
        payload.imageUrl = imageUrlForPatch;
      }

      await api.patch("/about-hero", payload);

      toast.success(configured ? "Haqqimizda hissesi yenilendi" : "Haqqimizda hissesi yaradildi");
      setImageFile(null);
      setMissionImageFile(null);
      router.refresh();
      const { data: fresh } = await api.get<AboutHeroApiRecord | null>("/about-hero");
      if (fresh && typeof fresh === "object" && "id" in fresh) {
        setConfigured(true);
        savedServerImagePathRef.current = fresh.imageUrl?.trim() ?? "";
        savedServerMissionImagePathRef.current =
          fresh.missionVision?.imageUrl?.trim() ?? "";
        reset(recordToForm(fresh));
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Xeta bash verdi");
    }
  };

  const previewSrc =
    filePreview ??
    (watchedUrl?.trim() ? buildImageUrl(watchedUrl) : "/images/about/intro.webp");
  const missionPreviewSrc =
    missionFilePreview ??
    (watchedMissionImageUrl?.trim()
      ? buildImageUrl(watchedMissionImageUrl)
      : "/images/about/mission-vision.webp");

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <p>Yuklenir...</p>
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
              <MdInfo size={48} className="text-jsyellow" />
            </div>
            <h1 className="text-2xl font-bold text-black">Haqqimizda giris hissesi</h1>
            <p className="text-sm text-gray-500 mt-2 max-w-2xl mx-auto">
              Bu bolmeni Home Hero kimi admin panelden idare ede bilersiniz.
              {!configured && " Ilk defede shekil yuklemek vacibdir."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <div className="relative w-full h-[240px] rounded-3xl overflow-hidden border border-jsyellow/30 bg-neutral-100">
                <Image
                  src={previewSrc}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized={previewSrc.startsWith("blob:")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giris sekli secin (deyishmek istemirsinizse bosh saxlayin)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="block w-full text-sm"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative w-full h-[240px] rounded-3xl overflow-hidden border border-jsyellow/30 bg-neutral-100">
                <Image
                  src={missionPreviewSrc}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized={missionPreviewSrc.startsWith("blob:")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Missiya/Vizyon sekli secin (deyishmek istemirsinizse bosh saxlayin)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="block w-full text-sm"
                  onChange={(e) => setMissionImageFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-default-700">
                  Mezmun (AZ)
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
                  Material (RU)
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
                label="Shekil alt metn (AZ)"
                variant="bordered"
                {...register("imageAlt.az")}
              />
              <Input
                label="Alt teksta izobrazheniya (RU)"
                variant="bordered"
                {...register("imageAlt.ru")}
              />
            </div>

            <div className="rounded-2xl border border-default-200 p-4 space-y-4">
              <h3 className="font-semibold text-base">Missiya ve vizyon</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Bolme basligi (AZ)" variant="bordered" {...register("missionVision.sectionTitle.az")} />
                <Input label="Nazvanie razdela (RU)" variant="bordered" {...register("missionVision.sectionTitle.ru")} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Sekil alt metn (AZ)" variant="bordered" {...register("missionVision.imageAlt.az")} />
                <Input label="Alt teksta (RU)" variant="bordered" {...register("missionVision.imageAlt.ru")} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Missiya basligi (AZ)" variant="bordered" {...register("missionVision.missionTitle.az")} />
                <Input label="Zagolovok missii (RU)" variant="bordered" {...register("missionVision.missionTitle.ru")} />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-default-700">
                    Missiya metni (AZ)
                  </label>
                  <Controller
                    name="missionVision.missionDescription.az"
                    control={control}
                    render={({ field }) => (
                      <div className="rounded-md bg-white border border-default-200">
                        <ReactQuill
                          theme="snow"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          modules={{ toolbar: quillToolbar }}
                          formats={quillFormats}
                          className="[&_.ql-container]:min-h-[180px] [&_.ql-editor]:min-h-[180px]"
                        />
                      </div>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-default-700">
                    Tekst missii (RU)
                  </label>
                  <Controller
                    name="missionVision.missionDescription.ru"
                    control={control}
                    render={({ field }) => (
                      <div className="rounded-md bg-white border border-default-200">
                        <ReactQuill
                          theme="snow"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          modules={{ toolbar: quillToolbar }}
                          formats={quillFormats}
                          className="[&_.ql-container]:min-h-[180px] [&_.ql-editor]:min-h-[180px]"
                        />
                      </div>
                    )}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Vizyon basligi (AZ)" variant="bordered" {...register("missionVision.visionTitle.az")} />
                <Input label="Zagolovok videniya (RU)" variant="bordered" {...register("missionVision.visionTitle.ru")} />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-default-700">
                    Vizyon metni (AZ)
                  </label>
                  <Controller
                    name="missionVision.visionDescription.az"
                    control={control}
                    render={({ field }) => (
                      <div className="rounded-md bg-white border border-default-200">
                        <ReactQuill
                          theme="snow"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          modules={{ toolbar: quillToolbar }}
                          formats={quillFormats}
                          className="[&_.ql-container]:min-h-[180px] [&_.ql-editor]:min-h-[180px]"
                        />
                      </div>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-default-700">
                    Tekst videniya (RU)
                  </label>
                  <Controller
                    name="missionVision.visionDescription.ru"
                    control={control}
                    render={({ field }) => (
                      <div className="rounded-md bg-white border border-default-200">
                        <ReactQuill
                          theme="snow"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          modules={{ toolbar: quillToolbar }}
                          formats={quillFormats}
                          className="[&_.ql-container]:min-h-[180px] [&_.ql-editor]:min-h-[180px]"
                        />
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="flat"
                onPress={() => router.push("/dashboard")}
              >
                Legv et
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
