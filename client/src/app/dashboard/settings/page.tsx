"use client";

import { Button, Card, Input } from "@nextui-org/react";
import { motion } from "framer-motion";
import {
  MdLock,
  MdPerson,
  MdRefresh,
  MdSettings,
  MdContentCopy,
  MdVisibility,
  MdVisibilityOff,
  MdPhoto,
  MdEmail,
} from "react-icons/md";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { toast } from "sonner";
import Image from "next/image";
import api from "@/utils/api/axios";
import { Role } from "@/types/enums";

interface ProfileFormInputs {
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  /** Author üçün: ad/soyad dillər üzrə */
  firstNameAz?: string;
  firstNameRu?: string;
  lastNameAz?: string;
  lastNameRu?: string;
  password?: string;
  avatarUrl?: string;
  avatarFile?: File;
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormInputs>();

  const passwordValue = useWatch({ control, name: "password", defaultValue: "" });
  const avatarUrlValue = useWatch({ control, name: "avatarUrl", defaultValue: "" });

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
    setValue("password", password, { shouldValidate: true, shouldDirty: true });
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

  useEffect(() => {
    let cancelled = false;
    api
      .get("/users/me")
      .then(({ data }) => {
        if (!cancelled) {
          setUserRole(data.role ?? null);
          const firstName = data.firstName;
          const lastName = data.lastName;
          const isObj = (v: unknown): v is { az?: string; ru?: string } =>
            typeof v === "object" && v !== null && !Array.isArray(v);
          const firstAz = isObj(firstName) ? (firstName.az ?? "") : (typeof firstName === "string" ? firstName : "");
          const firstRu = isObj(firstName) ? (firstName.ru ?? "") : (typeof firstName === "string" ? firstName : "");
          const lastAz = isObj(lastName) ? (lastName.az ?? "") : (typeof lastName === "string" ? lastName : "");
          const lastRu = isObj(lastName) ? (lastName.ru ?? "") : (typeof lastName === "string" ? lastName : "");
          const fallbackFromName = (data.name ?? "").trim();
          const parts = fallbackFromName ? fallbackFromName.split(/\s+/) : [];
          const defaultFirst = parts[0] ?? "";
          const defaultLast = parts.length >= 2 ? parts.slice(1).join(" ") : "";
          reset({
            name: data.name ?? "",
            email: data.email ?? "",
            firstNameAz: firstAz || defaultFirst,
            firstNameRu: firstRu || defaultFirst,
            lastNameAz: lastAz || defaultLast,
            lastNameRu: lastRu || defaultLast,
            password: "",
            avatarUrl: data.profile?.avatarUrl ?? "",
          });
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Profil məlumatları yüklənmədi");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reset]);

  const onSubmit = async (data: ProfileFormInputs) => {
    try {
      let avatarUrl: string | undefined;
      const avatarFile = data.avatarFile;
      if (avatarFile instanceof File) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        const { data: uploadRes } = await api.post<{ url: string }>(
          "/auth/upload-avatar",
          formData,
          { headers: { "Content-Type": undefined as unknown as string } }
        );
        avatarUrl = uploadRes?.url;
      }
      const payload: Record<string, unknown> = {};
      const isAuthor = userRole === Role.AUTHOR;
      if (isAuthor) {
        const firstAz = (data.firstNameAz ?? "").trim();
        const firstRu = (data.firstNameRu ?? "").trim();
        const lastAz = (data.lastNameAz ?? "").trim();
        const lastRu = (data.lastNameRu ?? "").trim();
        payload.firstName = { az: firstAz, ru: firstRu };
        payload.lastName = { az: lastAz, ru: lastRu };
        const nameFromAz = [firstAz, lastAz].filter(Boolean).join(" ") || [firstRu, lastRu].filter(Boolean).join(" ");
        if (nameFromAz) payload.name = nameFromAz;
      } else if ((data.name ?? "").trim()) {
        payload.name = (data.name as string).trim();
      }
      if ((data.email ?? "").trim()) payload.email = (data.email as string).trim();
      if ((data.password ?? "").trim()) payload.password = (data.password as string).trim();
      if (avatarUrl) payload.avatarUrl = avatarUrl;
      await api.patch("/users/me", payload);
      toast.success("Profil yeniləndi");
      reset({
        name: (payload.name as string) ?? data.name,
        email: (payload.email as string) ?? data.email,
        firstNameAz: data.firstNameAz,
        firstNameRu: data.firstNameRu,
        lastNameAz: data.lastNameAz,
        lastNameRu: data.lastNameRu,
        password: "",
      });
      setAvatarPreview(null);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg || "Xəta baş verdi. Yenidən cəhd edin");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 min-h-screen w-full flex items-center justify-center">
        <p className="text-gray-500">Yüklənir...</p>
      </div>
    );
  }

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
              <MdSettings size={48} className="text-jsyellow" />
            </motion.div>
            <motion.h1
              className="text-2xl font-bold text-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Parametrlər
            </motion.h1>
            <motion.p
              className="text-gray-500 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Ad, Soyad və şifrənizi dəyişə bilərsiniz
            </motion.p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {userRole === Role.AUTHOR ? (
              <>
                <div className="space-y-2">
                  <Input
                    type="text"
                    label="Ad (Azərbaycan)"
                    variant="bordered"
                    placeholder="Ad"
                    startContent={<MdPerson className="text-gray-400" />}
                    isDisabled={isSubmitting}
                    {...register("firstNameAz", {
                      required: "Ad (AZ) tələb olunur",
                      minLength: { value: 2, message: "Ad ən azı 2 simvol olmalıdır" },
                      pattern: {
                        value: /^[a-zA-Zа-яА-ЯёЁәəıiöüşğç\s]+$/,
                        message: "Ad yalnız hərflərdən ibarət olmalıdır",
                      },
                    })}
                    isInvalid={!!errors.firstNameAz}
                    errorMessage={errors.firstNameAz?.message}
                    classNames={{
                      input: "bg-transparent",
                      inputWrapper: ["bg-white border-2 hover:border-jsyellow focus:border-jsyellow"],
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    label="Ad (Русский)"
                    variant="bordered"
                    placeholder="Имя"
                    startContent={<MdPerson className="text-gray-400" />}
                    isDisabled={isSubmitting}
                    {...register("firstNameRu", {
                      required: "Ad (RU) tələb olunur",
                      minLength: { value: 2, message: "Ad ən azı 2 simvol olmalıdır" },
                      pattern: {
                        value: /^[a-zA-Zа-яА-ЯёЁәəıiöüşğç\s]+$/,
                        message: "Ad yalnız hərflərdən ibarət olmalıdır",
                      },
                    })}
                    isInvalid={!!errors.firstNameRu}
                    errorMessage={errors.firstNameRu?.message}
                    classNames={{
                      input: "bg-transparent",
                      inputWrapper: ["bg-white border-2 hover:border-jsyellow focus:border-jsyellow"],
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    label="Soyad (Azərbaycan)"
                    variant="bordered"
                    placeholder="Soyad"
                    startContent={<MdPerson className="text-gray-400" />}
                    isDisabled={isSubmitting}
                    {...register("lastNameAz", {
                      required: "Soyad (AZ) tələb olunur",
                      minLength: { value: 2, message: "Soyad ən azı 2 simvol olmalıdır" },
                      pattern: {
                        value: /^[a-zA-Zа-яА-ЯёЁәəıiöüşğç\s]+$/,
                        message: "Soyad yalnız hərflərdən ibarət olmalıdır",
                      },
                    })}
                    isInvalid={!!errors.lastNameAz}
                    errorMessage={errors.lastNameAz?.message}
                    classNames={{
                      input: "bg-transparent",
                      inputWrapper: ["bg-white border-2 hover:border-jsyellow focus:border-jsyellow"],
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    label="Soyad (Русский)"
                    variant="bordered"
                    placeholder="Фамилия"
                    startContent={<MdPerson className="text-gray-400" />}
                    isDisabled={isSubmitting}
                    {...register("lastNameRu", {
                      required: "Soyad (RU) tələb olunur",
                      minLength: { value: 2, message: "Soyad ən azı 2 simvol olmalıdır" },
                      pattern: {
                        value: /^[a-zA-Zа-яА-ЯёЁәəıiöüşğç\s]+$/,
                        message: "Soyad yalnız hərflərdən ibarət olmalıdır",
                      },
                    })}
                    isInvalid={!!errors.lastNameRu}
                    errorMessage={errors.lastNameRu?.message}
                    classNames={{
                      input: "bg-transparent",
                      inputWrapper: ["bg-white border-2 hover:border-jsyellow focus:border-jsyellow"],
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Input
                  type="text"
                  label="Ad, Soyad"
                  variant="bordered"
                  placeholder="Ad və Soyad"
                  startContent={<MdPerson className="text-gray-400" />}
                  isDisabled={isSubmitting}
                  {...register("name", {
                    required: "Ad, Soyad tələb olunur",
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
                label="E-poçt (giriş üçün istifadə olunur)"
                variant="bordered"
                placeholder="email@example.com"
                startContent={<MdEmail className="text-gray-400" />}
                isDisabled={isSubmitting}
                {...register("email", {
                  required: "E-poçt tələb olunur",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Düzgün e-poçt daxil edin",
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
                    setValue("avatarFile", file, { shouldDirty: true });
                    const reader = new FileReader();
                    reader.onloadend = () => setAvatarPreview(reader.result as string);
                    reader.readAsDataURL(file);
                  } else {
                    setValue("avatarFile", undefined as unknown as File, { shouldDirty: true });
                    setAvatarPreview(null);
                  }
                }}
              />
              <div className="flex items-center gap-4">
                {(() => {
                  const existingUrl = avatarUrlValue || "";
                  const avatarSrc = avatarPreview
                    ? avatarPreview
                    : existingUrl
                    ? existingUrl.startsWith("http")
                      ? existingUrl
                      : process.env.NEXT_PUBLIC_CDN_URL
                      ? `${process.env.NEXT_PUBLIC_CDN_URL}/${existingUrl}`
                      : existingUrl
                    : "";
                  return avatarSrc ? (
                    <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-jsyellow/30 bg-gray-100">
                      <Image
                        src={avatarSrc}
                        alt="Avatar"
                        fill
                        sizes="120px"
                        className="object-cover"
                        unoptimized={avatarSrc.startsWith("data:")}
                      />
                    </div>
                  ) : null;
                })()}
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="bordered"
                    size="sm"
                    className="border-2 border-jsyellow/50 text-jsyellow"
                    onPress={() => avatarInputRef.current?.click()}
                    isDisabled={isSubmitting}
                  >
                    {avatarPreview ? "Şəkli dəyiş" : "Şəkil yüklə"}
                  </Button>
                  <p className="text-xs text-gray-400">Tövsiyə olunan ölçü: 400×400 px (kare) · Maks. həcm: 1 MB · Format: JPG, PNG, WebP</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Yeni şifrə (istəyə bağlı)
              </label>
              <div className="flex flex-nowrap items-stretch gap-2">
                <div className="flex-1 min-w-0">
                  <Controller
                    control={control}
                    name="password"
                    rules={{
                      minLength: {
                        value: 8,
                        message: "Şifrə ən azı 8 simvol olmalıdır",
                      },
                      pattern: {
                        value:
                          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=[\]{}|;:',."<>/~`])[A-Za-z\d@$!%*?&#^()_\-+=[\]{}|;:',."<>/~`]{8,}$/,
                        message:
                          "Ən azı 1 böyük hərf, 1 kiçik hərf, 1 rəqəm və 1 xüsusi simvol olmalıdır",
                      },
                    }}
                    render={({ field: { value, onChange, onBlur, ref } }) => (
                      <Input
                        ref={ref}
                        type={isPasswordVisible ? "text" : "password"}
                        variant="bordered"
                        placeholder="Dəyişmək istəmirsəniz boş buraxın"
                        value={value ?? ""}
                        onValueChange={onChange}
                        onBlur={onBlur}
                        startContent={<MdLock className="text-gray-400" />}
                        endContent={
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => setIsPasswordVisible((v) => !v)}
                              className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                              aria-label={
                                isPasswordVisible ? "Şifrəni gizlət" : "Şifrəni göstər"
                              }
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
                        isInvalid={!!errors.password}
                        errorMessage={errors.password?.message}
                        classNames={{
                          input: "bg-transparent",
                          inputWrapper: [
                            "bg-white border-2 hover:border-jsyellow focus:border-jsyellow",
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
                  className="border-2 border-jsyellow/50 text-jsyellow shrink-0 self-center"
                  startContent={<MdRefresh size={18} />}
                  onPress={generatePassword}
                  isDisabled={isSubmitting}
                >
                  Təsadüfi şifrə
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Min 8 simvol, 1 böyük hərf, 1 kiçik hərf, 1 rəqəm, 1 xüsusi simvol
              </p>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-jsyellow text-black font-semibold"
                isDisabled={isSubmitting || !isDirty}
                isLoading={isSubmitting}
              >
                Saxla
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
