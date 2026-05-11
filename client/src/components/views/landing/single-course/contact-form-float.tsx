"use client";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import ContactFormForSingle from "../contact-us/contact-form-for-single";

interface ContactFormFloatProps {
  title?: string;
}

export default function ContactFormFloat({ title }: ContactFormFloatProps) {
  const t = useTranslations("singleCoursePage");

  return (
    <div className="w-full">
      <motion.div
        className="bg-white border border-jsyellow rounded-2xl sm:rounded-[28px] p-4 sm:p-5 lg:p-5 xl:p-6 shadow-lg"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-lg sm:text-xl lg:text-lg xl:text-xl font-semibold text-jsblack mb-4 text-center leading-snug [@media(min-width:3500px)]:!text-3xl">
          {t(title ? title : "enroll")}
        </h3>
        <ContactFormForSingle />
      </motion.div>
    </div>
  );
}