"use client";
import { EventStatus, PostType } from "@/types/enums";
import api from "@/utils/api/axios";
import { formatApiError } from "@/utils/api/formatApiError";
import { slugifyText } from "@/utils/slugify";
import { optimizeImageFile } from "@/utils/imageOptimization";
import { buildImageUrl } from "@/utils/imageUrl";
import {
  Button,
  Card,
  Chip,
  DatePicker,
  Input,
  Select,
  SelectItem,
  Switch,
} from "@nextui-org/react";
import { getLocalTimeZone, parseAbsoluteToLocal } from "@internationalized/date";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  MdAccessTime,
  MdCalendarMonth,
  MdCategory,
  MdDescription,
  MdLink,
  MdTag,
  MdTitle,
} from "react-icons/md";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});

const toolbarOptions = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ color: [] }, { background: [] }],
  ["link", "image"],
  ["clean"],
];

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
  "image",
];

const MAX_POST_IMAGE_BYTES = 2 * 1024 * 1024;

const COVER_IMAGE_HINT =
  "Format: PNG, JPEG, WebP və s. Maksimum 2 MB. Böyük fayllar avtomatik sıxılır; sıxılmadan sonra hələ də 2 MB-dan böyükdürsə qəbul olunmur.";

const CONTENT_IMAGE_HINT =
  "Məzmuna şəkil əlavə: maksimum 2 MB; avtomatik təxminən 1024 px uzun tərəfə qədər kiçildilir və WebP/JPEG kimi saxlanılır.";

const SLUG_HINT =
  "Saxlananda ə, ü, ö və s. avtomatik latın transliterasiyasına çevrilir (məs. məktəb → mekteb). URL üçün yalnız a–z, 0–9 və tire.";

const formatDateTimeForISO = (dateTimeStr: any) => {
  if (!dateTimeStr) return "";
  const s = String(dateTimeStr).trim();
  if (s.includes("Z") || /[+-]\d{2}:?\d{2}$/.test(s)) return s;
  if (!s.includes("T")) return `${s}T00:00:00.000Z`;
  return s.endsWith("Z") ? s : `${s}Z`;
};

/** Check if string already has timezone (Z or ±HH:MM) so we don't append Z */
const hasTimezone = (s: string) => /Z$|[+-]\d{2}:?\d{2}$/.test(s.trim());

const safeParseDate = (dateString: any) => {
  if (dateString == null) return null;
  try {
    if (typeof dateString === "string") {
      const trimmed = dateString.trim();
      if (!trimmed) return null;
      const isoStr = trimmed.includes("T")
        ? trimmed
        : `${trimmed}T00:00:00`;
      const withTz = hasTimezone(isoStr) ? isoStr : `${isoStr}Z`;
      return parseAbsoluteToLocal(withTz);
    }
    if (typeof dateString === "object" && "toDate" in dateString) return dateString;
    return null;
  } catch (e) {
    console.error("Date parse error:", e);
    return null;
  }
};

