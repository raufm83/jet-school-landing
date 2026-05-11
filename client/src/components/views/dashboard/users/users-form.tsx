import { Role } from "@/types/enums";
import { Button, Card, Input, Select, SelectItem } from "@nextui-org/react";
import { motion } from "framer-motion";
import { Controller } from "react-hook-form";
import {
  MdLock,
  MdMail,
  MdPerson,
  MdSupervisedUserCircle,
  MdWork,
  MdPhoto,
  MdVisibility,
  MdVisibilityOff,
  MdContentCopy,
  MdRefresh,
} from "react-icons/md";
import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useWatch } from "react-hook-form";
import { toast } from "sonner";

interface UsersFormProps {
  mode: "create" | "edit";
  onSubmit: (data: any) => Promise<void>;
  register: any;
  control: any;
  errors: any;
  isSubmitting: boolean;
  handleSubmit: any;
  router: any;
  setValue?: (
    name: string,
    value: unknown,
    options?: { shouldValidate?: boolean; shouldDirty?: boolean }
  ) => void;
  showPasswordField?: boolean;
}

export default function UsersForm({
  mode,
  onSubmit,
  register,
  control,
  errors,
  isSubmitting,
  handleSubmit,
  router,
  setValue,
  showPasswordField = true,
}: UsersFormProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const passwordValue = useWatch({ control, name: "password", defaultValue: "" });
  const roleValue = useWatch({ control, name: "role", defaultValue: Role.USER });
  const isAuthor = String(roleValue) === Role.AUTHOR;

  const generatePassword = useCallback(() => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const digit = "0123456789";
    const special = "@$!%*?&#^()_-+=[]{}|;:',.~";
    const rand = (n: number) => Math.floor(Math.random() * n);
    const pick = (s: string) => s[rand(s.length)];
    const arr = [pick(upper), pick(lower), pick(digit), pick(special)];
    const all = upper + lower + digit + special;
    for (let i = 0; i < 8; i++) arr.push(pick(all));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const password = arr.join("");
    setValue?.("password", password, { shouldValidate: true, shouldDirty: true });
  }, [setValue]);

  const copyPassword = useCallback(() => {
    const p = String(passwordValue ?? "");
    if (!p) {
      toast.error("Kopyalamaq üçün əvvəlcə şifrə daxil edin və ya yaradın");
      return;
    }
    navigator.clipboard.writeText(p).then(
      () => toast.success("Şifrə kopyalandı"),
      () => toast.error("Kopyalama uğursuz oldu")
    );
  }, [passwordValue]);

  const roleOptions = [
    { key: Role.USER, value: Role.USER, label: "İstifadəçi" },
    { key: Role.AUTHOR, value: Role.AUTHOR, label: "Müəllif (Bloq)" },
    { key: Role.STAFF, value: Role.STAFF, label: "İşçi" },
    {
      key: Role.CONTENTMANAGER,
      value: Role.CONTENTMANAGER,
      label: "Kontent-Menecer",
    },
    {
      key: Role.CRMOPERATOR,
      value: Role.CRMOPERATOR,
      label: "CRM Operator",
    },
    {
      key: Role.HRMANAGER,
      value: Role.HRMANAGER,
      label: "HR Manager",
    },
    { key: Role.ADMIN, value: Role.ADMIN, label: "Admin" },
  ];

  return (
    <div className="p-6 min-h-screen w-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <Card className="w-full max-w-xl p-6 bg-white shadow-lg mx-auto">
          <div className="text-center mb-8">
            <motion.div
              className="flex justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <MdSupervisedUserCircle size={48} className="text-jsyellow" />
            </motion.div>
            <motion.h1
              className="text-2xl font-bold text-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {mode === "create"
                ? "Yeni İstifadəçi Yarat"
                : "İstifadəçi Məlumatlarını Yenilə"}
            </motion.h1>
            {mode === "create" && (
              <motion.p
                className="text-gray-500 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                İstifadəçi məlumatlarını daxil edin
              </motion.p>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isAuthor ? (
              <div key="author-name-fields" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input
                      key="author-firstName-az"
                      type="text"
                      label="Ad (AZ)"
                      variant="bordered"
                      startContent={<MdPerson className="text-gray-400" />}
                      isDisabled={isSubmitting}
                      {...register("firstName.az", {
                        required:
                          isAuthor && mode === "create"
                            ? "Ad (AZ) tələb olunur"
                            : false,
                        minLength: {
                          value: 2,
                          message: "Ad ən azı 2 simvol olmalıdır",
                        },
                        pattern: {
                          value: /^[a-zA-Zа-яА-ЯёЁәəıiöüşğç\s]+$/,
                          message: "Ad yalnız hərflərdən ibarət olmalıdır",
                        },
                      })}
                      isInvalid={!!errors.firstName?.az}
                      errorMessage={errors.firstName?.az?.message}
                      classNames={{
                        input: "bg-transparent",
                        inputWrapper: [
                          "bg-white border-2 hover:border-jsyellow focus:border-jsyellow",
                        ],
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      key="author-firstName-ru"
                      type="text"
                      label="Ad (RU)"
                      variant="bordered"
                      startContent={<MdPerson className="text-gray-400" />}
                      isDisabled={isSubmitting}
                      {...register("firstName.ru", {
                        minLength: {
                          value: 2,
                          message: "Ad ən azı 2 simvol olmalıdır",
                        },
                        pattern: {
                          value: /^[a-zA-Zа-яА-ЯёЁәəıiöüşğç\s]+$/,
                          message: "Ad yalnız hərflərdən ibarət olmalıdır",
                        },
                      })}
                      isInvalid={!!errors.firstName?.ru}
                      errorMessage={errors.firstName?.ru?.message}
                      classNames={{
                        input: "bg-transparent",
                        inputWrapper: [
                          "bg-white border-2 hover:border-jsyellow focus:border-jsyellow",
                        ],
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input
                      key="author-lastName-az"
                      type="text"
                      label="Soyad (AZ)"
                      variant="bordered"
                      startContent={<MdPerson className="text-gray-400" />}
                      isDisabled={isSubmitting}
                      {...register("lastName.az", {
                        required:
                          isAuthor && mode === "create"
                            ? "Soyad (AZ) tələb olunur"
                            : false,
                        minLength: {
                          value: 2,
                          message: "Soyad ən azı 2 simvol olmalıdır",
                        },
                        pattern: {
                          value: /^[a-zA-Zа-яА-ЯёЁәəıiöüşğç\s]+$/,
                          message: "Soyad yalnız hərflərdən ibarət olmalıdır",
                        },
                      })}
                      isInvalid={!!errors.lastName?.az}
                      errorMessage={errors.lastName?.az?.message}
                      classNames={{
                        input: "bg-transparent",
                        inputWrapper: [
                          "bg-white border-2 hover:border-jsyellow focus:border-jsyellow",
                        ],
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      key="author-lastName-ru"
                      type="text"
                      label="Soyad (RU)"
                      variant="bordered"
                      startContent={<MdPerson className="text-gray-400" />}
                      isDisabled={isSubmitting}
                      {...register("lastName.ru", {
                        minLength: {
                          value: 2,
                          message: "Soyad ən azı 2 simvol olmalıdır",
                        },
                        pattern: {
                          value: /^[a-zA-Zа-яА-ЯёЁәəıiöüşğç\s]+$/,
                          message: "Soyad yalnız hərflərdən ibarət olmalıdır",
                        },
                      })}
                      isInvalid={!!errors.lastName?.ru}
                      errorMessage={errors.lastName?.ru?.message}
                      classNames={{
                        input: "bg-transparent",
                        inputWrapper: [
                          "bg-white border-2 hover:border-jsyellow focus:border-jsyellow",
                        ],
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div key="non-author-name-field" className="space-y-2">
                <Input
                  key="user-name"
                  type="text"
                  label="Ad"
                  variant="bordered"
                  startContent={<MdPerson className="text-gray-400" />}
                  isDisabled={isSubmitting}
                  {...register("name", {
                    required: "Ad tələb olunur",
                    minLength: {
                      value: 2,
                      message: "Ad ən azı 2 simvol olmalıdır",
                    },
                    pattern: {
                      value: /^[a-zA-Zа-яА-ЯёЁәəıiöüşğç\s]+$/,
                      message: "Ad yalnız hərflərdən ibarət olmalıdır",
                    },
                  })}
                  isInvalid={!!errors.name}
                  errorMessage={errors.name?.message}
                  classNames={{
                    input: "bg-transparent",
                    inputWrapper: [
                      "bg-white border-2 hover:border-jsyellow focus:border-jsyellow",
                    ],
                  }}
                />
              </div>
            )}

            <div className="space-y-2">
              <Input
                type="email"
                label="E-poçt"
                variant="bordered"
                startContent={<MdMail className="text-gray-400" />}
                isDisabled={isSubmitting}
                {...register("email", {
                  required: "E-poçt tələb olunur",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Yanlış e-poçt ünvanı",
                  },
                })}
                isInvalid={!!errors.email}
                errorMessage={errors.email?.message}
                classNames={{
                  input: "bg-transparent",
                  inputWrapper: [
                    "bg-white border-2 hover:border-jsyellow focus:border-jsyellow",
                  ],
                }}
              />
            </div>

            {showPasswordField && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground-500">
                  {mode === "create" ? "Şifrə" : "Yeni Şifrə (İstəyə bağlı)"}
                </label>
                <div className="flex flex-wrap gap-2 items-stretch">
                  <div className="flex-1 min-w-[200px] flex flex-col justify-center">
                    <Controller
                      name="password"
                      control={control}
                      rules={{
                        required: mode === "create" ? "Şifrə tələb olunur" : false,
                        minLength: {
                          value: 8,
                          message: "Şifrə ən azı 8 simvol olmalıdır",
                        },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=[\]{}|;:',."<>/~`])[A-Za-z\d@$!%*?&#^()_\-+=[\]{}|;:',."<>/~`]{8,}$/,
                          message:
                            "Ən azı 1 böyük hərf, 1 kiçik hərf, 1 rəqəm və 1 xüsusi simvol olmalıdır",
                        },
                      }}
                      render={({ field }) => (
                        <Input
                          type={isPasswordVisible ? "text" : "password"}
                          label=""
                          variant="bordered"
                          startContent={<MdLock className="text-gray-400" />}
                          endContent={
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => setIsPasswordVisible((v) => !v)}
                                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                                aria-label={isPasswordVisible ? "Şifrəni gizlət" : "Şifrəni göstər"}
                              >
                                {isPasswordVisible ? (
                                  <MdVisibilityOff size={20} />
                                ) : (
                                  <MdVisibility size={20} />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={copyPassword}
                                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                                aria-label="Şifrəni kopyala"
                              >
                                <MdContentCopy size={20} />
                              </button>
                            </div>
                          }
                          isDisabled={isSubmitting}
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          onBlur={field.onBlur}
                          isInvalid={!!errors.password}
                          errorMessage={errors.password?.message}
                          classNames={{
                            input: "bg-transparent",
                            label: "hidden",
                            inputWrapper: [
                              "bg-white border-2 hover:border-jsyellow focus:border-jsyellow !h-12 min-h-12",
                            ],
                          }}
                        />
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="bordered"
                    size="md"
                    className="border-2 border-jsyellow/50 text-jsyellow shrink-0 h-12 min-h-12"
                    startContent={<MdRefresh size={18} />}
                    onPress={generatePassword}
                    isDisabled={isSubmitting}
                  >
                    Random Şifrə
                  </Button>
                </div>
                {mode === "create" && (
                  <p className="text-xs text-foreground-500">
                    Min 8 simvol, 1 böyük hərf, 1 kiçik hərf, 1 rəqəm, 1 xüsusi simvol
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Rol"
                    selectedKeys={[field.value]}
                    onChange={(e) => field.onChange(e.target.value)}
                    variant="bordered"
                    classNames={{
                      trigger:
                        "bg-white border-2 hover:border-jsyellow focus:border-jsyellow",
                    }}
                  >
                    {roleOptions.map((role) => (
                      <SelectItem key={role.key} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />
            </div>

            {isAuthor ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MdWork className="text-gray-400" />
                  İxtisas (bloq səhifəsində göstərilir) — hər iki dildə
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="text"
                    label="İxtisas (AZ)"
                    placeholder="Məs: Bloq müəllifi, Jurnalist"
                    variant="bordered"
                    isDisabled={isSubmitting}
                    {...register("profession.az")}
                    classNames={{
                      input: "bg-transparent",
                      inputWrapper: [
                        "bg-white border-2 hover:border-jsyellow focus:border-jsyellow",
                      ],
                    }}
                  />
                  <Input
                    type="text"
                    label="İxtisas (RU)"
                    placeholder="Напр.: Автор блога, Журналист"
                    variant="bordered"
                    isDisabled={isSubmitting}
                    {...register("profession.ru")}
                    classNames={{
                      input: "bg-transparent",
                      inputWrapper: [
                        "bg-white border-2 hover:border-jsyellow focus:border-jsyellow",
                      ],
                    }}
                  />
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <MdPhoto className="text-gray-400" />
                Profil şəkli
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                ref={avatarInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setValue?.("avatarFile", file);
                    const reader = new FileReader();
                    reader.onloadend = () => setAvatarPreview(reader.result as string);
                    reader.readAsDataURL(file);
                  } else {
                    setValue?.("avatarFile", undefined);
                    setAvatarPreview(null);
                  }
                }}
              />
              <div className="flex items-center gap-4">
                {(() => {
                  const defaultUrl = (control._defaultValues as any)?.avatarUrl;
                  const avatarSrc = avatarPreview
                    ? avatarPreview
                    : defaultUrl
                    ? defaultUrl.startsWith("http")
                      ? defaultUrl
                      : process.env.NEXT_PUBLIC_CDN_URL
                      ? `${process.env.NEXT_PUBLIC_CDN_URL}/${defaultUrl}`
                      : `/${defaultUrl}`
                    : "";
                  return avatarSrc ? (
                    <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-jsyellow/30 bg-gray-100">
                      <Image
                        src={avatarSrc}
                        alt="Avatar"
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    </div>
                  ) : null;
                })()}
                <Button
                  type="button"
                  variant="bordered"
                  size="sm"
                  className="border-2 border-jsyellow/50 text-jsyellow"
                  onPress={() => avatarInputRef.current?.click()}
                  isDisabled={isSubmitting}
                >
                  {avatarPreview || (control._defaultValues as any)?.avatarUrl
                    ? "Şəkli dəyiş"
                    : "Şəkil yüklə"}
                </Button>
              </div>
              <input type="hidden" {...register("avatarUrl")} />
            </div>

            <div className="flex justify-end space-x-4">
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
    </div>
  );
}
