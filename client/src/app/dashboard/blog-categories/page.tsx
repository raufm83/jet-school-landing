"use client";

import DashboardPagination from "@/components/ui/dashboard-pagination";
import { BlogCategory, BlogCategoryListResponse } from "@/types/blog-category";
import api from "@/utils/api/axios";
import { formatApiError } from "@/utils/api/formatApiError";
import {
  Button,
  Input,
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
import { useCallback, useEffect, useState } from "react";
import { MdAdd, MdDelete, MdEdit } from "react-icons/md";
import { toast } from "sonner";

const PAGE_SIZE = 20;

export default function BlogCategoriesAdminPage() {
  const [items, setItems] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const {
    isOpen: isEditorOpen,
    onOpen: onEditorOpen,
    onClose: onEditorClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [editing, setEditing] = useState<BlogCategory | null>(null);
  const [formAz, setFormAz] = useState("");
  const [formRu, setFormRu] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<BlogCategory | null>(null);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<BlogCategoryListResponse>(
        `/blog-categories?limit=500`
      );
      setItems(data.items ?? []);
    } catch (e) {
      toast.error(formatApiError(e, "Kateqoriyalar yüklənə bilmədi"));
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openCreate = () => {
    setEditing(null);
    setFormAz("");
    setFormRu("");
    onEditorOpen();
  };

  const openEdit = (row: BlogCategory) => {
    setEditing(row);
    setFormAz(row.name?.az ?? "");
    setFormRu(row.name?.ru ?? "");
    onEditorOpen();
  };

  const saveCategory = async () => {
    if (!formAz.trim() || !formRu.trim()) {
      toast.error("Hər iki dil üçün ad daxil edin.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/blog-categories/${editing.id}`, {
          name: { az: formAz.trim(), ru: formRu.trim() },
        });
        toast.success("Kateqoriya yeniləndi");
      } else {
        await api.post("/blog-categories", {
          name: { az: formAz.trim(), ru: formRu.trim() },
        });
        toast.success("Kateqoriya yaradıldı");
      }
      onEditorClose();
      await fetchList();
    } catch (e) {
      toast.error(formatApiError(e, "Əməliyyat alınmadı"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteRow = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/blog-categories/${deleteTarget.id}`);
      toast.success("Silindi");
      onDeleteClose();
      setDeleteTarget(null);
      fetchList();
    } catch (e) {
      toast.error(formatApiError(e, "Silinmədi"));
    }
  };

  const start = (page - 1) * PAGE_SIZE;
  const slice = items.slice(start, start + PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  const columns = [
    { name: "AD (AZ)", uid: "az" },
    { name: "AD (RU)", uid: "ru" },
    { name: "POST SAYI", uid: "count" },
    { name: "ƏMƏLİYYATLAR", uid: "actions" },
  ];

  const renderCell = (row: BlogCategory, uid: string) => {
    switch (uid) {
      case "az":
        return <span className="text-small">{row.name?.az || "—"}</span>;
      case "ru":
        return <span className="text-small">{row.name?.ru || "—"}</span>;
      case "count":
        return (
          <span className="text-small text-default-500">
            {row._count?.posts ?? 0}
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
                onPress={() => openEdit(row)}
              >
                <MdEdit className="text-default-400" size={20} />
              </Button>
            </Tooltip>
            <Tooltip content="Sil" color="danger">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={() => {
                  setDeleteTarget(row);
                  onDeleteOpen();
                }}
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
    <div className="w-full p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bloq kateqoriyaları</h1>
            <p className="text-default-500 text-sm">
              Bloq postları üçün mövzular yaradın; hər yazıya bir kateqoriya seçə
              bilərsiniz.
            </p>
          </div>
          <Button
            className="bg-jsyellow text-white"
            startContent={<MdAdd size={22} />}
            onPress={openCreate}
          >
            Yeni kateqoriya
          </Button>
        </div>

        <Table
          aria-label="Bloq kateqoriyaları"
          isHeaderSticky
          bottomContent={
            items.length > PAGE_SIZE ? (
              <div className="flex w-full justify-center py-3">
                <DashboardPagination
                  page={page}
                  total={totalPages}
                  onChange={setPage}
                />
              </div>
            ) : undefined
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
            items={slice}
            isLoading={loading}
            loadingContent="Yüklənir..."
            emptyContent="Hələ kateqoriya yoxdur"
          >
            {(row) => (
              <TableRow key={row.id}>
                {(columnKey) => (
                  <TableCell>{renderCell(row, String(columnKey))}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>

      <Modal isOpen={isEditorOpen} onClose={onEditorClose} size="lg">
        <ModalContent>
          <>
            <ModalHeader>
              {editing ? "Kateqoriya — redaktə" : "Yeni kateqoriya"}
            </ModalHeader>
            <ModalBody className="gap-4">
              <Input
                label="Ad (AZ)"
                variant="bordered"
                value={formAz}
                onValueChange={setFormAz}
              />
              <Input
                label="Название (RU)"
                variant="bordered"
                value={formRu}
                onValueChange={setFormRu}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onEditorClose}>
                Ləğv
              </Button>
              <Button
                className="bg-jsyellow text-white"
                isLoading={saving}
                onPress={() => saveCategory()}
              >
                Saxla
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          <>
            <ModalHeader>Kateqoriyanı sil</ModalHeader>
            <ModalBody>
              <p>
                «
                <strong>{deleteTarget?.name?.az}</strong>» silinsin? Əlaqəli
                bloqlarda kateqoriya boşalacaq.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onDeleteClose}>
                Ləğv
              </Button>
              <Button color="danger" onPress={confirmDeleteRow}>
                Sil
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </div>
  );
}
