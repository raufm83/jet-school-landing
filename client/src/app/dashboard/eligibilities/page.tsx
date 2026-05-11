"use client";
import { Eligibility } from "@/types/course";
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { MdAdd, MdClear, MdDelete, MdEdit, MdSearch } from "react-icons/md";
import { toast } from "sonner";
import DashboardPagination from "@/components/ui/dashboard-pagination";

interface EligibilityCourseRelation {
  id?: string;
  courseId?: string;
  course?: {
    id: string;
    title: { az?: string; ru?: string };
  };
}

interface EligibilityWithCourses extends Eligibility {
  courses?: EligibilityCourseRelation[];
}

interface EligibilitesResponse {
  items: EligibilityWithCourses[];
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

export default function EligibilitiesPage() {
  const router = useRouter();
  const [eligibilities, setEligibilities] = useState<EligibilityWithCourses[]>(
    []
  );
  const [totalEligibilities, setTotalEligibilities] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(8);
  const [loading, setLoading] = useState(true);

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseFilter, setCourseFilter] = useState<string>(COURSE_FILTER_ALL);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedEligibility, setSelectedEligibility] =
    useState<EligibilityWithCourses | null>(null);

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

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await api.get(
          "/courses?page=1&limit=200&includeUnpublished=true&sort=order"
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

  const fetchEligibilities = useCallback(async () => {
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
      const { data } = await api.get<EligibilitesResponse>(
        `/course-eligibility?${params.toString()}`
      );
      setEligibilities(data.items);
      setTotalEligibilities(data.meta.total);
    } catch (error) {
      toast.error("Tələb yüklənə bilmədi");
      console.error("Tələbin yükləmə xətası:", error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, courseFilter, debouncedSearch]);

  useEffect(() => {
    fetchEligibilities();
  }, [fetchEligibilities]);

  const handleDelete = async (eligibility: EligibilityWithCourses) => {
    setSelectedEligibility(eligibility);
    onOpen();
  };

  const confirmDelete = async () => {
    if (!selectedEligibility) return;

    try {
      await api.delete(`/course-eligibility/${selectedEligibility.id}`);
      toast.success("Tələb uğurla silindi");
      fetchEligibilities();
    } catch (error) {
      toast.error("Tələbi silmək mümkün olmadı");
      console.error("Tələbi silmə xətası:", error);
    } finally {
      onClose();
      setSelectedEligibility(null);
    }
  };

  const columns = useMemo(
    () => [
      { name: "BAŞLIQ", uid: "title" },
      { name: "TƏSVİR", uid: "description" },
      { name: "KURSLAR", uid: "courses" },
      { name: "YARADILMA TARİXİ", uid: "createdAt" },
      { name: "ƏMƏLİYYATLAR", uid: "actions" },
    ],
    []
  );

  const renderCell = (
    eligibility: EligibilityWithCourses,
    columnKey: string
  ) => {
    switch (columnKey) {
      case "title":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{eligibility.title.az}</p>
            <p className="text-tiny text-default-400">
              {eligibility.title.ru}
            </p>
          </div>
        );
      case "description":
        return (
          <p className="text-small">
            {eligibility.description?.az &&
            eligibility.description.az.length > 100
              ? `${eligibility.description.az.substring(0, 100)}...`
              : eligibility.description?.az || "—"}
          </p>
        );
      case "courses":
        if (!eligibility.courses || eligibility.courses.length === 0) {
          return (
            <Chip size="sm" variant="flat" color="warning">
              Təyin edilməyib
            </Chip>
          );
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[220px]">
            {eligibility.courses.slice(0, 3).map((rel, idx) => (
              <Chip
                key={rel.id ?? idx}
                size="sm"
                variant="flat"
                color="default"
              >
                {rel.course?.title?.az || "—"}
              </Chip>
            ))}
            {eligibility.courses.length > 3 && (
              <Chip size="sm" variant="flat" color="primary">
                +{eligibility.courses.length - 3}
              </Chip>
            )}
          </div>
        );
      case "createdAt":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">
              {new Date(eligibility.createdAt).toLocaleDateString("az-AZ")}
            </p>
            <p className="text-bold text-tiny text-default-400">
              {new Date(eligibility.createdAt).toLocaleTimeString("az-AZ")}
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
                  router.push(`/dashboard/eligibilities/edit/${eligibility.id}`)
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
                onClick={() => handleDelete(eligibility)}
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
    setCourseFilter(COURSE_FILTER_ALL);
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
            <h1 className="text-2xl font-bold">Tələblər</h1>
            <p className="text-gray-500">Tələbləri idarə edin</p>
          </div>
          <Button
            color="primary"
            className="bg-jsyellow text-white"
            startContent={<MdAdd size={24} />}
            onClick={() => router.push("/dashboard/eligibilities/create")}
          >
            Yeni Tələb
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
                setCourseFilter(String(first));
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
          aria-label="Tələbə layihələri cədvəli"
          bottomContent={
            <div className="flex w-full justify-center">
              <DashboardPagination
                page={page}
                total={Math.max(
                  1,
                  Math.ceil(totalEligibilities / rowsPerPage)
                )}
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
            items={eligibilities}
            loadingContent={<div>Yüklənir...</div>}
            loadingState={loading ? "loading" : "idle"}
            emptyContent="Seçimlərə uyğun tələb tapılmadı"
          >
            {(eligibility) => (
              <TableRow key={eligibility.id}>
                {columns.map((column) => (
                  <TableCell key={column.uid}>
                    {renderCell(eligibility, column.uid)}
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
                <ModalHeader>Layihəni Sil</ModalHeader>
                <ModalBody>
                  <p>
                    &quot;{selectedEligibility?.title.az}&quot; layihəsini
                    silmək istədiyinizə əminsiniz?
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
