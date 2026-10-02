import os

page_tsx = """"use client";

import api from "@/utils/api/axios";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Switch,
} from "@nextui-org/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MdAdd, MdDelete, MdEdit } from "react-icons/md";
import { toast } from "sonner";

export default function AdvantagesPage() {
  const [advantages, setAdvantages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const router = useRouter();

  const fetchAdvantages = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/advantage");
      setAdvantages(res.data || []);
    } catch (error) {
      toast.error("Fərqimiz məlumatlarını yükləmək mümkün olmadı");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdvantages();
  }, [fetchAdvantages]);

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await api.delete(`/advantage/${selectedId}`);
      toast.success("Uğurla silindi");
      fetchAdvantages();
    } catch (error) {
      toast.error("Silmə zamanı xəta baş verdi");
    } finally {
      setSelectedId(null);
      onOpenChange();
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await api.patch(`/advantage/${id}`, { isActive: !current });
      toast.success("Status yeniləndi");
      fetchAdvantages();
    } catch (error) {
      toast.error("Status yenilənərkən xəta baş verdi");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fərqimiz</h1>
          <p className="text-gray-500 text-sm mt-1">
            "Fərqimiz nədir" bölməsinin məlumatlarını idarə edin
          </p>
        </div>
        <Button
          color="primary"
          startContent={<MdAdd className="text-xl" />}
          onPress={() => router.push("/dashboard/advantages/create")}
          className="font-medium"
        >
          Yeni Yarat
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <Table aria-label="Advantages table">
          <TableHeader>
            <TableColumn>Sıra</TableColumn>
            <TableColumn>Başlıq (AZ)</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn align="center">Əməliyyatlar</TableColumn>
          </TableHeader>
          <TableBody
            items={advantages}
            emptyContent={
              isLoading ? "Yüklənir..." : "Məlumat tapılmadı"
            }
          >
            {(item) => (
              <TableRow key={item.id}>
                <TableCell>{item.order}</TableCell>
                <TableCell>
                  <div className="max-w-md truncate">{item.title?.az}</div>
                </TableCell>
                <TableCell>
                  <Switch
                    isSelected={item.isActive}
                    onValueChange={() => handleToggleActive(item.id, item.isActive)}
                    size="sm"
                    color="success"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Tooltip content="Düzəliş et">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => router.push(`/dashboard/advantages/edit/${item.id}`)}
                      >
                        <MdEdit className="text-lg text-blue-500" />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Sil" color="danger">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => {
                          setSelectedId(item.id);
                          onOpen();
                        }}
                      >
                        <MdDelete className="text-lg" />
                      </Button>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Silməni təsdiqləyin</ModalHeader>
              <ModalBody>
                <p>Bu elementi silmək istədiyinizə əminsiniz?</p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>İmtina</Button>
                <Button color="danger" onPress={() => { handleDelete(); onClose(); }}>Sil</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </motion.div>
  );
}
"""

create_tsx = """"use client";

import api from "@/utils/api/axios";
import { Button, Input, Textarea } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { MdArrowBack } from "react-icons/md";

export default function CreateAdvantagePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: { az: "", ru: "" },
    description: { az: "", ru: "" },
    order: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post("/advantage", {
        ...formData,
        order: Number(formData.order),
      });
      toast.success("Uğurla yaradıldı");
      router.push("/dashboard/advantages");
    } catch (error) {
      toast.error("Yaradılma zamanı xəta baş verdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <Button
          isIconOnly
          variant="light"
          onPress={() => router.back()}
        >
          <MdArrowBack className="text-xl" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">Yeni Fərqimiz Əlavə Et</h1>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Input
              label="Başlıq (AZ)"
              value={formData.title.az}
              onChange={(e) => setFormData({ ...formData, title: { ...formData.title, az: e.target.value } })}
              isRequired
            />
            <Input
              label="Başlıq (RU)"
              value={formData.title.ru}
              onChange={(e) => setFormData({ ...formData, title: { ...formData.title, ru: e.target.value } })}
              isRequired
            />
            <Textarea
              label="Təsvir (AZ)"
              value={formData.description.az}
              onChange={(e) => setFormData({ ...formData, description: { ...formData.description, az: e.target.value } })}
              isRequired
              className="col-span-2"
            />
            <Textarea
              label="Təsvir (RU)"
              value={formData.description.ru}
              onChange={(e) => setFormData({ ...formData, description: { ...formData.description, ru: e.target.value } })}
              isRequired
              className="col-span-2"
            />
            <Input
              type="number"
              label="Sıra"
              value={formData.order.toString()}
              onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="flat" onPress={() => router.back()}>
              Ləğv et
            </Button>
            <Button color="primary" type="submit" isLoading={isSubmitting}>
              Yadda saxla
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
"""

