"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
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
import { MdAdd, MdDelete, MdEdit, MdArrowUpward, MdArrowDownward } from "react-icons/md";
import { toast } from "sonner";
import api from "@/utils/api/axios";
import { StudentReview } from "@/types/student-reviews";
import DashboardPagination from "@/components/ui/dashboard-pagination";

interface ReviewsResponse {
  items: StudentReview[];
  meta: { total: number; page: number; limit: number };
}

export default function StudentReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<StudentReview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selected, setSelected] = useState<StudentReview | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<ReviewsResponse>(
        `/student-reviews?page=${page}&limit=${rowsPerPage}&sortBy=order&order=desc`
      );
      setReviews(data.items);
      setTotal(data.meta.total);
    } catch (error) {
      toast.error("Rəylər yüklənə bilmədi");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDelete = (review: StudentReview) => {
    setSelected(review);
    onOpen();
  };

  const confirmDelete = async () => {
    if (!selected) return;
    try {
      await api.delete(`/student-reviews/${selected.id}`);
      toast.success("Rəy silindi");
      fetchReviews();
    } catch {
      toast.error("Rəyi silmək mümkün olmadı");
    } finally {
      onClose();
      setSelected(null);
    }
  };

  const handleMove = async (review: StudentReview, direction: "up" | "down") => {
    const newOrder = direction === "up" ? review.order + 1 : review.order - 1;
    if (newOrder < 0) return;
    try {
      await api.patch(`/student-reviews/${review.id}`, { order: newOrder });
      toast.success("Sıra yeniləndi");
      fetchReviews();
    } catch {
      toast.error("Sıra yenilənə bilmədi");
    }
  };

  const columns = [
    { name: "BAŞLIQ", uid: "title" },
    { name: "KURS", uid: "course" },
    { name: "SIRA", uid: "order" },
    { name: "TARİX", uid: "createdAt" },
    { name: "ƏMƏLİYYATLAR", uid: "actions" },
  ];

  const renderCell = (review: StudentReview, columnKey: string) => {
    const title = (review.title as { az?: string; ru?: string }) || {};
    const courseTitle = (review.course?.title as { az?: string; ru?: string }) || {};
    switch (columnKey) {
      case "title":
        return (
          <p className="font-semibold text-sm max-w-[200px] truncate">
            {title.az || title.ru || "—"}
          </p>
        );
      case "course":
        return (
          <p className="text-small">
            {courseTitle.az || courseTitle.ru || "—"}
          </p>
        );
      case "order":
        return (
          <div className="flex flex-col gap-1 items-center">
            <Tooltip content="Yuxarı">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                isDisabled={review.order === total - 1}
                onClick={() => handleMove(review, "up")}
              >
                <MdArrowUpward className="text-default-400" size={20} />
              </Button>
            </Tooltip>
            <span className="text-tiny text-default-400">
              Sıra: {total - review.order}
            </span>
            <Tooltip content="Aşağı">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                isDisabled={review.order === 0}
                onClick={() => handleMove(review, "down")}
              >
                <MdArrowDownward className="text-default-400" size={20} />
              </Button>
            </Tooltip>
          </div>
        );
      case "createdAt":
        return (
          <p className="text-small">
            {new Date(review.createdAt).toLocaleDateString("az-AZ")}
          </p>
        );
      case "actions":
        return (
          <div className="flex items-center gap-2">
            <Tooltip content="Düzəliş">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onClick={() =>
                  router.push(`/dashboard/student-reviews/edit/${review.id}`)
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
                onClick={() => handleDelete(review)}
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

  return (
    <div className="p-6 w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Rəylər</h1>
            <p className="text-gray-500">Rəyləri idarə edin</p>
          </div>
          <Button
            color="primary"
            className="bg-jsyellow text-white"
            startContent={<MdAdd size={24} />}
            onClick={() => router.push("/dashboard/student-reviews/create")}
          >
            Yeni Rəy
          </Button>
        </div>

        <Table
          aria-label="Rəylər cədvəli"
          bottomContent={
            <div className="flex w-full justify-center">
              <DashboardPagination
                page={page}
                total={Math.max(1, Math.ceil(total / rowsPerPage))}
                onChange={setPage}
              />
            </div>
          }
        >
          <TableHeader columns={columns}>
            {(col) => (
              <TableColumn
                key={col.uid}
                align={col.uid === "actions" ? "center" : "start"}
              >
                {col.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={reviews}
            loadingContent={<div>Yüklənir...</div>}
            loadingState={loading ? "loading" : "idle"}
          >
            {(item) => (
              <TableRow key={item.id}>
                {columns.map((col) => (
                  <TableCell key={col.uid}>
                    {renderCell(item, col.uid)}
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
                <ModalHeader>Rəyi sil</ModalHeader>
                <ModalBody>
                  <p>
                    &quot;
                    {(selected?.title as { az?: string })?.az ||
                      (selected?.title as { ru?: string })?.ru ||
                      "Bu rəy"}
                    &quot; silinsin?
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
