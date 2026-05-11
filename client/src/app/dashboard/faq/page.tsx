"use client";

import { FaqItem, FaqListResponse } from "@/types/faq";
import api from "@/utils/api/axios";
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
import { useCallback, useEffect, useState } from "react";
import { MdAdd, MdDelete, MdEdit } from "react-icons/md";
import { toast } from "sonner";
import DashboardPagination from "@/components/ui/dashboard-pagination";

export default function FaqAdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selected, setSelected] = useState<FaqItem | null>(null);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<FaqListResponse>(
        `/faq?page=${page}&limit=${rowsPerPage}`
      );
      setItems(data.items);
      setTotal(data.meta.total);
    } catch (e) {
      toast.error("FAQ siyahısı yüklənə bilmədi");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleDelete = (row: FaqItem) => {
    setSelected(row);
    onOpen();
  };

  const confirmDelete = async () => {
    if (!selected) return;
    try {
      await api.delete(`/faq/${selected.id}`);
      toast.success("Silindi");
      fetchList();
    } catch (e) {
      toast.error("Silinmədi");
      console.error(e);
    } finally {
      onClose();
      setSelected(null);
    }
  };

  const columns = [
    { name: "SIRA", uid: "order" },
    { name: "SUAL (AZ)", uid: "qAz" },
    { name: "SUAL (RU)", uid: "qRu" },
    { name: "SƏHİFƏ", uid: "page" },
    { name: "ƏMƏLİYYATLAR", uid: "actions" },
  ];

  const renderCell = (row: FaqItem, columnKey: string) => {
    switch (columnKey) {
      case "order":
        return <span className="text-small">{row.order}</span>;
      case "qAz":
        return (
          <p className="text-small max-w-[220px] line-clamp-2">
            {row.question?.az || "—"}
          </p>
        );
      case "qRu":
        return (
          <p className="text-small max-w-[220px] line-clamp-2">
            {row.question?.ru || "—"}
          </p>
        );
      case "page":
        return (
          <span className="text-small text-gray-500">
            {row.page || "—"}
          </span>
        );
      case "actions":
        return (
          <div className="flex items-center gap-2">
            <Tooltip content="Redaktə">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={() => router.push(`/dashboard/faq/edit/${row.id}`)}
              >
                <MdEdit className="text-default-400" size={20} />
              </Button>
            </Tooltip>
            <Tooltip content="Sil" color="danger">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={() => handleDelete(row)}
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
            <h1 className="text-2xl font-bold">FAQ</h1>
            <p className="text-gray-500 text-sm">
              Tez-tez verilən suallar — hər FAQ üçün hansı səhifədə görünəcəyini seçin.
            </p>
          </div>
          <Button
            color="primary"
            className="bg-jsyellow text-white"
            startContent={<MdAdd size={24} />}
            onPress={() => router.push("/dashboard/faq/create")}
          >
            Yeni FAQ
          </Button>
        </div>

        <Table
          aria-label="FAQ cədvəli"
          bottomContent={
            total > rowsPerPage ? (
              <div className="flex w-full justify-center">
                <DashboardPagination
                  page={page}
                  total={Math.max(1, Math.ceil(total / rowsPerPage))}
                  onChange={setPage}
                />
              </div>
            ) : null
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
            items={items}
            loadingContent={<div>Yüklənir...</div>}
            loadingState={loading ? "loading" : "idle"}
          >
            {(row) => (
              <TableRow key={row.id}>
                {columns.map((column) => (
                  <TableCell key={column.uid}>
                    {renderCell(row, column.uid)}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>FAQ silinsin?</ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-600">
              Bu əməliyyat geri qaytarıla bilməz.
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
        </ModalContent>
      </Modal>
    </div>
  );
}
