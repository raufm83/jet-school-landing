"use client";
import { Course, CourseEligibility, Eligibility } from "@/types/course";
import api from "@/utils/api/axios";
import { getIcon } from "@/utils/icon";
import {
  Button,
  Card,
  Checkbox,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ScrollShadow,
} from "@nextui-org/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MdKeyboardArrowDown, MdKeyboardArrowUp, MdSearch } from "react-icons/md";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  courseId?: string;
  onUpdate: () => void;
  onCourseChange?: (course: Course) => void;
  course: Course;
}

export default function EligibilityModal({
  isOpen,
  onClose,
  courseId,
  onCourseChange,
  course,
}: Props) {
  const [eligibilities, setEligibilities] = useState<Eligibility[]>([]);
  const [localCourseEligibility, setLocalCourseEligibility] = useState<CourseEligibility[]>(
    course?.eligibility || []
  );
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLocalCourseEligibility(course?.eligibility || []);
  }, [course]);

  const syncCourseEligibility = (nextEligibility: CourseEligibility[]) => {
    const normalized = [...nextEligibility].sort((a, b) => {
      const d = (a.order ?? 0) - (b.order ?? 0);
      if (d !== 0) return d;
      return a.eligibilityId.localeCompare(b.eligibilityId);
    });
    setLocalCourseEligibility(normalized);
    onCourseChange?.({ ...course, eligibility: normalized });
  };

  const getRelation = (eligibilityId: string) =>
    localCourseEligibility.find((item) => item.eligibilityId === eligibilityId);

  /** Növbəti boş 0 əsaslı order (yeni tələb əlavə edərkən) */
  const nextOrderValue = () => {
    if (localCourseEligibility.length === 0) return 0;
    const max = localCourseEligibility.reduce(
      (m, x) => Math.max(m, x.order ?? 0),
      -1
    );
    return max + 1;
  };

  const getOrderInputValue = (eligibilityId: string) => {
    if (orderDrafts[eligibilityId] !== undefined) return orderDrafts[eligibilityId];
    const relation = getRelation(eligibilityId);
    if (!relation) return "";
    return String((relation.order ?? 0) + 1);
  };

  /** İstifadəçi 1 əsaslı sıra daxil edir; API-də 0 əsaslı saxlanılır */
  const normalizeOrderInput = (value: string) => {
    const parsed = parseInt(value.trim(), 10);
    if (!Number.isFinite(parsed) || parsed < 1) return 0;
    return parsed - 1;
  };

  /** Sıra dəyişəndə bütün seçilmiş təlabələr üçün sıx 0..n-1 yazıb yalnız dəyişənləri PATCH edir */
  const persistDenseOrders = async (reordered: CourseEligibility[]) => {
    if (!courseId) return;
    const withIdx = reordered.map((item, idx) => ({
      item,
      idx,
      prev: item.order ?? 0,
    }));
    const toPatch = withIdx.filter(({ prev, idx }) => prev !== idx);
    if (toPatch.length === 0) {
      syncCourseEligibility(reordered.map((item, idx) => ({ ...item, order: idx })));
      return;
    }
    await Promise.all(
      toPatch.map(({ item, idx }) =>
        api.patch(
          `/course-eligibility/${item.eligibilityId}/courses/${courseId}/order/${idx}`
        )
      )
    );
    syncCourseEligibility(reordered.map((item, idx) => ({ ...item, order: idx })));
  };

  const moveInOrder = async (eligibilityId: string, delta: -1 | 1) => {
    if (!courseId) return;
    const sorted = [...localCourseEligibility].sort((a, b) => {
      const d = (a.order ?? 0) - (b.order ?? 0);
      if (d !== 0) return d;
      return a.eligibilityId.localeCompare(b.eligibilityId);
    });
    const i = sorted.findIndex((x) => x.eligibilityId === eligibilityId);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
    try {
      setSavingOrderId(eligibilityId);
      await persistDenseOrders(reordered);
      toast.success("Sıra yeniləndi");
    } catch (e) {
      console.error(e);
      toast.error("Sıra dəyişmədi");
    } finally {
      setSavingOrderId(null);
    }
  };

  /**
   * Client-side axtarış: title və description iki dildə yoxlanır. Tam siyahı
   * modal açılanda bir dəfə yüklənir, ona görə təkrar backend request-ə ehtiyac yoxdur.
   */
  const filteredEligibilities = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return eligibilities;
    return eligibilities.filter((e) => {
      const haystack = [
        e.title?.az,
        e.title?.ru,
        e.description?.az,
        e.description?.ru,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [eligibilities, search]);

  const sortedSelectedList = useMemo(
    () =>
      [...localCourseEligibility].sort((a, b) => {
        const d = (a.order ?? 0) - (b.order ?? 0);
        if (d !== 0) return d;
        return a.eligibilityId.localeCompare(b.eligibilityId);
      }),
    [localCourseEligibility]
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !courseId) return;
      try {
        setLoading(true);
        const { data } = await api.get("/course-eligibility?limit=1000");
        setEligibilities(Array.isArray(data?.items) ? data.items : []);
      } catch (error) {
        console.error("Tələblər yüklənmədi:", error);
        toast.error("Tələblər yüklənə bilmədi");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, courseId]);

  const handleCheckboxChange = async (
    eligibility: Eligibility,
    isSelected: boolean
  ) => {
    const eligibilityId = eligibility.id;
    try {
      if (isSelected) {
        const raw = getOrderInputValue(eligibilityId);
        const parsed = parseInt(String(raw).trim(), 10);
        const order =
          Number.isFinite(parsed) && parsed >= 1
            ? parsed - 1
            : nextOrderValue();
        await api.post(
          `/course-eligibility/${eligibilityId}/courses/${courseId}`,
          { order }
        );
        syncCourseEligibility([
          ...localCourseEligibility,
          {
            id: `${courseId}-${eligibilityId}`,
            courseId: courseId || "",
            eligibilityId,
            order,
            createdAt: new Date().toISOString(),
            eligibility,
          },
        ]);
        toast.success("Tələb əlavə edildi");
      } else {
        await api.delete(
          `/course-eligibility/${eligibilityId}/courses/${courseId}`
        );
        setOrderDrafts((prev) => {
          const next = { ...prev };
          delete next[eligibilityId];
          return next;
        });
        syncCourseEligibility(
          localCourseEligibility.filter(
            (item) => item.eligibilityId !== eligibilityId
          )
        );
        toast.success("Tələb silindi");
      }
    } catch (error) {
      console.error("Əməliyyat xətası:", error);
      toast.error("Əməliyyat uğursuz oldu");
    }
  };

  const handleOrderSave = async (eligibilityId: string) => {
    const draft = orderDrafts[eligibilityId];
    const relation = getRelation(eligibilityId);
    if (draft === undefined || !relation) return;
    if (draft.trim() === "") return;

    const nextOrder = normalizeOrderInput(draft);
    if (nextOrder === (relation.order ?? 0)) {
      setOrderDrafts((prev) => {
        const next = { ...prev };
        delete next[eligibilityId];
        return next;
      });
      return;
    }

    try {
      setSavingOrderId(eligibilityId);
      await api.patch(
        `/course-eligibility/${eligibilityId}/courses/${courseId}/order/${nextOrder}`
      );
      syncCourseEligibility(
        localCourseEligibility.map((item) =>
          item.eligibilityId === eligibilityId
            ? { ...item, order: nextOrder }
            : item
        )
      );
      setOrderDrafts((prev) => {
        const next = { ...prev };
        delete next[eligibilityId];
        return next;
      });
      toast.success("Tələb sırası yeniləndi");
    } catch (error) {
      console.error("Tələb sırası yenilənmədi:", error);
      toast.error("Sıra yenilənmədi");
    } finally {
      setSavingOrderId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h2 className="text-xl font-bold">Kurs Tələbləri</h2>
              <p className="text-small text-default-500">
                {course.title.az} kursu üçün tələbləri seçin
              </p>
            </ModalHeader>
            <ModalBody className="!bg-white">
              <Input
                placeholder="Başlıq və ya təsvirdə axtarış (AZ / RU)..."
                variant="bordered"
                value={search}
                onValueChange={setSearch}
                startContent={<MdSearch className="text-default-400" />}
                isClearable
                onClear={() => setSearch("")}
                classNames={{ inputWrapper: "bg-white" }}
              />
              <ScrollShadow className="!bg-white max-h-[500px] shadow-none">
                <div className="grid !bg-white grid-cols-1 gap-4">
                  {loading ? (
                    <p>Yüklənir...</p>
                  ) : filteredEligibilities.length === 0 ? (
                    <p className="text-small text-default-500 text-center py-4">
                      Axtarışa uyğun tələb tapılmadı
                    </p>
                  ) : (
                    [...filteredEligibilities]
                      .sort((a, b) => {
                        const aOrder =
                          getRelation(a.id)?.order ?? Number.MAX_SAFE_INTEGER;
                        const bOrder =
                          getRelation(b.id)?.order ?? Number.MAX_SAFE_INTEGER;
                        return aOrder - bOrder;
                      })
                      .map((eligibility) => {
                      const IconComponent = getIcon(eligibility.icon);
                      const relation = getRelation(eligibility.id);
                      const isSelected = Boolean(relation);
                      const selIdx = sortedSelectedList.findIndex(
                        (x) => x.eligibilityId === eligibility.id
                      );
                      const canMoveUp =
                        isSelected && selIdx > 0 && sortedSelectedList.length > 1;
                      const canMoveDown =
                        isSelected &&
                        selIdx >= 0 &&
                        selIdx < sortedSelectedList.length - 1;

                      return (
                        <Card
                          key={eligibility.id}
                          className={`p-4 transition-all shadow-none duration-200 ${
                            isSelected
                              ? "border-2 border-jsyellow bg-jsyellow/5"
                              : "hover:border-jsyellow/50 border-2 border-gray-400"
                          }`}
                        >
                          <Checkbox
                            classNames={{
                              label: "w-full",
                              wrapper: "before:border-jsyellow",
                            }}
                            isSelected={isSelected}
                            onValueChange={(isSelected) =>
                              handleCheckboxChange(eligibility, isSelected)
                            }
                          >
                            <div className="flex items-center gap-3 w-full">
                              <span className="material-icons text-jsyellow text-xl mt-1">
                                <IconComponent className="w-6 h-6" />
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground">
                                  {eligibility.title.az}
                                </p>
                                <p className="text-small text-default-500 mt-1">
                                  {eligibility.description.az}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-1">
                                {isSelected && (
                                  <>
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      className="min-w-8"
                                      aria-label="Yuxarı"
                                      isDisabled={
                                        !canMoveUp ||
                                        savingOrderId === eligibility.id
                                      }
                                      onPress={() => {
                                        void moveInOrder(eligibility.id, -1);
                                      }}
                                    >
                                      <MdKeyboardArrowUp className="text-lg" />
                                    </Button>
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      className="min-w-8"
                                      aria-label="Aşağı"
                                      isDisabled={
                                        !canMoveDown ||
                                        savingOrderId === eligibility.id
                                      }
                                      onPress={() => {
                                        void moveInOrder(eligibility.id, 1);
                                      }}
                                    >
                                      <MdKeyboardArrowDown className="text-lg" />
                                    </Button>
                                  </>
                                )}
                              <Input
                                type="number"
                                label="Sıra"
                                size="sm"
                                min={1}
                                className="w-24"
                                value={getOrderInputValue(eligibility.id)}
                                isDisabled={
                                  !isSelected || savingOrderId === eligibility.id
                                }
                                placeholder="—"
                                onClick={(e) => e.stopPropagation()}
                                onValueChange={(value) =>
                                  setOrderDrafts((prev) => ({
                                    ...prev,
                                    [eligibility.id]: value,
                                  }))
                                }
                                onBlur={() => handleOrderSave(eligibility.id)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    (event.target as HTMLInputElement).blur();
                                  }
                                }}
                              />
                              </div>
                            </div>
                          </Checkbox>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollShadow>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose} className="font-medium">
                Bağla
              </Button>
              <Button
                color="warning"
                variant="flat"
                className="bg-jsyellow text-white font-medium"
                onPress={onClose}
              >
                Təsdiqlə
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
