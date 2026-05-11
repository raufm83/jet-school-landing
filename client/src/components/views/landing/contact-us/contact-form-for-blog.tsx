"use client";

import { useState, useEffect } from "react";
import { Language, RequestFormInputs, RequestSubmitPayload } from "@/types/request";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import api from "@/utils/api/axios";
import Select from "@/components/ui/select";
import { MdClose, MdOutlineCheck } from "react-icons/md";
import { useMathCaptcha } from "@/hooks/useMathCaptcha";
import MathCaptcha from "@/components/shared/math-captcha";

const ageOptions = Array.from({ length: 7 }, (_, i) => ({
  value: i + 9,
  label: `${i + 9}`,
}));

const ContactFormForBlog = () => {
  const t = useTranslations("contact.form");
  const [success, setSuccess] = useState(false);
  const {
    challenge: mathCaptcha,
    error: mathCaptchaError,
    loading: mathCaptchaLoading,
    question: mathCaptchaQuestion,
    refreshCaptcha,
  } = useMathCaptcha();

  const languageOptions = [
    { value: Language.AZ, label: t("childLanguage.options.az") },
    { value: Language.RU, label: t("childLanguage.options.ru") },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<RequestFormInputs>({
    defaultValues: { mathCaptchaAnswer: "" },
  });

  useEffect(() => {
    if (mathCaptcha?.token) {
      setValue("mathCaptchaAnswer", "");
    }
  }, [mathCaptcha?.token, setValue]);

  const onSubmit: SubmitHandler<RequestFormInputs> = async (data) => {
    try {
      if (!mathCaptcha?.token) {
        toast.error(t("captchaError"));
        return;
      }
      const payload: RequestSubmitPayload = {
        ...data,
        mathCaptchaToken: mathCaptcha.token,
      };
      await api.post("/requests", payload);
      reset();
      await refreshCaptcha();
      setSuccess(true);
    } catch (err) {
      console.error("Error sending message:", err);
      if (axios.isAxiosError(err)) {
        const error = err as AxiosError<{ message?: string | string[] }>;
        const raw = error.response?.data?.message;
        const apiMsg = Array.isArray(raw) ? raw[0] : raw;
        toast.error(
          apiMsg === "REQUEST_IP_COOLDOWN"
            ? t("ipCooldown")
            : apiMsg || t("sendError")
        );
      } else {
        toast.error(t("unexpectedError"));
      }
      await refreshCaptcha();
    }
  };


  const handleAgeChange = (value: string | number) => {
    setValue("childAge", Number(value));
  };

  const handleLanguageChange = (value: string | number) => {
    setValue("childLanguage", value as Language);
  };

  const handleCaptchaRefresh = async () => {
    setValue("mathCaptchaAnswer", "");
    await refreshCaptcha();
  };

  return (
    <div className="relative border border-jsyellow p-4 py-6 rounded-[32px] pb-8">
      <motion.form
        className="space-y-6 w-full"
        onSubmit={handleSubmit(onSubmit)}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <input
          type="text"
          {...register("website")}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute -left-[9999px] w-px h-px opacity-0 pointer-events-none overflow-hidden"
        />
        <h2 className="text-2xl font-bold">{t("contactTitle")}</h2>
        <div className="space-y-2">
          <input
            type="text"
            placeholder={t("name.placeholder")}
            className="w-full h-12 px-4 py-3 rounded-[32px] border border-jsyellow bg-[#fef7eb] 
              focus:outline-none focus:ring-2 focus:ring-jsyellow 
              shadow-sm transition-all duration-300 ease-in-out"
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              target.value = target.value.replace(/[^a-zA-Zа-яА-ЯёЁәəıiöüşğç\s]/g, '');
            }}
            {...register("name", {
              required: t("name.required"),
              minLength: {
                value: 2,
                message: t("name.minLength"),
              },
              pattern: {
                value: /^[a-zA-Zа-яА-ЯёЁәəıiöüşğç\s]+$/,
                message: t("name.invalid"),
              },
            })}
          />
          {errors.name && (
            <p className="text-red-500 text-sm pl-2">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <input
            type="text"
            placeholder={t("surname.placeholder")}
            className="w-full h-12 px-4 py-3 rounded-[32px] border border-jsyellow bg-[#fef7eb] 
              focus:outline-none focus:ring-2 focus:ring-jsyellow 
              shadow-sm transition-all duration-300 ease-in-out"
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              target.value = target.value.replace(/[^a-zA-Zа-яА-ЯёЁәəıiöüşğç\s]/g, '');
            }}
            {...register("surname", {
              required: t("surname.required"),
              minLength: {
                value: 2,
                message: t("surname.minLength"),
              },
              pattern: {
                value: /^[a-zA-Zа-яА-ЯёЁәəıiöüşğç\s]+$/,
                message: t("surname.invalid"),
              },
            })}
          />
          {errors.surname && (
            <p className="text-red-500 text-sm pl-2">
              {errors.surname.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <input
            type="tel"
            placeholder={t("number.placeholder")}
            className="w-full h-12 px-4 py-3 rounded-[32px] border border-jsyellow bg-[#fef7eb] 
              focus:outline-none focus:ring-2 focus:ring-jsyellow 
              shadow-sm transition-all duration-300 ease-in-out"
            onKeyDown={(e) => {
              const char = e.key;
              // Allow: backspace, delete, tab, escape, enter, arrows, home, end
              if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(char)) {
                return;
              }
              // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
              if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(char.toLowerCase())) {
                return;
              }
              // Only allow numbers and +
              if (!/[0-9+]/.test(char)) {
                e.preventDefault();
              }
            }}
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              target.value = target.value.replace(/[^0-9+]/g, '');
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
            <p className="text-red-500 text-sm pl-2">
              {errors.number.message}
            </p>
          )}
        </div>

        <Select
          label={t("childAge.label")}
          options={ageOptions}
          error={errors.childAge}
          placeholder={t("childAge.placeholder")}
          {...register("childAge", {
            required: t("childAge.required"),
          })}
          onChange={handleAgeChange}
        />

        <Select
          label={t("childLanguage.label")}
          options={languageOptions}
          error={errors.childLanguage}
          placeholder={t("childLanguage.placeholder")}
          {...register("childLanguage", {
            required: t("childLanguage.required"),
          })}
          onChange={handleLanguageChange}
        />

        <MathCaptcha
          question={mathCaptchaQuestion}
          challengeError={mathCaptchaError}
          loadErrorMessage={t("mathCaptcha.loadError")}
          answerLocked={!mathCaptcha?.token}
          loading={mathCaptchaLoading}
          error={errors.mathCaptchaAnswer?.message}
          register={register}
          onRefresh={handleCaptchaRefresh}
          label={t("mathCaptcha.label")}
          placeholder={t("mathCaptcha.placeholder")}
          requiredMessage={t("mathCaptcha.required")}
        />

        <motion.button
          type="submit"
          className="w-full bg-jsyellow text-white font-semibold py-4 px-8 
            rounded-[32px] hover:bg-jsyellow/90 disabled:opacity-50 
            transition-all duration-300 ease-in-out shadow-md"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting || mathCaptchaLoading || !mathCaptcha?.token}
        >
          {isSubmitting ? t("sending") : t("submit")}
        </motion.button>
      </motion.form>

      <AnimatePresence>
        {success && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSuccess(false)}
          >
            <motion.div
              className="bg-white rounded-[32px] p-6 w-full max-w-[500px] mx-4 space-y-4 relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-4 right-4 hover:bg-jsyellow/10 p-2 rounded-full"
                onClick={() => setSuccess(false)}
              >
                <MdClose className="text-xl" />
              </motion.button>
              <div className="flex flex-col items-center justify-center space-y-4 pt-4">
                <h2 className="font-semibold text-lg text-jsblack text-center">
                  {t("messageSent")}
                </h2>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.2,
                  }}
                  className="bg-green-100 rounded-full p-3"
                >
                  <MdOutlineCheck className="text-green-600 text-3xl" />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContactFormForBlog;