import api from "@/utils/api/axios";
import { slugifyText } from "@/utils/slugify";
import {
  Button,
  Card,
  Checkbox,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea,
} from "@nextui-org/react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useState, useCallback, useMemo } from "react";
import { MdCategory, MdDescription, MdSearch, MdTitle, MdAdd } from "react-icons/md";
import "react-quill/dist/quill.snow.css";
import { debounce } from "lodash";
import { toast } from "sonner";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ color: [] }, { background: [] }],
    ["link"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "link",
  "color",
  "background",
];

interface GlossaryCategory {
  id: string;
  name: {
    az: string;
    ru: string;
  };
}

interface GlossaryTerm {
  id: string;
  name: {
    az: string;
    ru: string;
  };
  categoryId?: string;
  category?: {
    name: {
      az: string;
      ru: string;
    };
  };
}

interface GlossaryFormProps {
  mode: "create" | "edit";
  onSubmit: (data: any) => Promise<void>;
  register: any;
  errors: any;
  isSubmitting: boolean;
  handleSubmit: any;
  router: any;
  setValue?: any;
  getValues?: any;
  watch?: any;
  initialValues?: any;
  isAuthor?: boolean;
}

export default function GlossaryForm({
  mode,
  onSubmit,
  register,
  errors,
  isSubmitting,
  handleSubmit,
  router,
  setValue,
  watch,
  initialValues,
  isAuthor = false,
}: GlossaryFormProps) {
  const [categories, setCategories] = useState<GlossaryCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [relatedTerms, setRelatedTerms] = useState<GlossaryTerm[]>([]);
  const [isLoadingTerms, setIsLoadingTerms] = useState(false);
  const [selectedRelatedTerms, setSelectedRelatedTerms] = useState<string[]>(
    initialValues?.relatedTerms || []
  );
  const [searchTerm, setSearchTerm] = useState("");
  
  // Lazy loading state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const TERMS_PER_PAGE = 20;

  const [definitionAz, setDefinitionAz] = useState("");
  const [definitionRu, setDefinitionRu] = useState("");
  
  // Kateqoriya yaratma modalı
  const { isOpen: isCategoryModalOpen, onOpen: onCategoryModalOpen, onClose: onCategoryModalClose } = useDisclosure();
  const [newCategoryNameAz, setNewCategoryNameAz] = useState("");
  const [newCategoryNameRu, setNewCategoryNameRu] = useState("");
  const [newCategoryDescriptionAz, setNewCategoryDescriptionAz] = useState("");
  const [newCategoryDescriptionRu, setNewCategoryDescriptionRu] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  useEffect(() => {
    if (mode === "edit") {
      const watchedDefAz = watch("definition.az");
      const watchedDefRu = watch("definition.ru");
      if (watchedDefAz) setDefinitionAz(watchedDefAz);
      if (watchedDefRu) setDefinitionRu(watchedDefRu);
    }
  }, [mode, watch]);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get("/glossary-categories");
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryNameAz.trim() || !newCategoryNameRu.trim()) {
      toast.error("Kateqoriya adı (AZ və RU) tələb olunur");
      return;
    }

    try {
      setIsCreatingCategory(true);
      const categoryData = {
        name: {
          az: newCategoryNameAz.trim(),
          ru: newCategoryNameRu.trim(),
        },
        slug: {
          az: slugifyText(newCategoryNameAz.trim()),
          ru: slugifyText(newCategoryNameRu.trim()),
        },
        description: {
          az: newCategoryDescriptionAz.trim() || "",
          ru: newCategoryDescriptionRu.trim() || "",
        },
        order: 0,
      };

      const { data } = await api.post("/glossary-categories", categoryData);
      
      // Yeni kateqoriyanı siyahıya əlavə et
      setCategories((prev) => [...prev, data]);
      
      // Yeni kateqoriyanı seç
      if (setValue) {
        setValue("categoryId", data.id);
      }
      
      toast.success("Kateqoriya uğurla yaradıldı");
      
      // Modalı bağla və formu təmizlə
      onCategoryModalClose();
      setNewCategoryNameAz("");
      setNewCategoryNameRu("");
      setNewCategoryDescriptionAz("");
      setNewCategoryDescriptionRu("");
    } catch (error: any) {
      console.error("Kateqoriya yaratma xətası:", error);
      toast.error(
        error.response?.data?.message || "Kateqoriya yaradıla bilmədi"
      );
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const fetchRelatedTerms = useCallback(async (pageNum: number, search: string, isNewSearch: boolean, catId?: string) => {
    try {
      setIsLoadingTerms(true);
      const excludeIdParam = mode === "edit" && initialValues?.id ? `&excludeId=${initialValues.id}` : "";
      const url = `/glossary/search?q=${encodeURIComponent(search)}&page=${pageNum}&limit=${TERMS_PER_PAGE}${catId ? `&categoryId=${catId}` : ""}${excludeIdParam}&includeUnpublished=true`;
      const { data } = await api.get(url);

      const terms = Array.isArray(data.items)
        ? data.items.map((item: any) => ({
            id: item.id,
            name: {
              az: item.term?.az || "", 
              ru: item.term?.ru || "",
            },
            categoryId: item.categoryId,
            category: item.category,
          }))
        : [];

      setRelatedTerms(prev => isNewSearch ? terms : [...prev, ...terms]);
      setHasMore(terms.length === TERMS_PER_PAGE);
    } catch (error: any) {
      console.error("Error fetching related terms:", error.message, error.response?.data);
      if (isNewSearch) setRelatedTerms([]);
    } finally {
      setIsLoadingTerms(false);
    }
  }, [mode, initialValues]);

  // Debounced search — `useMemo` ilə stabil referans, exhaustive-deps tələblərini ödəyir
  const debouncedSearch = useMemo(
    () =>
      debounce((term: string, catId?: string) => {
        setPage(1);
        setRelatedTerms([]);
        setHasMore(true);
        void fetchRelatedTerms(1, term, true, catId);
      }, 500),
    [fetchRelatedTerms],
  );

  useEffect(() => {
    void fetchCategories();
  }, []);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const watchedCategoryId = watch("categoryId");

  // Axtarış / kateqoriya sinxronu
  useEffect(() => {
    if (isLoadingCategories) return;
    debouncedSearch(searchTerm, watchedCategoryId);
  }, [isLoadingCategories, searchTerm, watchedCategoryId, debouncedSearch]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !isLoadingTerms) {
      const nextPage = page + 1;
      setPage(nextPage);
      const currentCategoryId = watch("categoryId");
      fetchRelatedTerms(nextPage, searchTerm, false, currentCategoryId);
    }
  };

  useEffect(() => {
    if (initialValues?.relatedTerms) {
      setSelectedRelatedTerms(initialValues.relatedTerms);
    }
  }, [initialValues]);

  const handleRelatedTermChange = (termId: string) => {
    let newSelected;

    if (selectedRelatedTerms.includes(termId)) {
      newSelected = selectedRelatedTerms.filter((id) => id !== termId);
    } else {
      newSelected = [...selectedRelatedTerms, termId];
    }

    setSelectedRelatedTerms(newSelected);
    if (setValue) {
      setValue("relatedTerms", newSelected);
    }
  };

  const handleDefinitionChange = (value: string, lang: string) => {
    if (setValue) {
      setValue(`definition.${lang}`, value);
    }
    if (lang === "az") {
      setDefinitionAz(value);
    } else {
      setDefinitionRu(value);
    }
  };

  const handleTermChange = (lang: string, value: string) => {
    const slugValue = slugifyText(value);
    setValue(`slug.${lang}`, slugValue);
  };

  return (
    <div className="p-6 min-h-screen w-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <Card className="w-full max-w-4xl p-6 bg-white shadow-lg mx-auto">
          <div className="text-center mb-8">
            <motion.h1
              className="text-2xl font-bold text-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {mode === "create" ? "Yeni Termin Yarat" : "Terminə Düzəliş Et"}
            </motion.h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  label="Termin (AZ)"
                  variant="bordered"
                  startContent={<MdTitle className="text-gray-400" />}
                  isDisabled={isSubmitting}
                  {...register("term.az", {
                    required: "Termin tələb olunur",
                    minLength: {
                      value: 2,
                      message: "Termin ən azı 2 simvol olmalıdır",
                    },
                    onChange: (e: any) =>
                      handleTermChange("az", e.target.value),
                  })}
                  isInvalid={!!errors.term?.az}
                  errorMessage={errors.term?.az?.message}
                  classNames={{
                    input: "bg-transparent",
                    inputWrapper: [
                      "bg-white border-2 hover:border-primary focus:border-primary",
                    ],
                  }}
                />
              </div>

              <div className="space-y-2">
                <Input
                  type="text"
                  label="Термин (RU)"
                  variant="bordered"
                  startContent={<MdTitle className="text-gray-400" />}
                  isDisabled={isSubmitting}
                  {...register("term.ru", {
                    required: "Термин обязателен",
                    minLength: {
                      value: 2,
                      message: "Минимум 2 символа",
                    },
                    onChange: (e: any) =>
                      handleTermChange("ru", e.target.value),
                  })}
                  isInvalid={!!errors.term?.ru}
                  errorMessage={errors.term?.ru?.message}
                  classNames={{
                    input: "bg-transparent",
                    inputWrapper: [
                      "bg-white border-2 hover:border-primary focus:border-primary",
                    ],
                  }}
                />
              </div>

              <div className="space-y-2">
                <Input
                  type="text"
                  label="Slug (AZ)"
                  variant="bordered"
                  startContent={<MdTitle className="text-gray-400" />}
                  isReadOnly={true}
                  {...register("slug.az")}
                  isInvalid={!!errors.slug?.az}
                  errorMessage={errors.slug?.az?.message}
                  classNames={{
                    input: "bg-transparent",
                    inputWrapper: [
                      "bg-white border-2 hover:border-primary focus:border-primary",
                    ],
                  }}
                />
              </div>

              <div className="space-y-2">
                <Input
                  type="text"
                  label="Slug (RU)"
                  variant="bordered"
                  startContent={<MdTitle className="text-gray-400" />}
                  isReadOnly={true}
                  {...register("slug.ru")}
                  isInvalid={!!errors.slug?.ru}
                  errorMessage={errors.slug?.ru?.message}
                  classNames={{
                    input: "bg-transparent",
                    inputWrapper: [
                      "bg-white border-2 hover:border-primary focus:border-primary",
                    ],
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select
                    label="Kateqoriya"
                    variant="bordered"
                    startContent={<MdCategory className="text-gray-400" />}
                    isDisabled={isSubmitting || isLoadingCategories}
                    {...register("categoryId")}
                    isInvalid={!!errors.categoryId}
                    errorMessage={errors.categoryId?.message}
                    classNames={{
                      trigger:
                        "bg-white border-2 hover:border-primary focus:border-primary",
                      value: "bg-transparent",
                    }}
                    isLoading={isLoadingCategories}
                    className="flex-1"
                  >
                    {categories.map((category: GlossaryCategory) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name.az}
                      </SelectItem>
                    ))}
                  </Select>
                  {isAuthor && (
                    <Button
                      isIconOnly
                      color="primary"
                      className="bg-jsyellow text-white mt-6"
                      onClick={onCategoryModalOpen}
                      aria-label="Yeni kateqoriya yarat"
                    >
                      <MdAdd size={20} />
                    </Button>
                  )}
                </div>
              </div>

              {!isAuthor && (
                <div className="space-y-2 pt-4">
                  <Checkbox
                    isSelected={watch ? watch("published") : false}
                    onValueChange={(value) =>
                      setValue && setValue("published", value)
                    }
                    size="lg"
                    color="success"
                  >
                    Dərc edilsin
                  </Checkbox>
                </div>
              )}
              {isAuthor && (
                <div className="space-y-2 pt-4">
                  <p className="text-sm text-gray-500">
                    Termin yaradıldıqdan sonra admin tərəfindən dərc ediləcək.
                  </p>
                  <input type="hidden" {...register("published")} value="false" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MdDescription className="text-gray-400" />
                  Tərif (AZ)
                </label>
                <div className="h-64">
                  <ReactQuill
                    theme="snow"
                    value={definitionAz}
                    onChange={(value) => handleDefinitionChange(value, "az")}
                    modules={modules}
                    formats={formats}
                    className="h-48 bg-white"
                    readOnly={isSubmitting}
                  />
                </div>
                {errors.definition?.az && (
                  <p className="text-danger text-sm">
                    {errors.definition.az.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MdDescription className="text-gray-400" />
                  Определение (RU)
                </label>
                <div className="h-64">
                  <ReactQuill
                    theme="snow"
                    value={definitionRu}
                    onChange={(value) => handleDefinitionChange(value, "ru")}
                    modules={modules}
                    formats={formats}
                    className="h-48 bg-white"
                    readOnly={isSubmitting}
                  />
                </div>
                {errors.definition?.ru && (
                  <p className="text-danger text-sm">
                    {errors.definition.ru.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-medium">Əlaqəli Terminlər</h3>
              <Input
                type="text"
                label="Termin axtar"
                variant="bordered"
                startContent={<MdSearch className="text-gray-400" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                classNames={{
                  input: "bg-transparent",
                  inputWrapper: [
                    "bg-white border-2 hover:border-primary focus:border-primary",
                  ],
                }}
              />
              <div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-3 border-2 border-gray-100 rounded-xl bg-gray-50/30"
                onScroll={handleScroll}
              >
                {relatedTerms.length > 0 ? (
                  relatedTerms.map((term) => (
                    <div 
                      key={term.id} 
                      className={`flex items-start p-3 rounded-xl border-2 transition-all duration-200 group bg-white ${
                        selectedRelatedTerms.includes(term.id) 
                          ? "border-primary/50 shadow-sm" 
                          : "border-transparent hover:border-gray-200"
                      }`}
                    >
                      <Checkbox
                        isSelected={selectedRelatedTerms.includes(term.id)}
                        onValueChange={() => handleRelatedTermChange(term.id)}
                        classNames={{
                          label: "w-full",
                          wrapper: "after:bg-jsyellow"
                        }}
                      >
                        <div className="flex flex-col gap-1 ml-1">
                          <span className="text-sm font-bold text-gray-800 group-hover:text-black">
                            {term.name.az}
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            {term.category && (
                              <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-md text-gray-500 font-medium whitespace-nowrap">
                                {term.category.name.az}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">
                              {term.name.ru}
                            </span>
                          </div>
                        </div>
                      </Checkbox>
                    </div>
                  ))
                ) : !isLoadingTerms && (
                  <div className="col-span-full py-8 text-center text-gray-400 flex flex-col items-center gap-2">
                    <MdSearch size={24} className="opacity-20" />
                    <span>Uyğun terminlər yoxdur</span>
                  </div>
                )}
                {isLoadingTerms && (
                  <div className="col-span-full py-4 text-center text-gray-400 text-sm">
                    Yüklənir...
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8">
              <Button
                onClick={() => router.back()}
                variant="light"
                className="text-gray-600"
                size="lg"
              >
                Ləğv et
              </Button>
              <Button
                type="submit"
                className="bg-jsyellow text-white hover:bg-jsyellow/90 disabled:opacity-50"
                size="lg"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {mode === "create"
                  ? isSubmitting
                    ? "Yaradılır..."
                    : "Yarat"
                  : isSubmitting
                  ? "Yenilənir..."
                  : "Yenilə"}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>

      {/* Kateqoriya yaratma modalı */}
      <Modal isOpen={isCategoryModalOpen} onClose={onCategoryModalClose} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Yeni Kateqoriya Yarat</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Ad (AZ)"
                    variant="bordered"
                    startContent={<MdTitle className="text-gray-400" />}
                    value={newCategoryNameAz}
                    onChange={(e) => setNewCategoryNameAz(e.target.value)}
                    placeholder="Məs: Robotexnika"
                    isRequired
                  />
                  <Input
                    label="Название (RU)"
                    variant="bordered"
                    startContent={<MdTitle className="text-gray-400" />}
                    value={newCategoryNameRu}
                    onChange={(e) => setNewCategoryNameRu(e.target.value)}
                    placeholder="Например: Робототехника"
                    isRequired
                  />
                  <Textarea
                    label="Təsvir (AZ)"
                    variant="bordered"
                    startContent={<MdDescription className="text-gray-400" />}
                    value={newCategoryDescriptionAz}
                    onChange={(e) => setNewCategoryDescriptionAz(e.target.value)}
                    placeholder="Kateqoriya haqqında qısa məlumat"
                  />
                  <Textarea
                    label="Описание (RU)"
                    variant="bordered"
                    startContent={<MdDescription className="text-gray-400" />}
                    value={newCategoryDescriptionRu}
                    onChange={(e) => setNewCategoryDescriptionRu(e.target.value)}
                    placeholder="Краткая информация о категории"
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose} isDisabled={isCreatingCategory}>
                  Ləğv et
                </Button>
                <Button
                  className="bg-jsyellow text-white"
                  onPress={handleCreateCategory}
                  isLoading={isCreatingCategory}
                  isDisabled={!newCategoryNameAz.trim() || !newCategoryNameRu.trim()}
                >
                  Yarat
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}