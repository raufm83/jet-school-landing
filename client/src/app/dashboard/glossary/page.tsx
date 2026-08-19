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
  Switch,
  Tooltip,
  useDisclosure,
  Input,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { MdAdd, MdDelete, MdEdit } from "react-icons/md";
import { toast } from "sonner";
import api from "@/utils/api/axios";
import { useSession } from "next-auth/react";
import { Role } from "@/types/enums";
import DashboardPagination from "@/components/ui/dashboard-pagination";

interface GlossaryTerm {
  id: string;
  term: {
    az: string;
    ru: string;
  };
  definition: {
    az: string;
    ru: string;
  };
  slug: {
    az: string;
    ru: string;
  };
  categoryId?: string;
  authorId?: string;
  published: boolean;
  relatedTerms: string[];
  createdAt: string;
  updatedAt: string;
  category?: {
    name: {
      az: string;
      ru: string;
    };
  };
}

interface GlossaryResponse {
  items: GlossaryTerm[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export default function GlossaryDashboardPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const isAuthor = session?.user?.role === Role.AUTHOR;
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [totalTerms, setTotalTerms] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [includeUnpublished, setIncludeUnpublished] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categories, setCategories] = useState<{id: string, name: {az: string}}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get("/glossary-categories");
      setCategories(Array.isArray(data) ? data : (data.items || []));
    } catch (error) {
      console.error("Kateqoriyaları yükləmə xətası:", error);
    }
  }, []);

  const fetchTerms = useCallback(async () => {
    try {
      setLoading(true);
      const catParam = selectedCategory !== "all" ? `&categoryId=${selectedCategory}` : "";
      // Author üçün yalnız öz terminlərini göstərən endpoint
      if (isAuthor) {
        const { data } = await api.get<GlossaryResponse>(
          `/glossary/my?page=${page}&limit=${rowsPerPage}&includeUnpublished=${includeUnpublished}&search=${debouncedSearch}${catParam}`
        );
        setTerms(data.items);
        setTotalTerms(data.meta.total);
        return;
      }
      const { data } = await api.get<GlossaryResponse>(
        `/glossary?page=${page}&limit=${rowsPerPage}&includeUnpublished=${includeUnpublished}&sortBy=createdAt&order=desc&search=${debouncedSearch}${catParam}`
      );
      setTerms(data.items);
      setTotalTerms(data.meta.total);
    } catch (error) {
      toast.error("Terminlər yüklənə bilmədi");
      console.error("Terminləri yükləmə xətası:", error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, includeUnpublished, isAuthor, debouncedSearch, selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Sessiya yüklənənə qədər göndərmə (xüsusən AUTHOR üçün JWT göndərilməsi üçün)
  useEffect(() => {
    if (sessionStatus === "loading") return;
    fetchTerms();
  }, [sessionStatus, fetchTerms]);


  const handleDelete = async (term: GlossaryTerm) => {
    setSelectedTerm(term);
    onOpen();
  };

  const confirmDelete = async () => {
    if (!selectedTerm) return;

    try {
      await api.delete(`/glossary/${selectedTerm.id}`);
      toast.success("Termin uğurla silindi");
      fetchTerms();
    } catch (error) {
      toast.error("Termini silmək mümkün olmadı");
      console.error("Termini silmə xətası:", error);
    } finally {
      onClose();
      setSelectedTerm(null);
    }
  };

  const togglePublishStatus = async (term: GlossaryTerm) => {
    try {
      await api.patch(`/glossary/${term.id}`, {
        published: !term.published,
      });

      await fetchTerms();
      toast.success(
        `Termin uğurla ${term.published ? "gizlədildi" : "dərc edildi"}`
      );
    } catch (error) {
      toast.error("Status yenilənə bilmədi");
      console.error("Status yeniləmə xətası:", error);
    }
  };

  const columns = [
    { name: "TERMİN", uid: "term" },
    { name: "TƏRİF", uid: "definition" },
    { name: "KATEQORİYA", uid: "category" },
    { name: "STATUS", uid: "status" },
    { name: "YARADILMA TARİXİ", uid: "createdAt" },
    { name: "ƏMƏLİYYATLAR", uid: "actions" },
  ];

  const renderCell = (term: GlossaryTerm, columnKey: string) => {
    switch (columnKey) {
      case "term":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{term.term.az}</p>
            <p className="text-tiny text-default-400">{term.term.ru}</p>
          </div>
        );
      case "definition":
        return (
          <p className="text-small">
            {term.definition.az.length > 100
              ? `${term.definition.az
                  .substring(0, 100)
                  .replace(/<[^>]*>/g, "")}...`
              : term.definition.az.replace(/<[^>]*>/g, "")}
          </p>
        );
      case "category":
        return term.category ? (
          <div className="flex flex-col">
            <p className="text-small">{term.category.name.az}</p>
            <p className="text-tiny text-default-400">
              {term.category.name.ru}
            </p>
          </div>
        ) : (
          <p className="text-small text-default-400">Kateqoriyasız</p>
        );
      case "status":
        return (
          <div className="flex items-center gap-2">
            <Switch
              size="sm"
              color="success"
              isSelected={term.published}
              onValueChange={() => togglePublishStatus(term)}
            />
            <span className="text-xs text-default-500">
              {term.published ? "Aktiv" : "Deaktiv"}
            </span>
          </div>
        );
      case "createdAt":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">
              {new Date(term.createdAt).toLocaleDateString("az-AZ")}
            </p>
            <p className="text-bold text-tiny text-default-400">
              {new Date(term.createdAt).toLocaleTimeString("az-AZ")}
            </p>
          </div>
        );
      case "actions":
        return (
          <div className="flex items-center gap-2 justify-center">
            <Tooltip content="Düzəliş et">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onClick={() =>
                  router.push(`/dashboard/glossary/edit/${term.id}`)
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
                onClick={() => handleDelete(term)}
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Glossariy</h1>
            <p className="text-gray-500">Terminləri idarə edin</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Input
              isClearable
              className="w-full sm:max-w-[300px]"
              placeholder="Termin və ya tərif axtar..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <Select
              className="w-full sm:max-w-[200px]"
              placeholder="Bütün kateqoriyalar"
              selectedKeys={[selectedCategory]}
              onChange={(e) => {
                setSelectedCategory(e.target.value || "all");
                setPage(1);
              }}
              items={[
                { id: "all", name: { az: "Bütün kateqoriyalar" } },
                ...categories,
              ]}
            >
              {(cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name.az}
                </SelectItem>
              )}
            </Select>
            <div className="flex gap-3">
              {!isAuthor && (
                <Button
                  color="warning"
                  variant="flat"
                  onClick={() => router.push("/dashboard/glossary/categories")}
                >
                  Kateqoriyalar
                </Button>
              )}
              <Button
                color="primary"
                className="bg-jsyellow text-white"
                startContent={<MdAdd size={24} />}
                onClick={() => router.push("/dashboard/glossary/create")}
              >
                Yeni Termin
              </Button>
            </div>
          </div>
        </div>

        <Table
          aria-label="Terminlər cədvəli"
          bottomContent={
            <div className="flex w-full justify-center">
              <DashboardPagination
                page={page}
                total={Math.ceil(totalTerms / rowsPerPage)}
                onChange={(p) => setPage(p)}
              />
            </div>
          }
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={
                  column.uid === "actions" || column.uid === "status"
                    ? "center"
                    : "start"
                }
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={terms}
            loadingContent={<div>Yüklənir...</div>}
            loadingState={loading ? "loading" : "idle"}
            emptyContent={"Heç bir termin tapılmadı"}
          >
            {(term) => (
              <TableRow key={term.id}>
                {columns.map((column) => (
                  <TableCell key={column.uid}>
                    {renderCell(term, column.uid)}
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
                <ModalHeader>Termini Sil</ModalHeader>
                <ModalBody>
                  <p>
                    &quot;{selectedTerm?.term.az}&quot; terminini silmək
                    istədiyinizə əminsiniz?
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
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
              </>
            )}
          </ModalContent>
        </Modal>
      </motion.div>
    </div>
  );
}
