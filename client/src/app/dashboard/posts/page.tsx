"use client";
import { useState, useCallback, useEffect } from "react";
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
  Chip,
  Switch,
} from "@nextui-org/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { MdAdd, MdClear, MdDelete, MdEdit, MdSearch } from "react-icons/md";
import { toast } from "sonner";
import api from "@/utils/api/axios";
import { Post, PostsResponse } from "@/types/post";
import Link from "next/link";
import { PostType, Role } from "@/types/enums";
import { useSession } from "next-auth/react";
import DashboardPagination from "@/components/ui/dashboard-pagination";

export default function PostsPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const isAuthor = session?.user?.role === Role.AUTHOR;
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [selectedPostType, setSelectedPostType] = useState<PostType | null>(
    null
  );
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString(),
        includeUnpublished: "true",
      });
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      // Müəllif üçün yalnız öz bloqlarını göstərən endpoint (mütləq JWT tələb olunur)
      if (isAuthor) {
        const { data } = await api.get<PostsResponse>(
          `/posts/my?${params.toString()}`
        );
        setPosts(data.items);
        setTotalPosts(data.meta.total);
        return;
      }

      const type = selectedPostType;
      let url: string;
      if (type) {
        url = `/posts/type/${type}?${params.toString()}`;
      } else {
        params.set("includeBlogs", "true");
        url = `/posts?${params.toString()}`;
      }
      const { data } = await api.get<PostsResponse>(url);
      setPosts(data.items);
      setTotalPosts(data.meta.total);
    } catch (error) {
      console.error("Postlar yüklənmədi:", error);
      toast.error("Postlar yüklənə bilmədi");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, selectedPostType, isAuthor, debouncedSearch]);

  // Sessiya yüklənənə qədər göndərmə (xüsusən AUTHOR üçün JWT göndərilməsi üçün)
  useEffect(() => {
    if (sessionStatus === "loading") return;
    fetchPosts();
  }, [sessionStatus, fetchPosts]);

  const handleDelete = (post: Post) => {
    setSelectedPost(post);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    if (!selectedPost) return;

    try {
      await api.delete(`/posts/${selectedPost.id}`);
      toast.success("Post uğurla silindi");
      fetchPosts();
    } catch (error) {
      console.error("Post silinmədi:", error);
      toast.error("Postu silmək mümkün olmadı");
    } finally {
      onDeleteClose();
      setSelectedPost(null);
    }
  };

  const handlePostTypeFilter = (type: PostType | null) => {
    setSelectedPostType(type);
    setPage(1);
  };

  const resetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    if (!isAuthor) setSelectedPostType(null);
    setPage(1);
  };

  const filtersDirty =
    searchInput.trim().length > 0 ||
    (!isAuthor && selectedPostType !== null);

  const postTypeFilters: { key: PostType | "all"; label: string }[] = [
    { key: "all", label: "Bütün postlar" },
    { key: PostType.BLOG, label: "Bloqlar" },
    { key: PostType.OFFERS, label: "Kampaniyalar" },
    { key: PostType.NEWS, label: "Xəbərlər" },
    { key: PostType.EVENT, label: "Tədbirlər" },
  ];

  const handleStatusChange = async (post: Post, isSelected: boolean) => {
    try {
      // Optimistic update
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === post.id ? { ...p, published: isSelected } : p
        )
      );

      // PATCH endpoint multipart interceptor ilə işləyir — FormData ilə göndəririk ki, published DB-yə düşsün
      const body = new FormData();
      body.append("published", isSelected ? "true" : "false");
      await api.patch(`/posts/${post.id}`, body);
      toast.success("Status uğurla dəyişdirildi");
      await fetchPosts();
    } catch (error) {
      console.error("Status dəyişdirilmədi:", error);
      toast.error("Statusu dəyişmək mümkün olmadı");
      // Revert on error
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === post.id ? { ...p, published: !isSelected } : p
        )
      );
    }
  };

  const columns = [
    { name: "BAŞLIQ", uid: "title" },
    { name: "MƏZMUN", uid: "content" },
    { name: "TİP", uid: "postType" },
    { name: "STATUS", uid: "published" },
    { name: "TEQLƏR", uid: "tags" },
    { name: "YARADILMA TARİXİ", uid: "createdAt" },
    { name: "ƏMƏLİYYATLAR", uid: "actions" },
  ];

  const renderCell = (post: Post, columnKey: string) => {
    switch (columnKey) {
      case "title":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{post.title.az}</p>
            <p className="text-tiny text-default-400">{post.title.ru}</p>
          </div>
        );

      case "content":
        return (
          <div className="flex flex-col">
            <p className="text-small">
              {post.content.az.replace(/<[^>]*>/g, "").substring(0, 100)}...
            </p>
            <Link href={`/news/${post.slug.az}`}>
              <p className="text-primary text-tiny">Ətraflı</p>
            </Link>
          </div>
        );

      case "postType":
        return (
          <Chip
            className="capitalize"
            color={
              post.postType === PostType.BLOG
                ? "primary"
                : post.postType === PostType.NEWS
                ? "success"
                : post.postType === PostType.EVENT
                ? "warning"
                : post.postType === PostType.OFFERS
                ? "secondary"
                : "default"
            }
            size="sm"
            variant="flat"
          >
            {post.postType === PostType.BLOG
              ? "Bloq"
              : post.postType === PostType.NEWS
              ? "Xəbər"
              : post.postType === PostType.EVENT
              ? "Tədbir"
              : post.postType === PostType.OFFERS
              ? "Kampaniya"
              : "Bilinmir"}
          </Chip>
        );

      case "published":
        return (
          <Switch
            isSelected={post.published}
            size="sm"
            color="success"
            onValueChange={(isSelected) => handleStatusChange(post, isSelected)}
          >
            {post.published ? "Aktiv" : "Deaktiv"}
          </Switch>
        );

      case "tags":
        const tagsList = Array.isArray(post.tags) ? post.tags : [...(post.tags?.az ?? []), ...(post.tags?.ru ?? [])];
        return (
          <div className="flex flex-wrap gap-1">
            {tagsList.length > 0 ? (
              tagsList.slice(0, 5).map((tag: string, index: number) => (
                <Chip key={index} size="sm" variant="flat">
                  {tag}
                </Chip>
              ))
            ) : (
              <span className="text-tiny text-default-400">Teq yoxdur</span>
            )}
          </div>
        );

      case "createdAt":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">
              {new Date(post.createdAt).toLocaleDateString("az-AZ")}
            </p>
            <p className="text-bold text-tiny text-default-400">
              {new Date(post.createdAt).toLocaleTimeString("az-AZ")}
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
                onClick={() => router.push(`/dashboard/posts/edit/${post.id}`)}
              >
                <MdEdit className="text-default-400" size={20} />
              </Button>
            </Tooltip>
            <Tooltip content="Sil" color="danger">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onClick={() => handleDelete(post)}
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
            <h1 className="text-2xl font-bold">Postlar</h1>
            <p className="text-gray-500">Postları idarə edin</p>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              color="primary"
              className="bg-jsyellow text-white"
              startContent={<MdAdd size={24} />}
              onClick={() => router.push("/dashboard/posts/create")}
            >
              Yeni Post
            </Button>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          {!isAuthor && (
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Post növü üzrə filtrasiya"
            >
              {postTypeFilters.map(({ key, label }) => {
                const isActive =
                  key === "all"
                    ? selectedPostType === null
                    : selectedPostType === key;
                return (
                  <button
                    key={String(key)}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() =>
                      handlePostTypeFilter(key === "all" ? null : key)
                    }
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-jsyellow text-white shadow-sm"
                        : "border border-gray-200 bg-gray-50 text-jsblack hover:border-jsyellow/40 hover:bg-jsyellow/5"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          <Input
            label="Başlığa görə axtarış"
            placeholder="AZ və ya RU başlıqda axtar..."
            variant="bordered"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            startContent={<MdSearch className="text-default-400" />}
            isClearable
            onClear={() => setSearchInput("")}
            className="min-w-[240px] flex-1 sm:max-w-md"
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
            >
              Filtrləri sıfırla
            </Button>
          )}
        </div>

        <Table
          aria-label="Postlar cədvəli"
          bottomContent={
            <div className="flex w-full justify-center">
              <DashboardPagination
                page={page}
                total={Math.ceil(totalPosts / rowsPerPage)}
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
            items={posts}
            loadingContent={<div>Yüklənir...</div>}
            loadingState={loading ? "loading" : "idle"}
            emptyContent={<div>Post tapılmadı</div>}
          >
            {(post) => (
              <TableRow key={post.id}>
                {columns.map((column) => (
                  <TableCell key={column.uid}>
                    {renderCell(post, column.uid)}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>Postu Sil</ModalHeader>
                <ModalBody>
                  <p>
                    &quot;{selectedPost?.title.az}&quot; postunu silmək
                    istədiyinizə əminsiniz?
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
