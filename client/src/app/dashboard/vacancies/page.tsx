"use client";

import type { Vacancy, VacancyListResponse } from "@/types/vacancy";
import api from "@/utils/api/axios";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Switch,
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
import { MdAdd, MdDelete, MdEdit, MdRestore } from "react-icons/md";
import { toast } from "sonner";
import DashboardPagination from "@/components/ui/dashboard-pagination";

export default function VacanciesAdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<Vacancy[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selected, setSelected] = useState<Vacancy | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [repairing, setRepairing] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<VacancyListResponse>(
        `/vacancies/manage?page=${page}&limit=${rowsPerPage}`
      );
      setItems(data.items);
      setTotal(data.meta.total);
    } catch (e) {
      toast.error("Vakansiyalar yüklənə bilmədi");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleDelete = (row: Vacancy) => {
    setSelected(row);
    onOpen();
  };

  const confirmDelete = async () => {
    if (!selected) return;
    try {
      await api.delete(`/vacancies/manage/${selected.id}`);
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

  const handleRepairVisibility = async () => {
    if (
      !window.confirm(
        "Bütün hazırda deaktiv olan vakansiyalar aktiv ediləcək. Köhnə sistem avtomatik söndürdüyü elanları belə bərpa edə bilərsiniz; istəmədiklərinizi sonra yenidən söndürün. Davam?"
      )
    ) {
      return;
    }
    try {
      setRepairing(true);
      const { data } = await api.patch<{ updated: number }>(
        "/vacancies/manage/repair-visibility"
      );
      toast.success(`${data.updated} vakansiya aktivləşdirildi`);
      await fetchList();
    } catch (e) {
      toast.error("Bərpa alınmadı");
      console.error(e);
    } finally {
      setRepairing(false);
    }
  };

  const toggleActive = async (row: Vacancy, next: boolean) => {
    try {
      setTogglingId(row.id);
      await api.patch(`/vacancies/manage/${row.id}`, { isActive: next });
      setItems((prev) =>
        prev.map((x) => (x.id === row.id ? { ...x, isActive: next } : x))
      );
      toast.success("Yeniləndi");
    } catch (e) {
      toast.error("Status dəyişmədi");
      console.error(e);
      fetchList();
    } finally {
      setTogglingId(null);
    }
  };

  const columns = [
    { name: "SIRA", uid: "order" },
    { name: "AD (AZ)", uid: "tAz" },
    { name: "AD (RU)", uid: "tRu" },
    { name: "AKTİV", uid: "active" },
    { name: "ƏMƏLİYYATLAR", uid: "actions" },
  ];

  const renderCell = (row: Vacancy, columnKey: string) => {
    switch (columnKey) {
      case "order":
        return <span className="text-small">{row.order}</span>;
      case "tAz":
        return (
          <p className="text-small max-w-md whitespace-normal break-words">
            {row.title?.az || "—"}
          </p>
        );
      case "tRu":
        return (
          <p className="text-small max-w-md whitespace-normal break-words">
            {row.title?.ru || "—"}
          </p>
        );
      case "active":
        return (
          <Switch
            size="sm"
            isSelected={row.isActive}
            isDisabled={togglingId === row.id}
            onValueChange={(v) => toggleActive(row, v)}
            aria-label="Aktiv"
          />
        );
      case "actions":
        return (
          <div className="flex items-center gap-2">
            <Tooltip content="Redaktə">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={() =>
                  router.push(`/dashboard/vacancies/edit/${row.id}`)
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Vakansiyalar</h1>
            <p className="text-gray-500 text-sm">
              Saytda &quot;Faydalı&quot; menyusunda və /vacancies səhifəsində
              göstərilir (yalnız aktivlər).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="bordered"
              isLoading={repairing}
              startContent={!repairing ? <MdRestore size={22} /> : undefined}
              onPress={handleRepairVisibility}
            >
              Deaktivləri bərpa et
            </Button>
            <Button
              color="primary"
              className="bg-jsyellow text-white"
              startContent={<MdAdd size={24} />}
              onPress={() => router.push("/dashboard/vacancies/create")}
            >
              Yeni vakansiya
            </Button>
          </div>
        </div>

        <Table
          aria-label="Vakansiyalar cədvəli"
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
            {(col) => (
              <TableColumn
                key={col.uid}
                align={col.uid === "active" ? "center" : "start"}
              >
                {col.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={items}
            loadingContent={<div>Yüklənir...</div>}
            loadingState={loading ? "loading" : "idle"}
            emptyContent="Heç bir vakansiya yoxdur"
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
          <ModalHeader>Silinsin?</ModalHeader>
          <ModalBody>
            <p>
              «{selected?.title?.az || selected?.id}» vakansiyası silinəcək.
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
