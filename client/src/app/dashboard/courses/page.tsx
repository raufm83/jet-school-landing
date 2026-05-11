"use client";
import { useState, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Button,
  Chip,
  Input,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  useDisclosure,
  Skeleton,
  Spinner,
} from "@nextui-org/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { MdAdd, MdEdit, MdSettings, MdViewModule, MdShield } from "react-icons/md";
import { toast } from "sonner";
import api from "@/utils/api/axios";
import { Course } from "@/types/course";
import Link from "next/link";
import DashboardPagination from "@/components/ui/dashboard-pagination";
import Image from "next/image";

const ModulesModal = dynamic(() => import("@/components/views/dashboard/modules/modules-modal"), { ssr: false });
const EligibilityModal = dynamic(() => import("@/components/views/dashboard/eligibility/eligibility-modal"), { ssr: false });
const TeachersModal = dynamic(() => import("@/components/views/dashboard/courses/teachers-modal"), { ssr: false });

interface CoursesResponse {
  items: Course[];
  meta: { total: number; page: number; limit: number };
}
interface TeacherRole {
  id: string;
  title: string;
}

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [teacherRoles, setTeacherRoles] = useState<TeacherRole[]>([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState(false);

  const { isOpen: isTeachersOpen, onOpen: onTeachersOpen, onClose: onTeachersClose } = useDisclosure();
  const { isOpen: isEligibilityOpen, onOpen: onEligibilityOpen, onClose: onEligibilityClose } = useDisclosure();
  const { isOpen: isModulesOpen, onOpen: onModulesOpen, onClose: onModulesClose } = useDisclosure();

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTeacherRole, setSelectedTeacherRole] = useState<TeacherRole | null>(null);
  const [selectedCourseForEligibility, setSelectedCourseForEligibility] = useState<Course | null>(null);
  const [selectedCourseForModules, setSelectedCourseForModules] = useState<Course | null>(null);

  /**
   * Inline order redaktəsi üçün lokal vəziyyət — key kurs id-dir ki, eyni
   * səhifədə bir neçə sahəni ard-arda dəyişdikdə önyüklənmiş serverdən olan
   * dəyər yox, istifadəçinin yazdığı qalsın.
   */
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);

  const backoff = async <T,>(fn: () => Promise<T>, tries = 3, base = 400): Promise<T> => {
    let lastErr: any;
    for (let i = 0; i < tries; i++) {
      try {
        return await fn();
      } catch (e) {
        lastErr = e;
        await new Promise(r => setTimeout(r, base * Math.pow(2, i)));
      }
    }
    throw lastErr;
  };

  const fetchTeacherRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      setRolesError(false);
      const { data } = await api.get("/course-teacher?limit=100");
      const items: TeacherRole[] = Array.isArray(data?.items) ? data.items : [];
      setTeacherRoles(items);
    } catch {
      setTeacherRoles([]);
      setRolesError(true);
      toast.error("Müəllim rolları yüklənmədi");
    } finally {
      setRolesLoading(false);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await backoff(() =>
        api.get<CoursesResponse>(
          `/courses?page=${page}&limit=${rowsPerPage}&includeUnpublished=true&sort=order`,
          { withCredentials: true },
        ),
      );
      setCourses(data?.items || []);
      setTotalCourses(data?.meta?.total || 0);
    } catch {
      setCourses([]);
      setTotalCourses(0);
      toast.error("Kurslar yüklənə bilmədi");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchTeacherRoles();
  }, [fetchTeacherRoles]);

  /**
   * Kursun `order` sahəsini PATCH edir. Backend `multipart/form-data` gözlədiyi
   * üçün FormData göndəririk — yalnız `order` sahəsi keçir, digərlərini toxunmuruq.
   * Uğurlu cavabda siyahı yenidən yüklənir ki, sıralama serverə uyğun görünsün.
   */
  const updateCourseOrder = useCallback(
    async (course: Course, newOrderRaw: string) => {
      const trimmed = newOrderRaw.trim();
      if (trimmed === "") return;
      const parsed = parseInt(trimmed, 10);
      if (!Number.isFinite(parsed)) {
        toast.error("Sıra rəqəm olmalıdır");
        return;
      }
      if (parsed === (course.order ?? 0)) return;
      try {
        setSavingOrderId(course.id);
        const formData = new FormData();
        formData.append("order", String(parsed));
        await api.patch(`/courses/${course.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
        toast.success("Sıra yeniləndi");
        setOrderDrafts((prev) => {
          const next = { ...prev };
          delete next[course.id];
          return next;
        });
        await fetchCourses();
      } catch {
        toast.error("Sıra yenilənmədi");
      } finally {
        setSavingOrderId(null);
      }
    },
    [fetchCourses],
  );

  const handleTeachers = (course: Course, role: TeacherRole) => {
    setSelectedCourse(course);
    setSelectedTeacherRole(role);
    onTeachersOpen();
  };

  const handleEligibilityModal = (course: Course) => {
    setSelectedCourseForEligibility(course);
    onEligibilityOpen();
  };

  const handleModulesModal = (course: Course) => {
    setSelectedCourseForModules(course);
    onModulesOpen();
  };

  const updateCourseInState = (updatedCourse: Course) => {
    setCourses((prev) =>
      prev.map((course) => (course.id === updatedCourse.id ? updatedCourse : course))
    );
    setSelectedCourseForModules((prev) =>
      prev?.id === updatedCourse.id ? updatedCourse : prev
    );
    setSelectedCourseForEligibility((prev) =>
      prev?.id === updatedCourse.id ? updatedCourse : prev
    );
  };


  const columns = useMemo(
    () => [
      { name: "SIRA", uid: "order" },
      { name: "BAŞLIQ", uid: "title" },
      { name: "TƏSVİR", uid: "description" },
      { name: "MÜDDƏT", uid: "duration" },
      { name: "STATUS", uid: "published" },
      { name: "MODULLAR VƏ TƏLƏBLƏR", uid: "eligibility" },
      { name: "MÜƏLLİMLƏR", uid: "teachers" },
      { name: "YARADILMA TARİXİ", uid: "createdAt" },
      { name: "ƏMƏLİYYATLAR", uid: "actions" },
    ],
    []
  );

  const renderCell = (course: Course, columnKey: string) => {
    switch (columnKey) {
      case "order": {
        const currentOrder = typeof course.order === "number" ? course.order : 0;
        const draft = orderDrafts[course.id];
        const value = draft ?? String(currentOrder);
        const isSaving = savingOrderId === course.id;
        return (
          <div className="flex items-center justify-center gap-1">
            <Input
              size="sm"
              type="number"
              aria-label="Sıra"
              value={value}
              isDisabled={isSaving}
              onValueChange={(v) =>
                setOrderDrafts((prev) => ({ ...prev, [course.id]: v }))
              }
              onBlur={() => {
                const pending = orderDrafts[course.id];
                if (pending !== undefined) updateCourseOrder(course, pending);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                } else if (e.key === "Escape") {
                  setOrderDrafts((prev) => {
                    const next = { ...prev };
                    delete next[course.id];
                    return next;
                  });
                  (e.target as HTMLInputElement).blur();
                }
              }}
              classNames={{ input: "text-center", inputWrapper: "h-8 min-h-8" }}
              className="w-20"
            />
            {isSaving && <Spinner size="sm" color="warning" />}
          </div>
        );
      }
      case "title":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{course.title.az}</p>
            <p className="text-tiny text-default-400">{course.title.ru}</p>
          </div>
        );
      case "description":
        return (
          <div className="flex flex-col">
            <p className="text-small">
              {course.description.az.length > 100 ? `${course.description.az.substring(0, 100)}...` : course.description.az}
            </p>
            <Link href={`/course/${course.slug.az}`}>
              <p className="text-primary text-tiny">Ətraflı</p>
            </Link>
          </div>
        );
      case "duration":
        return <p className="text-small">{course.duration} ay</p>;
      case "published":
        return (
          <Chip className="capitalize" color={course.published ? "success" : "warning"} size="sm" variant="flat">
            {course.published ? "Aktiv" : "Deaktiv"}
          </Chip>
        );
      case "teachers":
        if (rolesLoading) return <Spinner size="sm" color="warning" />;
        if (rolesError) return (
          <Button size="sm" variant="flat" color="danger" onClick={fetchTeacherRoles}>
            Yenidən cəhd et
          </Button>
        );
        if (!teacherRoles.length) return <span className="text-tiny text-default-400">—</span>;
        return (
          <div className="flex flex-wrap gap-2">
            {teacherRoles.map((role) => (
              <Button
                key={role.id}
                size="sm"
                variant="flat"
                onClick={() => handleTeachers(course, role)}
                startContent={
                  <Image
                    src="/logos/icon.png"
                    alt="icon"
                    width={20}
                    height={20}
                    quality={100}
                    className="rounded-full"
                  />
                }
              >
                {role.title}
              </Button>
            ))}
          </div>
        );
      case "eligibility":
        return (
          <div className="flex flex-wrap gap-1 items-center">
            <div className="flex flex-col">
              <p className="text-small">Modullar: {course.modules?.length || 0}</p>
              <p className="text-small">Tələblər: {course.eligibility?.length || 0}</p>
            </div>
            <div className="flex gap-1">
              <Tooltip content="Modulları idarə et">
                <Button isIconOnly variant="light" size="sm" onClick={() => handleModulesModal(course)}>
                  <MdViewModule className="text-default-400" size={20} />
                </Button>
              </Tooltip>
              <Tooltip content="Tələbləri idarə et">
                <Button isIconOnly variant="light" size="sm" onClick={() => handleEligibilityModal(course)}>
                  <MdSettings className="text-default-400" size={20} />
                </Button>
              </Tooltip>
            </div>
          </div>
        );
      case "createdAt":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{new Date(course.createdAt).toLocaleDateString("az-AZ")}</p>
            <p className="text-bold text-tiny text-default-400">{new Date(course.createdAt).toLocaleTimeString("az-AZ")}</p>
          </div>
        );
      case "actions":
        return (
          <Tooltip content="Düzəliş et">
            <Button isIconOnly variant="light" size="sm" onClick={() => router.push(`/dashboard/courses/edit/${course.id}`)}>
              <MdEdit className="text-default-400" size={20} />
            </Button>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 w-full">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Kurslar</h1>
            <p className="text-gray-500">Kursları idarə edin</p>
          </div>
          <div className="flex gap-2 items-center">
            <Link href="/dashboard/eligibilities">
              <Button color="primary" className="bg-jsyellow text-white" startContent={<MdShield size={24} />}>
                Tələblər
              </Button>
            </Link>
            <Link href="/dashboard/modules">
              <Button color="primary" className="bg-jsyellow text-white" startContent={<MdViewModule size={24} />}>
                Modullar
              </Button>
            </Link>
            <Button color="primary" className="bg-jsyellow text-white" startContent={<MdAdd size={24} />} onClick={() => router.push("/dashboard/courses/create")}>
              Yeni Kurs
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        ) : (
          <Table
            aria-label="Kurslar cədvəli"
            bottomContent={
              <div className="flex w-full justify-center">
                <DashboardPagination
                  page={page}
                  total={Math.max(1, Math.ceil(totalCourses / rowsPerPage))}
                  onChange={(p) => setPage(p)}
                />
              </div>
            }
          >
            <TableHeader columns={columns}>
              {column => (
                <TableColumn
                  key={column.uid}
                  align={
                    column.uid === "actions" || column.uid === "order" || column.uid === "published"
                      ? "center"
                      : "start"
                  }
                >
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody emptyContent="Kurs tapılmadı">
              {courses.map(course => (
                <TableRow key={course.id}>
                  {columns.map(column => (
                    <TableCell key={column.uid}>{renderCell(course, column.uid)}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {isModulesOpen && selectedCourseForModules && (
          <ModulesModal isOpen={isModulesOpen} onClose={onModulesClose} courseId={selectedCourseForModules.id} course={selectedCourseForModules} onUpdate={fetchCourses} onCourseChange={updateCourseInState} />
        )}
        {isTeachersOpen && selectedCourse && selectedTeacherRole && (
          <TeachersModal isOpen={isTeachersOpen} onClose={onTeachersClose} teacherRoleId={selectedTeacherRole.id} courseId={selectedCourse.id} course={selectedCourse} onUpdate={fetchCourses} />
        )}
        {isEligibilityOpen && selectedCourseForEligibility && (
          <EligibilityModal isOpen={isEligibilityOpen} onClose={onEligibilityClose} courseId={selectedCourseForEligibility.id} course={selectedCourseForEligibility} onUpdate={fetchCourses} onCourseChange={updateCourseInState} />
        )}
      </motion.div>
    </div>
  );
}