export default function PostForm({
  mode,
  onSubmit,
  register,
  control,
  errors,
  isSubmitting,
  handleSubmit,
  router,
  setValue,
  isAuthor = false,
  previewUrlAz: initialPreviewUrlAz = null,
  previewUrlRu: initialPreviewUrlRu = null,
}: any) {
  const [contentAz, setContentAz] = useState("");
  const [contentRu, setContentRu] = useState("");
  const [tagInputAz, setTagInputAz] = useState("");
  const [tagInputRu, setTagInputRu] = useState("");
  const [tagsAz, setTagsAz] = useState<string[]>([]);
  const [tagsRu, setTagsRu] = useState<string[]>([]);
  const [previewUrlAz, setPreviewUrlAz] = useState<string | null>(initialPreviewUrlAz);
  const [previewUrlRu, setPreviewUrlRu] = useState<string | null>(initialPreviewUrlRu);
  const fileInputAzRef = useRef<HTMLInputElement | null>(null);
  const fileInputRuRef = useRef<HTMLInputElement | null>(null);
  const quillInstanceAzRef = useRef<any>(null);
  const quillInstanceRuRef = useRef<any>(null);
  const quillWrapperAzRef = useRef<HTMLDivElement | null>(null);
  const quillWrapperRuRef = useRef<HTMLDivElement | null>(null);
  const contentImageInputAzRef = useRef<HTMLInputElement>(null);
  const contentImageInputRuRef = useRef<HTMLInputElement>(null);

  const modules = useMemo(
    () => ({
      toolbar: { container: toolbarOptions },
    }),
    []
  );

  const uploadContentImage = useCallback(async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await api.post<{ url: string }>("/posts/upload-image", formData, {
        headers: { "Content-Type": undefined as unknown as string },
      });
      const base = process.env.NEXT_PUBLIC_CDN_URL || "";
      if (!data?.url) return null;
      return base ? `${base.replace(/\/+$/, "")}/${(data.url as string).replace(/^\/+/, "")}` : (data.url as string);
    } catch (e) {
      toast.error(formatApiError(e, "Şəkil yüklənə bilmədi."));
      return null;
    }
  }, []);

  const findQuillInWrapper = useCallback((wrapperEl: HTMLDivElement | null): any => {
    if (!wrapperEl) return null;
    const root = wrapperEl.firstElementChild as HTMLElement;
    if (!root) return null;
    try {
      const Quill = (window as any).Quill;
      if (typeof Quill?.find !== "function") return null;
      const byRoot = Quill.find(root);
      if (byRoot) return byRoot;
      const qlContainer = root.querySelector?.(".ql-container");
      if (qlContainer) return Quill.find(qlContainer as HTMLElement);
      return null;
    } catch {
      return null;
    }
  }, []);

  const insertContentImage = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, lang: "az" | "ru") => {
      const originalFile = e.target.files?.[0];
      e.target.value = "";
      if (!originalFile) return;
      if (!originalFile.type.startsWith("image/")) {
        toast.error("Yalnız şəkil faylı seçin (PNG, JPEG, WebP və s.).");
        return;
      }
      const wrapperRef = lang === "az" ? quillWrapperAzRef : quillWrapperRuRef;
      const instanceRef = lang === "az" ? quillInstanceAzRef : quillInstanceRuRef;

      let quill = instanceRef.current && typeof instanceRef.current.insertEmbed === "function" ? instanceRef.current : null;
      if (!quill && (window as any).Quill) quill = findQuillInWrapper(wrapperRef.current);

      if (!quill && wrapperRef.current) {
        try {
          const QuillModule = await import("quill");
          const Quill = QuillModule.default;
          (window as any).Quill = Quill;
          quill = findQuillInWrapper(wrapperRef.current);
          if (quill) {
            instanceRef.current = quill;
          }
        } catch {
          /* ignore */
        }
      }

      if (!quill || typeof quill.insertEmbed !== "function") {
        toast.error("Redaktor hazır deyil. Bir az gözləyin və ya mətn sahəsinə klikləyin.");
        return;
      }

      let optimizedFile: File;
      try {
        optimizedFile = await optimizeImageFile(originalFile, {
          maxDimension: 1024,
          quality: 0.8,
          maxSizeBytes: MAX_POST_IMAGE_BYTES,
        });
      } catch {
        toast.error("Şəkil emal olunarkən xəta baş verdi. Başqa fayl sınayın.");
        return;
      }

      if (optimizedFile.size > MAX_POST_IMAGE_BYTES) {
        toast.error(
          `Məzmun şəkli hələ də çox böyükdür (${(optimizedFile.size / 1024 / 1024).toFixed(2)} MB). Maksimum 2 MB olmalıdır.`
        );
        return;
      }

      const url = await uploadContentImage(optimizedFile);
      if (!url) return;
      const range = quill.getSelection(true);
      const index = range != null ? range.index : (quill.getLength ? quill.getLength() : 0);
      quill.insertEmbed(index, "image", url);

      // Yeni əlavə edilmiş şəkilə responsive stil tətbiq et.
      // quill.root.innerHTML-ə daxil olsun ki saxlanılan HTML-də də qalsın.
      try {
        const editorEl = quill.root as HTMLElement;
        const imgs = editorEl.querySelectorAll<HTMLImageElement>("img");
        const insertedImg = Array.from(imgs).findLast((img) => img.src === url || img.getAttribute("src") === url);
        if (insertedImg) {
          insertedImg.setAttribute("style", "width:100%;height:auto;display:block;max-width:100%;");
          insertedImg.removeAttribute("width");
          insertedImg.removeAttribute("height");
        }
      } catch { /* ignore */ }

      quill.setSelection(index + 1);
    },
    [uploadContentImage, findQuillInWrapper]
  );

  // Toolbar üzərindəki label-overlay VƏ Quill instance-ları yalnız mount-da bir dəfə init edir.
  // contentAz/contentRu-nu dependency kimi verməmək lazımdır - əks halda hər
  // klaviatura zərbi 800ms-lik timer başladır və label-lər üst-üstə yığılır.
  useEffect(() => {
    const overlayLabelForImageButton = (wrapperRef: React.RefObject<HTMLDivElement | null>, inputId: string) => {
      if (!wrapperRef?.current) return () => {};
      const root = wrapperRef.current.firstElementChild as HTMLElement;
      if (!root?.querySelector) return () => {};
      const toolbar = root.querySelector(".ql-toolbar");
      const container = toolbar as HTMLElement;
      const imageBtn = container?.querySelector?.(".ql-image");
      if (!container || !imageBtn) return () => {};
      container.style.position = "relative";
      // Əvvəlki label varsa sil
      container.querySelectorAll(`label[for="${inputId}"]`).forEach((el) => el.remove());
      const label = document.createElement("label");
      label.setAttribute("for", inputId);
      label.setAttribute("aria-label", "Şəkil yüklə");
      const cr = container.getBoundingClientRect();
      const br = (imageBtn as HTMLElement).getBoundingClientRect();
      Object.assign(label.style, {
        position: "absolute",
        top: `${br.top - cr.top}px`,
        left: `${br.left - cr.left}px`,
        width: `${br.width}px`,
        height: `${br.height}px`,
        cursor: "pointer",
        opacity: "0",
        zIndex: "10",
      });
      container.appendChild(label);
      return () => { label.remove(); };
    };

    let cleanupAz = () => {};
    let cleanupRu = () => {};
    const t = setTimeout(async () => {
      cleanupAz = overlayLabelForImageButton(quillWrapperAzRef, "content-image-az");
      cleanupRu = overlayLabelForImageButton(quillWrapperRuRef, "content-image-ru");
      try {
        const QuillModule = await import("quill");
        const Quill = QuillModule.default;
        (window as any).Quill = Quill;
        const rootAz = quillWrapperAzRef.current?.firstElementChild as HTMLElement;
        if (rootAz) {
          const qAz = Quill.find(rootAz) ?? (rootAz.querySelector(".ql-container") ? Quill.find(rootAz.querySelector(".ql-container") as HTMLElement) : null);
          if (qAz) quillInstanceAzRef.current = qAz;
        }
        const rootRu = quillWrapperRuRef.current?.firstElementChild as HTMLElement;
        if (rootRu) {
          const qRu = Quill.find(rootRu) ?? (rootRu.querySelector(".ql-container") ? Quill.find(rootRu.querySelector(".ql-container") as HTMLElement) : null);
          if (qRu) quillInstanceRuRef.current = qRu;
        }
      } catch {
        /* ignore */
      }
    }, 800);
    return () => {
      clearTimeout(t);
      cleanupAz();
      cleanupRu();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useWatch for ultimate reactivity - this triggers re-renders on change
  const watchedPostType = useWatch({ control, name: "postType", defaultValue: PostType.BLOG });
  const watchedEventDate = useWatch({ control, name: "eventDate" });
  const watchedEventStatus = useWatch({ control, name: "eventStatus", defaultValue: EventStatus.UPCOMING });
  const watchedPublished = useWatch({ control, name: "published", defaultValue: false });
  const watchedOfferStartDate = useWatch({ control, name: "offerStartDate" });
  const watchedOfferEndDate = useWatch({ control, name: "offerEndDate" });
  const watchedImageAltAz = useWatch({ control, name: "imageAlt.az", defaultValue: "" });
  const watchedImageAltRu = useWatch({ control, name: "imageAlt.ru", defaultValue: "" });
  const watchedImageUrlAz = useWatch({ control, name: "imageUrl.az", defaultValue: "" });
  const watchedImageUrlRu = useWatch({ control, name: "imageUrl.ru", defaultValue: "" });

  useEffect(() => {
    if (!previewUrlAz && initialPreviewUrlAz) {
      setPreviewUrlAz(initialPreviewUrlAz);
    }
  }, [initialPreviewUrlAz, previewUrlAz]);

  useEffect(() => {
    if (!previewUrlRu && initialPreviewUrlRu) {
      setPreviewUrlRu(initialPreviewUrlRu);
    }
  }, [initialPreviewUrlRu, previewUrlRu]);

  const isEvent = watchedPostType === PostType.EVENT;
  const isOffer = watchedPostType === PostType.OFFERS;

  // No need for useEffects to sync local state if we use watched values directly in render
  // or if we rely on RHF's internal state via controller/register.
  
  // Sync local rich text editor state with form state ONLY on mount or reset
  useEffect(() => {
      // Set initial content for Quill editors from form values
      // This is needed because Quill is uncontrolled or loosely controlled
      const initialAz =  control._defaultValues?.content?.az || "";
      const initialRu =  control._defaultValues?.content?.ru || "";
      const initialTags = control._defaultValues?.tags;
      const tagsAzInit = Array.isArray(initialTags) ? initialTags : initialTags?.az || [];
      const tagsRuInit = Array.isArray(initialTags) ? initialTags : initialTags?.ru || [];

      if (initialAz) setContentAz(initialAz);
      if (initialRu) setContentRu(initialRu);
      if (tagsAzInit.length) setTagsAz(tagsAzInit);
      if (tagsRuInit.length) setTagsRu(tagsRuInit);
  }, [control._defaultValues]);

  // Status calculation logic
  const calculateStatus = (dateStr: string) => {
    if (!dateStr) return EventStatus.UPCOMING;
    try {
        let cleanStr = dateStr;
        if (!cleanStr.includes("Z") && !cleanStr.includes("+") && !cleanStr.includes("-")) cleanStr += "Z";
        const dateObj = new Date(cleanStr);
        if (isNaN(dateObj.getTime())) return EventStatus.UPCOMING;
        
        const now = new Date();
        return dateObj > now ? EventStatus.UPCOMING : EventStatus.PAST;
    } catch {
        return EventStatus.UPCOMING;
    }
  };

  // Sync status when date changes
  useEffect(() => {
    if (isEvent && watchedEventDate) {
        const newStatus = calculateStatus(watchedEventDate);
        if (watchedEventStatus !== newStatus) {
            setValue("eventStatus", newStatus, { shouldDirty: true, shouldValidate: true });
        }
    } else if (isOffer && watchedOfferEndDate) {
        const newStatus = calculateStatus(watchedOfferEndDate);
        if (watchedEventStatus !== newStatus) {
            setValue("eventStatus", newStatus, { shouldDirty: true, shouldValidate: true });
            
            // Auto-deactivate if past
            if (newStatus === EventStatus.PAST) {
               setValue("published", false, { shouldDirty: true });
            }
        }
    }
  }, [watchedEventDate, watchedOfferStartDate, watchedOfferEndDate, isEvent, isOffer, watchedEventStatus, setValue]);

  // Slug is manual; no auto-fill from title

  const handleContentChange = (lang: string, value: string, editor?: any) => {
    setValue(`content.${lang}`, value, { shouldDirty: true });
    if (lang === "az") {
      setContentAz(value);
      if (editor && typeof editor.insertEmbed === "function") quillInstanceAzRef.current = editor;
    } else {
      setContentRu(value);
      if (editor && typeof editor.insertEmbed === "function") quillInstanceRuRef.current = editor;
    }
  };

  const handleEditorFocus = (lang: "az" | "ru", _range: any, _source: any, editor?: any) => {
    if (editor && typeof editor.insertEmbed === "function") {
      if (lang === "az") quillInstanceAzRef.current = editor;
      else quillInstanceRuRef.current = editor;
    }
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

    setValue("tags", { az: newAz, ru: newRu }, { shouldDirty: true });
    setTagInputAz("");
    setTagInputRu("");
  };

  const handleRemoveTag = (index: number) => {
    const newAz = tagsAz.filter((_, i) => i !== index);
    const newRu = tagsRu.filter((_, i) => i !== index);
    setTagsAz(newAz);
    setTagsRu(newRu);
    setValue("tags", { az: newAz, ru: newRu }, { shouldDirty: true });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleFileChange = async (lang: "az" | "ru", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Kapak üçün yalnız şəkil faylı seçin (PNG, JPEG, WebP və s.).");
      e.target.value = "";
      return;
    }

    const MAX = MAX_POST_IMAGE_BYTES;

    // Yalnız limitdən böyük faylları optimize edirik; kiçik fayllar as-is qəbul olunur
    // (WebP konvertasiyası bəzən orijinaldan böyük fayl yaradır)
    let finalFile = file;
    if (file.size > MAX) {
      try {
        const optimized = await optimizeImageFile(file, {
          maxDimension: 1920,
          quality: 0.85,
          maxSizeBytes: MAX,
        });
        finalFile = optimized.size < file.size ? optimized : file;
      } catch {
        toast.error("Kapak şəkli emal olunarkən xəta baş verdi. Başqa fayl sınayın.");
        e.target.value = "";
        return;
      }
    }

    if (finalFile.size > MAX) {
      toast.error(
        `Kapak şəklinin ölçüsü ${(finalFile.size / 1024 / 1024).toFixed(2)} MB — maksimum 2 MB olmalıdır. Daha kiçik və ya aşağı keyfiyyətli şəkil seçin.`
      );
      e.target.value = "";
      return;
    }

    setValue(lang === "az" ? "imageAz" : "imageRu", finalFile, { shouldDirty: true });
    const r = new FileReader();
    r.onloadend = () =>
      lang === "az"
        ? setPreviewUrlAz(r.result as string)
        : setPreviewUrlRu(r.result as string);
    r.readAsDataURL(finalFile);
  };

  const slugFieldAz = register("slug.az");
  const slugFieldRu = register("slug.ru");

  const onFormSubmit = (data: any) => {
    const slugAz = slugifyText(data.slug?.az ?? "");
    const slugRu = slugifyText(data.slug?.ru ?? "");
    const newData = {
      ...data,
      slug: { az: slugAz, ru: slugRu },
      ...(data.eventDate && { eventDate: formatDateTimeForISO(data.eventDate) }),
      ...(data.offerStartDate && { offerStartDate: formatDateTimeForISO(data.offerStartDate) }),
      ...(data.offerEndDate && { offerEndDate: formatDateTimeForISO(data.offerEndDate) }),
    };
    onSubmit(newData);
  };

  return (
    <div className="p-6 min-h-screen w-full flex items-center justify-center">
      <div className="w-full">
        <Card className="w-full max-w-4xl p-6 bg-white shadow-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-black">
              {mode === "create" ? "Yeni Post Yarat" : "Posta Düzəliş Et"}
            </h1>
          </div>

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <Input
                  label="Başlıq (AZ)"
                  variant="bordered"
                  startContent={<MdTitle className="text-gray-400" />}
                  {...register("title.az", { required: "Başlıq tələb olunur" })}
                  isInvalid={!!errors.title?.az}
                  errorMessage={errors.title?.az?.message}
                />
                <Input
                  label="Slug (AZ)"
                  variant="bordered"
                  startContent={<MdLink className="text-gray-400" />}
                  {...slugFieldAz}
                  onBlur={(e) => {
                    slugFieldAz.onBlur(e);
                    const raw = (e.target as HTMLInputElement).value;
                    setValue("slug.az", slugifyText(raw), {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  placeholder="post-url-az"
                  description={SLUG_HINT}
                />
              </div>
              <div className="space-y-4">
                <Input
                  label="Заголовок (RU)"
                  variant="bordered"
                  startContent={<MdTitle className="text-gray-400" />}
                  {...register("title.ru", { required: "Заголовок обязателен" })}
                  isInvalid={!!errors.title?.ru}
                  errorMessage={errors.title?.ru?.message}
                />
                <Input
                  label="Slug (RU)"
                  variant="bordered"
                  startContent={<MdLink className="text-gray-400" />}
                  {...slugFieldRu}
                  onBlur={(e) => {
                    slugFieldRu.onBlur(e);
                    const raw = (e.target as HTMLInputElement).value;
                    setValue("slug.ru", slugifyText(raw), {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  placeholder="post-url-ru"
                  description={SLUG_HINT}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2"><MdDescription className="text-gray-400" /> Məzmun (AZ)</label>
                <p className="text-xs text-default-500 -mt-1">{CONTENT_IMAGE_HINT}</p>
                <input
                  id="content-image-az"
                  type="file"
                  accept="image/*"
                  ref={contentImageInputAzRef}
                  onChange={(e) => insertContentImage(e, "az")}
                  className="absolute opacity-0 w-0 h-0 overflow-hidden pointer-events-none"
                  aria-hidden
                  tabIndex={-1}
                />
                <div ref={quillWrapperAzRef} className="h-64"><ReactQuill theme="snow" value={contentAz} onChange={(value, _delta, _source, editor) => handleContentChange("az", value, editor)} onChangeSelection={(_range, _source, editor) => handleEditorFocus("az", _range, _source, editor)} modules={modules} formats={formats} className="h-48 bg-white" /></div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2"><MdDescription className="text-gray-400" /> Содержание (RU)</label>
                <p className="text-xs text-default-500 -mt-1">{CONTENT_IMAGE_HINT}</p>
                <input
                  id="content-image-ru"
                  type="file"
                  accept="image/*"
                  ref={contentImageInputRuRef}
                  onChange={(e) => insertContentImage(e, "ru")}
                  className="absolute opacity-0 w-0 h-0 overflow-hidden pointer-events-none"
                  aria-hidden
                  tabIndex={-1}
                />
                <div ref={quillWrapperRuRef} className="h-64"><ReactQuill theme="snow" value={contentRu} onChange={(value, _delta, _source, editor) => handleContentChange("ru", value, editor)} onChangeSelection={(_range, _source, editor) => handleEditorFocus("ru", _range, _source, editor)} modules={modules} formats={formats} className="h-48 bg-white" /></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Şəkil (AZ) — kapak</label>
                <p className="text-xs text-default-500">{COVER_IMAGE_HINT}</p>
                <input type="file" accept="image/*" ref={fileInputAzRef} onChange={(e) => handleFileChange("az", e)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-jsyellow/10 file:text-jsyellow hover:file:bg-jsyellow/20" />
                <Input
                  label="Şəkil alt mətn (AZ)"
                  placeholder="Şəklin təsviri (axtarış üçün)"
                  variant="bordered"
                  value={watchedImageAltAz ?? ""}
                  onChange={(e) => setValue("imageAlt.az", e.target.value, { shouldDirty: true })}
                  className="mt-1"
                />
                {(previewUrlAz || watchedImageUrlAz) && (
                  <div className="w-full max-w-sm mt-2 rounded-xl overflow-hidden border-2 border-jsyellow/20 bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrlAz || buildImageUrl(watchedImageUrlAz)}
                      alt="Preview AZ"
                      className="w-full h-auto block max-h-56 object-contain"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Şəkil (RU) — kapak</label>
                <p className="text-xs text-default-500">{COVER_IMAGE_HINT}</p>
                <input type="file" accept="image/*" ref={fileInputRuRef} onChange={(e) => handleFileChange("ru", e)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-jsyellow/10 file:text-jsyellow hover:file:bg-jsyellow/20" />
                <Input
                  label="Альт текст изображения (RU)"
                  placeholder="Описание изображения (для поиска)"
                  variant="bordered"
                  value={watchedImageAltRu ?? ""}
                  onChange={(e) => setValue("imageAlt.ru", e.target.value, { shouldDirty: true })}
                  className="mt-1"
                />
                {(previewUrlRu || watchedImageUrlRu) && (
                  <div className="w-full max-w-sm mt-2 rounded-xl overflow-hidden border-2 border-jsyellow/20 bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrlRu || buildImageUrl(watchedImageUrlRu)}
                      alt="Preview RU"
                      className="w-full h-auto block max-h-56 object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            {!isAuthor && (
              <Select
                label="Post Növü"
                variant="bordered"
                startContent={<MdCategory className="text-gray-400" />}
                selectedKeys={new Set([watchedPostType])}
                onSelectionChange={(keys: any) => setValue("postType", Array.from(keys)[0], { shouldDirty: true })}
              >
                <SelectItem key={PostType.BLOG} value={PostType.BLOG}>Bloq</SelectItem>
                <SelectItem key={PostType.NEWS} value={PostType.NEWS}>Xəbər</SelectItem>
                <SelectItem key={PostType.EVENT} value={PostType.EVENT}>Tədbir</SelectItem>
                <SelectItem key={PostType.OFFERS} value={PostType.OFFERS}>Kampaniya</SelectItem>
              </Select>
            )}
            {isAuthor && mode === "create" && (
              <p className="text-sm text-default-500">Post növü: Bloq (müəllif yalnız bloq yaza bilər)</p>
            )}

            {isEvent && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <DatePicker
                  label="Tədbir tarixi və saatı"
                  variant="bordered"
                  startContent={<MdCalendarMonth className="text-gray-400" />}
                  hideTimeZone granularity="minute" hourCycle={24}
                  value={watchedEventDate ? safeParseDate(watchedEventDate) : null}
                  onChange={(date: any) => {
                    if (date) {
                      const d = date.toDate(getLocalTimeZone());
                      const iso = d.toISOString();
                      setValue("eventDate", iso, { shouldDirty: true, shouldValidate: true });
                      setValue("eventStatus", calculateStatus(iso), { shouldDirty: true, shouldValidate: true });
                    }
                  }}
                />
                <Select
                  label="Tədbir statusu"
                  variant="bordered"
                  startContent={<MdAccessTime className="text-gray-400" />}
                  isDisabled={true}
                  selectedKeys={new Set([watchedEventStatus])}
                >
                  <SelectItem key={EventStatus.UPCOMING} value={EventStatus.UPCOMING}>Gələcək</SelectItem>
                  <SelectItem key={EventStatus.ONGOING} value={EventStatus.ONGOING}>Davam edir</SelectItem>
                  <SelectItem key={EventStatus.PAST} value={EventStatus.PAST}>Keçmiş</SelectItem>
                </Select>
                <input type="hidden" {...register("eventStatus")} />
              </div>
            )}

            {isOffer && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  label="Kampaniya başlanğıc tarixi"
                  variant="bordered"
                  granularity="day"
                  startContent={<MdCalendarMonth className="text-gray-400" />}
                  value={watchedOfferStartDate ? safeParseDate(watchedOfferStartDate) : null}
                  onChange={(date: any) => {
                    if (date) {
                      const d = date.toDate(getLocalTimeZone());
                      d.setHours(0, 0, 0, 0);
                      setValue("offerStartDate", d.toISOString(), { shouldDirty: true, shouldValidate: true });
                    }
                  }}
                />
                <DatePicker
                  label="Kampaniya bitmə tarixi"
                  variant="bordered"
                  granularity="day"
                  startContent={<MdCalendarMonth className="text-gray-400" />}
                  value={watchedOfferEndDate ? safeParseDate(watchedOfferEndDate) : null}
                  onChange={(date: any) => {
                    if (date) {
                      const d = date.toDate(getLocalTimeZone());
                      d.setHours(23, 59, 59, 999);
                      setValue("offerEndDate", d.toISOString(), { shouldDirty: true, shouldValidate: true });
                    }
                  }}
                />
              </div>
            )}

            <div className="space-y-4">
              <label className="text-sm font-medium flex items-center gap-2">
                <MdTag className="text-gray-400" /> Teqlər (AZ / RU)
              </label>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {tagsAz.map((t, i) => (
                  <Chip 
                    key={i} 
                    onClose={() => handleRemoveTag(i)} 
                    variant="flat" 
                    color="warning"
                    className="h-auto py-1"
                  >
                    <div className="flex flex-col items-start px-1">
                      <span className="text-xs font-bold">{t}</span>
                      <span className="text-[10px] opacity-70 border-t border-warning/20 w-full mt-0.5">{tagsRu[i] || "—"}</span>
                    </div>
                  </Chip>
                ))}
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

            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Dərc Statusu</span>
                <span className="text-xs text-gray-500">{watchedPublished ? "Saytda görünəcək" : "Qaralama (Saytda görünmür)"}</span>
              </div>
              <Switch isSelected={watchedPublished} onValueChange={(val) => setValue("published", val, { shouldDirty: true })} color="warning" />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button onClick={() => router.back()} variant="light">Ləğv et</Button>
              <Button type="submit" className="bg-jsyellow text-white w-32" isLoading={isSubmitting}>
                {mode === "create" ? "Yarat" : "Yenilə"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
