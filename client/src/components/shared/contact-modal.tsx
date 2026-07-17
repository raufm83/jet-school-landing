"use client";
import { useContactModal } from "@/hooks/useContactModal";
import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { MdClose, MdOutlineCheck } from "react-icons/md";
import { RequestFormInputs, Language } from "@/types/request";
import axios from "axios";
import api from "@/utils/api/axios";
import { toast } from "sonner";
import Select from "../ui/select";

export default function ContactModal() {
  const t = useTranslations("contact.form");
  const { isOpen, toggle } = useContactModal();
  const [success, setSuccess] = useState(false);
  const [visible, setVisible] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<RequestFormInputs>();

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const ageOptions = Array.from({ length: 10 }, (_, i) => ({
    value: i + 8,
    label: `${i + 8}`,
  }));
  const languageOptions = [
    { value: Language.AZ, label: t("childLanguage.options.az") },
    { value: Language.RU, label: t("childLanguage.options.ru") },
  ];

  const submitRequest = async (data: RequestFormInputs) => {
    return api.post("/requests", data);
  };

  const onSubmit = handleSubmit((data) =>
    toast.promise(submitRequest(data), {
      loading: t("sending"),
      success: () => {
        reset();
        setSuccess(true);
        return t("messageSent");
      },
      error: (err) => {
        if (axios.isAxiosError(err) && err.response) {
          const raw = err.response.data?.message as string | string[] | undefined;
          const apiMsg = Array.isArray(raw) ? raw[0] : raw;
          if (apiMsg === "REQUEST_IP_COOLDOWN") return t("ipCooldown");
          return apiMsg || t("sendError");
        }
        if (err instanceof Error && err.message) return err.message;
        return t("unexpectedError");
      },
      classNames: { icon: "text-jsyellow" },
    })
  );

  const handleAgeChange = (value: string | number) => {
    setValue("childAge", Number(value));
  };
  const handleLanguageChange = (value: string | number) => {
    setValue("childLanguage", value as Language);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center px-4"
      style={{
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? "auto" : "none",
        transition: "opacity 0.2s ease",
      }}
    >
      <div
        aria-hidden="true"
        onClick={toggle}
        className="absolute inset-0 bg-jsblack/20"
      />

      {success ? (
        <div
          className="
            relative z-10 bg-white rounded-[32px]
            w-full max-w-sm sm:max-w-md md:max-w-lg
            mx-auto p-6
            flex flex-col items-center space-y-4
          "
          style={{ animation: "modalIn 0.3s ease forwards" }}
        >
          <button
            className="self-end p-2 hover:bg-jsyellow/10 rounded-full"
            onClick={() => {
              reset();
              toggle();
              setSuccess(false);
            }}
            type="button"
          >
            <MdClose className="text-xl" />
          </button>
          <div className="font-semibold text-2xl text-center">{t("messageSent")}</div>
          <div
            className="bg-green-100 rounded-full p-4"
            style={{ animation: "checkIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) 0.2s both" }}
          >
            <MdOutlineCheck className="text-green-600 text-4xl" />
          </div>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="
            relative bg-white rounded-[32px]
            w-full max-w-sm sm:max-w-md md:max-w-lg
            mx-auto p-6 space-y-4
          "
          style={{ animation: "modalIn 0.3s ease forwards" }}
        >
          <input
            type="text"
            {...register("website")}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="absolute -left-[9999px] w-px h-px opacity-0 pointer-events-none overflow-hidden"
          />
          <div className="flex items-center justify-between mb-6">
            <div className="font-semibold text-2xl">{t("title")}</div>
            <button
              className="p-2 hover:bg-jsyellow/10 rounded-full"
              onClick={() => {
                reset();
                toggle();
              }}
              type="button"
            >
              <MdClose className="text-xl" />
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder={t("name.placeholder")}
              className="
                w-full h-12 px-4 py-3 rounded-[32px] border border-jsyellow bg-[#fef7eb]
                focus:outline-none focus:ring-2 focus:ring-jsyellow
                transition-shadow duration-300
              "
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^a-zA-Zа-яА-ЯёЁәəıiöüşğç\s]/g, "");
              }}
              {...register("name", {
                required: t("name.required"),
                minLength: { value: 2, message: t("name.minLength") },
                pattern: {
                  value: /^[a-zA-Zа-яА-ЯёЁәəıiöüşğç\s]+$/,
                  message: t("name.invalid"),
                },
              })}
            />
            {errors.name && (
              <p className="text-red-500 text-base pl-2">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder={t("surname.placeholder")}
              className="
                w-full h-12 px-4 py-3 rounded-[32px] border border-jsyellow bg-[#fef7eb]
                focus:outline-none focus:ring-2 focus:ring-jsyellow
                transition-shadow duration-300
              "
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^a-zA-Zа-яА-ЯёЁәəıiöüşğç\s]/g, "");
              }}
              {...register("surname", {
                required: t("surname.required"),
                minLength: { value: 2, message: t("surname.minLength") },
                pattern: {
                  value: /^[a-zA-Zа-яА-ЯёЁәəıiöüşğç\s]+$/,
                  message: t("surname.invalid"),
                },
              })}
            />
            {errors.surname && (
              <p className="text-red-500 text-base pl-2">{errors.surname.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <input
              type="tel"
              placeholder={t("number.placeholder")}
              className="
                w-full h-12 px-4 py-3 rounded-[32px] border border-jsyellow bg-[#fef7eb]
                focus:outline-none focus:ring-2 focus:ring-jsyellow
                transition-shadow duration-300
              "
              onKeyDown={(e) => {
                const char = e.key;
                if (
                  [
                    "Backspace", "Delete", "Tab", "Escape", "Enter",
                    "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
                    "Home", "End",
                  ].includes(char)
                ) return;
                if ((e.ctrlKey || e.metaKey) && ["a", "c", "v", "x", "z"].includes(char.toLowerCase())) return;
                if (!/[0-9+]/.test(char)) e.preventDefault();
              }}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^0-9+]/g, "");
              }}
              {...register("number", {
                required: t("number.required"),
                pattern: {
                  value: /^(\+994|0)(50|51|55|70|77|99|10)\d{7}$/,
                  message: t("number.invalid"),
                },
              })}
            />
            {errors.number && (
              <p className="text-red-500 text-base pl-2">{errors.number.message}</p>
            )}
          </div>

          <Select
            label={t("childAge.label")}
            description={t("childAge.description")}
            options={ageOptions}
            error={errors.childAge}
            placeholder={t("childAge.placeholder")}
            {...register("childAge", { required: t("childAge.required") })}
            onChange={handleAgeChange}
          />

          <Select
            label={t("childLanguage.label")}
            options={languageOptions}
            error={errors.childLanguage}
            placeholder={t("childLanguage.placeholder")}
            {...register("childLanguage", { required: t("childLanguage.required") })}
            onChange={handleLanguageChange}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="
              w-full bg-jsyellow text-white font-semibold py-5
              rounded-[32px] hover:bg-jsyellow/90 active:scale-[0.98]
              disabled:opacity-50 transition-all duration-300 shadow-md
            "
          >
            {isSubmitting ? t("sending") : t("submit")}
          </button>
        </form>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes checkIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
      ` }} />
    </div>
  );
}
