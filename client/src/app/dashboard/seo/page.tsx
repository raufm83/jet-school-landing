"use client";

import api from "@/utils/api/axios";
import { PageMetaResponse } from "@/utils/api/page-meta";
import { STATIC_PAGE_META_KEYS } from "@/data/page-meta-keys";
import { Button, Card, Input, Tab, Tabs } from "@nextui-org/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MdSearch } from "react-icons/md";

type StaticFormRow = { titleAz: string; titleRu: string; descAz: string; descRu: string };
type CourseFormRow = { titleAz: string; titleRu: string; descAz: string; descRu: string };

export default function SeoPage() {
  const [loading, setLoading] = useState(true);
  const [metaList, setMetaList] = useState<PageMetaResponse[]>([]);
  const [courses, setCourses] = useState<
    { id: string; slug: { az?: string; ru?: string }; title: { az?: string; ru?: string } }[]
  >([]);
  const [pageMetaApiAvailable, setPageMetaApiAvailable] = useState<boolean | null>(null);
  const [savingPageKey, setSavingPageKey] = useState<string | null>(null);
  const [savingCourseId, setSavingCourseId] = useState<string | null>(null);

  const [staticForm, setStaticForm] = useState<Record<string, StaticFormRow>>({});
  const [courseForm, setCourseForm] = useState<Record<string, CourseFormRow>>({});

  const fetchMeta = useCallback(async () => {
    try {
      const { data } = await api.get<PageMetaResponse[] | PageMetaResponse | { items?: PageMetaResponse[]; data?: PageMetaResponse[] }>("/page-meta");
      let list: PageMetaResponse[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && typeof data === "object") {
        const arr = (data as { items?: PageMetaResponse[]; data?: PageMetaResponse[] }).items ?? (data as { data?: PageMetaResponse[] }).data;
        list = Array.isArray(arr) ? arr : "pageKey" in data && "locale" in data ? [data as PageMetaResponse] : [];
      }
      setMetaList(list);
      setPageMetaApiAvailable(true);
    } catch (e: unknown) {
      setMetaList([]);
      const status = (e as { response?: { status?: number } })?.response?.status;
      setPageMetaApiAvailable(status === 404 ? false : null);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const { data } = await api.get<{
        items?: { id: string; slug: { az?: string; ru?: string }; title: { az?: string; ru?: string } }[];
      }>("/courses?limit=200");
      setCourses(data?.items ?? []);
    } catch {
      setCourses([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([fetchMeta(), fetchCourses()]);
      if (cancelled) return;
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchMeta, fetchCourses]);

  // Sync form state from metaList
  useEffect(() => {
    const staticState: Record<string, StaticFormRow> = {};
    STATIC_PAGE_META_KEYS.forEach(({ key }) => {
      const metaAz = metaList.find((m) => m.pageKey === key && m.locale === "az");
      const metaRu = metaList.find((m) => m.pageKey === key && m.locale === "ru");
      staticState[key] = {
        titleAz: metaAz?.title ?? "",
        titleRu: metaRu?.title ?? "",
        descAz: metaAz?.description ?? "",
        descRu: metaRu?.description ?? "",
      };
    });
    setStaticForm(staticState);
  }, [metaList]);

  useEffect(() => {
    const courseState: Record<string, CourseFormRow> = {};
    courses.forEach((c) => {
      const slugAz = c.slug?.az || c.slug?.ru || c.id;
      const slugRu = c.slug?.ru || c.slug?.az || c.id;
      const metaAz = metaList.find((m) => m.pageKey === `course:${slugAz}` && m.locale === "az");
      const metaRu = metaList.find((m) => m.pageKey === `course:${slugRu}` && m.locale === "ru");
      courseState[c.id] = {
        titleAz: metaAz?.title ?? "",
        titleRu: metaRu?.title ?? "",
        descAz: metaAz?.description ?? "",
        descRu: metaRu?.description ?? "",
      };
    });
    setCourseForm(courseState);
  }, [metaList, courses]);

  const saveStaticPage = async (pageKey: string) => {
    if (!pageMetaApiAvailable) {
      toast.error("SEO API (page-meta) hazırda mövcud deyil. API layihəsini yenidən deploy edin.");
      return;
    }
    const form = staticForm[pageKey];
    if (!form) return;
    setSavingPageKey(pageKey);
    try {
      await Promise.all([
        api.post("/page-meta", {
          pageKey,
          locale: "az",
          title: (form.titleAz ?? "").trim() || "",
          description: (form.descAz ?? "").trim() || undefined,
        }),
        api.post("/page-meta", {
          pageKey,
          locale: "ru",
          title: (form.titleRu ?? "").trim() || "",
          description: (form.descRu ?? "").trim() || undefined,
        }),
      ]);
      toast.success("Meta saxlanıldı");
      await fetchMeta();
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 404) {
        toast.error("SEO API hazırda mövcud deyil. API-ni yeniləyin (deploy edin).");
      } else {
        toast.error(msg || "Xəta baş verdi");
      }
    } finally {
      setSavingPageKey(null);
    }
  };

  const saveCourse = async (courseId: string) => {
    if (!pageMetaApiAvailable) {
      toast.error("SEO API (page-meta) hazırda mövcud deyil. API layihəsini yenidən deploy edin.");
      return;
    }
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    const form = courseForm[courseId];
    if (!form) return;
    const slugAz = course.slug?.az || course.slug?.ru || course.id;
    const slugRu = course.slug?.ru || course.slug?.az || course.id;
    setSavingCourseId(courseId);
    try {
      await Promise.all([
        api.post("/page-meta", {
          pageKey: `course:${slugAz}`,
          locale: "az",
          title: (form.titleAz ?? "").trim() || "",
          description: (form.descAz ?? "").trim() || undefined,
        }),
        api.post("/page-meta", {
          pageKey: `course:${slugRu}`,
          locale: "ru",
          title: (form.titleRu ?? "").trim() || "",
          description: (form.descRu ?? "").trim() || undefined,
        }),
      ]);
      toast.success("Meta saxlanıldı");
      await fetchMeta();
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 404) {
        toast.error("SEO API hazırda mövcud deyil. API-ni yeniləyin (deploy edin).");
      } else {
        toast.error(msg || "Xəta baş verdi");
      }
    } finally {
      setSavingCourseId(null);
    }
  };

  const updateStaticForm = (pageKey: string, field: keyof StaticFormRow, value: string) => {
    setStaticForm((prev) => ({
      ...prev,
      [pageKey]: {
        ...(prev[pageKey] ?? { titleAz: "", titleRu: "", descAz: "", descRu: "" }),
        [field]: value,
      },
    }));
  };

  const updateCourseForm = (courseId: string, field: keyof CourseFormRow, value: string) => {
    setCourseForm((prev) => ({
      ...prev,
      [courseId]: {
        ...(prev[courseId] ?? { titleAz: "", titleRu: "", descRu: "", descAz: "" }),
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Yüklənir...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {pageMetaApiAvailable === false && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          SEO API (page-meta) hazırda serverdə mövcud deyil. Meta redaktə etmək üçün API layihəsini yenidən deploy edin.
        </div>
      )}
      <div className="flex items-center gap-3 mb-8">
        <MdSearch size={32} className="text-jsyellow" />
        <div>
          <h1 className="text-2xl font-bold">SEO – Səhifə meta (title, description)</h1>
          <p className="text-gray-500 text-sm">Səhifələrin title və description-unu redaktə edin. Schema tag-ları avtomatik yaradılır.</p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Statik səhifələr</h2>
        <div className="space-y-4">
          {STATIC_PAGE_META_KEYS.map(({ key: pageKey, label }) => (
            <Card key={pageKey} className="p-4">
              <h3 className="font-medium text-gray-700 mb-3">{label}</h3>
              <Tabs aria-label="Dil" size="sm" destroyInactiveTabPanel={false}>
                <Tab key="az" title="Azərbaycan">
                  <div className="pt-3 space-y-3">
                    <Input
                      key={`${pageKey}-titleAz`}
                      label="Meta başlıq (title)"
                      placeholder="AZ"
                      value={staticForm[pageKey]?.titleAz ?? ""}
                      onValueChange={(v) => updateStaticForm(pageKey, "titleAz", v)}
                      variant="bordered"
                    />
                    <Input
                      key={`${pageKey}-descAz`}
                      label="Meta təsvir (description)"
                      placeholder="AZ"
                      value={staticForm[pageKey]?.descAz ?? ""}
                      onValueChange={(v) => updateStaticForm(pageKey, "descAz", v)}
                      variant="bordered"
                    />
                  </div>
                </Tab>
                <Tab key="ru" title="Rus">
                  <div className="pt-3 space-y-3">
                    <Input
                      key={`${pageKey}-titleRu`}
                      label="Meta başlıq (title)"
                      placeholder="RU"
                      value={staticForm[pageKey]?.titleRu ?? ""}
                      onValueChange={(v) => updateStaticForm(pageKey, "titleRu", v)}
                      variant="bordered"
                    />
                    <Input
                      key={`${pageKey}-descRu`}
                      label="Meta təsvir (description)"
                      placeholder="RU"
                      value={staticForm[pageKey]?.descRu ?? ""}
                      onValueChange={(v) => updateStaticForm(pageKey, "descRu", v)}
                      variant="bordered"
                    />
                  </div>
                </Tab>
              </Tabs>
              <div className="mt-3">
                <Button
                  color="primary"
                  size="sm"
                  isLoading={savingPageKey === pageKey}
                  onPress={() => saveStaticPage(pageKey)}
                >
                  Saxla
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Tək kurs səhifələri (course/[slug])</h2>
        <p className="text-sm text-gray-500 mb-4">
          Hər kurs üçün pageKey: <code className="bg-gray-100 px-1 rounded">course:slug</code> (AZ və RU slug-u uyğun
          olaraq saxlanılır).
        </p>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {courses.map((c) => {
            const title = c.title?.az || c.title?.ru || c.id;
            return (
              <Card key={c.id} className="p-4">
                <h3 className="font-medium text-gray-700 mb-3">{title}</h3>
                <Tabs aria-label="Dil" size="sm" destroyInactiveTabPanel={false}>
                  <Tab key="az" title="Azərbaycan">
                    <div className="pt-3 space-y-3">
                      <Input
                        key={`${c.id}-titleAz`}
                        label="Meta başlıq (title)"
                        placeholder="AZ"
                        value={courseForm[c.id]?.titleAz ?? ""}
                        onValueChange={(v) => updateCourseForm(c.id, "titleAz", v)}
                        variant="bordered"
                      />
                      <Input
                        key={`${c.id}-descAz`}
                        label="Meta təsvir (description)"
                        placeholder="AZ"
                        value={courseForm[c.id]?.descAz ?? ""}
                        onValueChange={(v) => updateCourseForm(c.id, "descAz", v)}
                        variant="bordered"
                      />
                    </div>
                  </Tab>
                  <Tab key="ru" title="Rus">
                    <div className="pt-3 space-y-3">
                      <Input
                        key={`${c.id}-titleRu`}
                        label="Meta başlıq (title)"
                        placeholder="RU"
                        value={courseForm[c.id]?.titleRu ?? ""}
                        onValueChange={(v) => updateCourseForm(c.id, "titleRu", v)}
                        variant="bordered"
                      />
                      <Input
                        key={`${c.id}-descRu`}
                        label="Meta təsvir (description)"
                        placeholder="RU"
                        value={courseForm[c.id]?.descRu ?? ""}
                        onValueChange={(v) => updateCourseForm(c.id, "descRu", v)}
                        variant="bordered"
                      />
                    </div>
                  </Tab>
                </Tabs>
                <div className="mt-3">
                  <Button
                    color="primary"
                    size="sm"
                    isLoading={savingCourseId === c.id}
                    onPress={() => saveCourse(c.id)}
                  >
                    Saxla
                  </Button>
                </div>
              </Card>
            );
          })}
          {courses.length === 0 && <p className="text-gray-500 text-sm">Kurs tapılmadı.</p>}
        </div>
      </section>
    </div>
  );
}