edit_tsx = """"use client";

import api from "@/utils/api/axios";
import { Button, Input, Textarea } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MdArrowBack } from "react-icons/md";
import { use } from "react";

export default function EditAdvantagePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: { az: "", ru: "" },
    description: { az: "", ru: "" },
    order: 0,
  });

  useEffect(() => {
    const fetchAdvantage = async () => {
      try {
        const res = await api.get(`/advantage/${id}`);
        const data = res.data;
        setFormData({
          title: { az: data.title?.az || "", ru: data.title?.ru || "" },
          description: { az: data.description?.az || "", ru: data.description?.ru || "" },
          order: data.order || 0,
        });
      } catch (error) {
        toast.error("Məlumatı yükləmək mümkün olmadı");
      } finally {
        setIsLoading(false);
      }
    };
    if (id) {
      fetchAdvantage();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.patch(`/advantage/${id}`, {
        ...formData,
        order: Number(formData.order),
      });
      toast.success("Uğurla yeniləndi");
      router.push("/dashboard/advantages");
    } catch (error) {
      toast.error("Yenilənmə zamanı xəta baş verdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div>Yüklənir...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <Button
          isIconOnly
          variant="light"
          onPress={() => router.back()}
        >
          <MdArrowBack className="text-xl" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">Fərqimiz Yenilə</h1>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Input
              label="Başlıq (AZ)"
              value={formData.title.az}
              onChange={(e) => setFormData({ ...formData, title: { ...formData.title, az: e.target.value } })}
              isRequired
            />
            <Input
              label="Başlıq (RU)"
              value={formData.title.ru}
              onChange={(e) => setFormData({ ...formData, title: { ...formData.title, ru: e.target.value } })}
              isRequired
            />
            <Textarea
              label="Təsvir (AZ)"
              value={formData.description.az}
              onChange={(e) => setFormData({ ...formData, description: { ...formData.description, az: e.target.value } })}
              isRequired
              className="col-span-2"
            />
            <Textarea
              label="Təsvir (RU)"
              value={formData.description.ru}
              onChange={(e) => setFormData({ ...formData, description: { ...formData.description, ru: e.target.value } })}
              isRequired
              className="col-span-2"
            />
            <Input
              type="number"
              label="Sıra"
              value={formData.order.toString()}
              onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="flat" onPress={() => router.back()}>
              Ləğv et
            </Button>
            <Button color="primary" type="submit" isLoading={isSubmitting}>
              Yadda saxla
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
"""

def generate_admin_pages(client_path):
    adv_dir = os.path.join(client_path, 'src', 'app', 'dashboard', 'advantages')
    os.makedirs(adv_dir, exist_ok=True)
    
    with open(os.path.join(adv_dir, 'page.tsx'), 'w', encoding='utf-8') as f:
        f.write(page_tsx)
        
    create_dir = os.path.join(adv_dir, 'create')
    os.makedirs(create_dir, exist_ok=True)
    with open(os.path.join(create_dir, 'page.tsx'), 'w', encoding='utf-8') as f:
        f.write(create_tsx)
        
    edit_dir = os.path.join(adv_dir, 'edit', '[id]')
    os.makedirs(edit_dir, exist_ok=True)
    with open(os.path.join(edit_dir, 'page.tsx'), 'w', encoding='utf-8') as f:
        f.write(edit_tsx)

bases = [
    r'c:\Users\amira\OneDrive - Yalova Üniversitesi\Desktop\Jet Teknik Support\jet-school-landing\client',
    r'c:\Users\amira\OneDrive - Yalova Üniversitesi\Desktop\Jet Teknik Support\jet-academy-landing\client'
]

for base in bases:
    generate_admin_pages(base)
