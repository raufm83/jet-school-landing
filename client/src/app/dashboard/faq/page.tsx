"use client";

import { FaqItem, FaqListResponse } from "@/types/faq";
import api from "@/utils/api/axios";
import {
  Button,
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
import { useCallback, useEffect, useState } from "react";
import { MdAdd, MdDelete, MdEdit, MdSearch } from "react-icons/md";
import { toast } from "sonner";
import DashboardPagination from "@/components/ui/dashboard-pagination";

interface CourseOption {
  id: string;
  title: { az: string; ru: string };
  slug: { az: string; ru: string };
}

const formatPageName = (page: string) => {
  if (page === "home") return "Ana səhifə";
  if (page === "about") return "Haqqımızda";
  if (page === "courses") return "Kurslar";
  return page;
};

async function fetchAllCoursesForFaq(): Promise<CourseOption[]> {
  try {
    const limit = 100;
    let page = 1;
    const all: CourseOption[] = [];
    let totalPages = 1;
    do {
      const { data } = await api.get<{
        items?: CourseOption[];
        meta?: { totalPages?: number };
      }>(`/courses?limit=${limit}&page=${page}&includeUnpublished=true`);
      const items = data?.items ?? [];
      all.push(...items);
      totalPages = data?.meta?.totalPages ?? 1;
      page += 1;
    } while (page <= totalPages && totalPages > 0);
    return all;
  } catch (e) {
    console.error("Failed to fetch courses for FAQ dashboard", e);
    return [];
  }
}

export default function FaqAdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selected, setSelected] = useState<FaqItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageFilter, setPageFilter] = useState<string>("all");
  const [courses, setCourses] = useState<CourseOption[]>([]);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch up to 100 items so we can search/filter client-side across the entire dataset
      const { data } = await api.get<FaqListResponse>(
        `/faq?page=1&limit=100`
      );
      setItems(data.items);
    } catch (e) {
      toast.error("FAQ siyahısı yüklənə bilmədi");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchAllCoursesForFaq().then((items) => {
      setCourses(items);
    });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageFilter]);

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
    { name: "SUAL (EN)", uid: "qRu" },
    { name: "SƏHİFƏ", uid: "page" },
    { name: "ƏMƏLİYYATLAR", uid: "actions" },
  ];

  const pageSelectItems = [
    { key: "all", label: "Hamısı (Bütün Səhifələr)" },
    { key: "home", label: "Ana səhifə" },
    { key: "about", label: "Haqqımızda" },
    { key: "courses", label: "Kurslar" },
    ...courses.map((c) => {
      const slug = String(c.slug?.az ?? c.id ?? "").trim() || String(c.id);
      return {
        key: `course:${slug}`,
        label: `course:${slug}`,
      };
    }),
  ];

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.question?.az?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.question?.ru?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer?.az?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer?.ru?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPage =
      pageFilter === "all" ||
      (item.pages && item.pages.includes(pageFilter)) ||
      item.page === pageFilter;

    return matchesSearch && matchesPage;
  });

  const filteredTotal = filteredItems.length;

  const paginatedItems = filteredItems.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

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
        const pagesList = row.pages && Array.isArray(row.pages) ? row.pages.filter(Boolean) : [];
        if (pagesList.length === 0 && row.page) {
          pagesList.push(row.page);
        }
        if (pagesList.length === 0) {
          return <span className="text-gray-400">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {pagesList.map((p) => (
              <span
                key={p}
                className="px-2 py-0.5 text-xs font-medium bg-jsyellow/10 text-jsblack rounded-md border border-jsyellow/30"
              >
                {formatPageName(p)}
              </span>
            ))}
          </div>
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
        <div className="flex flex-row justify-between items-center mb-6 w-full">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 bg-jsyellow text-white rounded-xl font-bold shadow-md shadow-jsyellow/20">
              <span className="text-xl">?</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">FAQ</h1>
              <p className="text-gray-500 text-xs sm:text-sm">
                Tez-tez verilən suallar — AZ və EN.
              </p>
            </div>
          </div>
          <Button
            className="bg-jsyellow text-white font-semibold rounded-xl shadow-md hover:bg-[#e59d10] transition-colors"
            startContent={<MdAdd size={20} />}
            onPress={() => router.push("/dashboard/faq/create")}
          >
            Yeni FAQ
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full">
          <Input
            placeholder="Sual və ya cavab ilə axtar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="md"
            className="flex-1"
            startContent={<MdSearch className="text-gray-400" size={20} />}
            classNames={{
              inputWrapper: "bg-white hover:bg-gray-50 border border-gray-200 focus-within:border-jsyellow rounded-xl h-11 shadow-sm transition-colors",
            }}
          />
          <Select
            aria-label="Səhifə Filtri"
            placeholder="Hamısı (Bütün Səhifələr)"
            selectedKeys={pageFilter ? [pageFilter] : ["all"]}
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0] as string | undefined;
              setPageFilter(key ?? "all");
            }}
            size="md"
            className="w-full sm:w-[280px]"
            classNames={{
              trigger: "bg-white hover:bg-gray-50 border border-gray-200 data-[open=true]:border-jsyellow rounded-xl h-11 shadow-sm transition-colors",
            }}
          >
            {pageSelectItems.map((item) => (
              <SelectItem key={item.key} textValue={item.label}>
                {item.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        <Table
          aria-label="FAQ cədvəli"
          bottomContent={
            filteredTotal > rowsPerPage ? (
              <div className="flex w-full justify-center">
                <DashboardPagination
                  page={page}
                  total={Math.max(1, Math.ceil(filteredTotal / rowsPerPage))}
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
            items={paginatedItems}
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
