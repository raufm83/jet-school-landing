"use client";
import { Module } from "@/types/course";
import api from "@/utils/api/axios";
import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  useDisclosure,
} from "@nextui-org/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { MdAdd, MdClear, MdDelete, MdEdit, MdSearch } from "react-icons/md";
import { toast } from "sonner";
import DashboardPagination from "@/components/ui/dashboard-pagination";

interface ModuleCourseRelation {
  id?: string;
  courseId?: string;
  course?: {
    id: string;
    title: { az?: string; ru?: string };
  };
}

interface ModuleWithCourses extends Module {
  courses?: ModuleCourseRelation[];
}

interface ModulesResponse {
  items: ModuleWithCourses[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

interface CourseOption {
  id: string;
  title: { az?: string; ru?: string };
}

const COURSE_FILTER_ALL = "all";
const COURSE_FILTER_UNASSIGNED = "unassigned";

const MODULES_COURSE_FILTER_STORAGE_KEY =
  "jet-school.dashboard.modules.courseFilter";

export default function ModulesPage() {
  const router = useRouter();
  const [modules, setModules] = useState<ModuleWithCourses[]>([]);
  const [totalModules, setTotalModules] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(8);
  const [loading, setLoading] = useState(true);

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseFilter, setCourseFilter] = useState<string>(COURSE_FILTER_ALL);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedModule, setSelectedModule] =
    useState<ModuleWithCourses | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [courseFilter]);

  useLayoutEffect(() => {
    try {
      const raw = localStorage.getItem(MODULES_COURSE_FILTER_STORAGE_KEY);
      if (!raw) return;
      if (
        raw === COURSE_FILTER_ALL ||
        raw === COURSE_FILTER_UNASSIGNED ||
        raw.length > 0
      ) {
        setCourseFilter(raw);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persistCourseFilter = useCallback((value: string) => {
    setCourseFilter(value);
    try {
      localStorage.setItem(MODULES_COURSE_FILTER_STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
  }, []);

  /**
   * Saxlanmış kurs ID bəzən ilk batch-də olmaya bilər; sıfırlama ən güclü selektoru sındırırdı.
   * Yalnız 404 alındıqda filter təmizlənir; əks halda kurs ayrıca yüklənib Select siyahısına əlavə olunur.
   */
  useEffect(() => {
    if (
      courseFilter === COURSE_FILTER_ALL ||
      courseFilter === COURSE_FILTER_UNASSIGNED
    ) {
      return;
    }
    if (courses.some((c) => c.id === courseFilter)) return;

    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/courses/${courseFilter}`);
        if (cancelled || !data?.id) return;
        setCourses((prev) => {
          if (prev.some((c) => c.id === data.id)) return prev;
          return [
            ...prev,
            {
              id: data.id,
              title: data.title ?? { az: "", ru: "" },
            },
          ];
        });
      } catch (e: unknown) {
        const status = (e as { response?: { status?: number } })?.response
          ?.status;
        if (status === 404) {
          persistCourseFilter(COURSE_FILTER_ALL);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseFilter, courses, persistCourseFilter]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await api.get(
          "/courses?page=1&limit=500&includeUnpublished=true&sort=order"
        );
        const items: CourseOption[] = Array.isArray(data?.items)
          ? data.items
          : [];
        setCourses(items);
      } catch (error) {
        console.error("Kurslar yüklənmədi:", error);
      }
    };
    fetchCourses();
  }, []);

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString(),
      });
      if (courseFilter && courseFilter !== COURSE_FILTER_ALL) {
        params.set("courseId", courseFilter);
      }
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }
      const { data } = await api.get<ModulesResponse>(
        `/course-modules?${params.toString()}`
      );
      setModules(data.items);
      setTotalModules(data.meta.total);
    } catch (error) {
      console.error("Modullar yüklənmədi:", error);
      toast.error("Modullar yüklənə bilmədi");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, courseFilter, debouncedSearch]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const handleDelete = (module: ModuleWithCourses) => {
    setSelectedModule(module);
    onOpen();
  };

  const confirmDelete = async () => {
    if (!selectedModule) return;

    try {
      await api.delete(`/course-modules/${selectedModule.id}`);
      toast.success("Modul uğurla silindi");
      fetchModules();
    } catch (error) {
      console.error("Modul silinə bilmədi:", error);
      toast.error("Modulu silmək mümkün olmadı");
    } finally {
      onClose();
      setSelectedModule(null);
    }
  };

  const columns = useMemo(
    () => [
      { name: "BAŞLIQ", uid: "title" },
      { name: "TƏSVİR", uid: "description" },
      { name: "KURSLAR", uid: "courses" },
      { name: "KONTENTLƏR", uid: "content" },
      { name: "YARADILMA TARİXİ", uid: "createdAt" },
      { name: "ƏMƏLİYYATLAR", uid: "actions" },
    ],
    []
  );

  const renderCell = (module: ModuleWithCourses, columnKey: string) => {
    switch (columnKey) {
      case "title":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{module.title.az}</p>
            <p className="text-tiny text-default-400">{module.title.ru}</p>
          </div>
        );

      case "description":
        return (
          <p className="text-small">
            {module.description?.az && module.description.az.length > 100
              ? `${module.description.az.substring(0, 100)}...`
              : module.description?.az || "—"}
          </p>
        );

      case "courses":
        if (!module.courses || module.courses.length === 0) {
          return (
            <Chip size="sm" variant="flat" color="warning">
              Təyin edilməyib
            </Chip>
          );
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[220px]">
            {module.courses.slice(0, 3).map((rel, idx) => (
              <Chip key={rel.id ?? idx} size="sm" variant="flat" color="default">
                {rel.course?.title?.az || "—"}
              </Chip>
            ))}
            {module.courses.length > 3 && (
              <Chip size="sm" variant="flat" color="primary">
                +{module.courses.length - 3}
              </Chip>
            )}
          </div>
        );

      case "content":
        return (
          <p className="text-small">
            Kontent sayı: {module.content?.length || 0}
          </p>
        );

      case "createdAt":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">
              {new Date(module.createdAt).toLocaleDateString("az-AZ")}
            </p>
            <p className="text-bold text-tiny text-default-400">
              {new Date(module.createdAt).toLocaleTimeString("az-AZ")}
            </p>
          </div>
        );

      case "actions":
        return (
          <div className="flex items-center gap-2">
            <Tooltip content="Düzəliş et">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onClick={() =>
                  router.push(`/dashboard/modules/edit/${module.id}`)
                }
              >
                <MdEdit className="text-default-400" size={20} />
              </Button>
            </Tooltip>
            <Tooltip content="Sil" color="danger">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onClick={() => handleDelete(module)}
              >
                <MdDelete className="text-danger" size={20} />
              </Button>
            </Tooltip>
          </div>
        );

      default:
        return null;
    }
  };

  const filtersDirty =
    courseFilter !== COURSE_FILTER_ALL || searchInput.trim().length > 0;

  const resetFilters = () => {
    persistCourseFilter(COURSE_FILTER_ALL);
    setSearchInput("");
  };

  return (
    <div className="p-6 w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Modullar</h1>
            <p className="text-gray-500">Modulları idarə edin</p>
          </div>
          <Button
            color="primary"
            className="bg-jsyellow text-white"
            startContent={<MdAdd size={24} />}
            onClick={() => router.push("/dashboard/modules/create")}
          >
            Yeni Modul
          </Button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,300px)_1fr_auto] md:items-end">
          <Select
            label="Kurs üzrə filter"
            variant="bordered"
            selectedKeys={new Set([courseFilter])}
            onSelectionChange={(keys) => {
              if (keys === "all") return;
              const arr =
                keys instanceof Set ? [...keys] : Array.from(keys as Iterable<string>);
              const first = arr[0];
              if (first !== undefined) {
                persistCourseFilter(String(first));
              }
            }}
            classNames={{
              trigger: "bg-white",
            }}
          >
            {[
              <SelectItem key={COURSE_FILTER_ALL} value={COURSE_FILTER_ALL}>
                Bütün kurslar
              </SelectItem>,
              <SelectItem
                key={COURSE_FILTER_UNASSIGNED}
                value={COURSE_FILTER_UNASSIGNED}
              >
                Təyin edilməyib
              </SelectItem>,
              ...courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title?.az || c.title?.ru || "—"}
                </SelectItem>
              )),
            ]}
          </Select>

          <Input
            label="Axtarış"
            placeholder="Başlıq və ya təsvirdə AZ / RU..."
            variant="bordered"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            startContent={<MdSearch className="text-default-400" />}
            isClearable
            onClear={() => setSearchInput("")}
            classNames={{
              inputWrapper: "bg-white",
            }}
          />

          {filtersDirty && (
            <Button
              variant="flat"
              color="default"
              startContent={<MdClear size={18} />}
              onPress={resetFilters}
              className="h-14"
            >
              Sıfırla
            </Button>
          )}
        </div>

        <Table
          aria-label="Modullar cədvəli"
          bottomContent={
            <div className="flex w-full justify-center">
              <DashboardPagination
                page={page}
                total={Math.max(1, Math.ceil(totalModules / rowsPerPage))}
                onChange={(p) => setPage(p)}
              />
            </div>
          }
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.uid === "actions" ? "center" : "start"}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={modules}
            loadingContent={<div>Yüklənir...</div>}
            loadingState={loading ? "loading" : "idle"}
            emptyContent="Seçimlərə uyğun modul tapılmadı"
          >
            {(module) => (
              <TableRow key={module.id}>
                {columns.map((column) => (
                  <TableCell key={column.uid}>
                    {renderCell(module, column.uid)}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>Modulu Sil</ModalHeader>
                <ModalBody>
                  <p>
                    &quot;{selectedModule?.title.az}&quot; modulunu silmək
                    istədiyinizə əminsiniz?
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    Ləğv et
                  </Button>
                  <Button color="danger" onPress={confirmDelete}>
                    Sil
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </motion.div>
    </div>
  );
}
