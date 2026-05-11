import RegistrationClient from "@/components/views/landing/registration/registration-client";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "contact.form.registration" });

  return {
    title: `${t("title")} | JET School`,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export default function RegistrationPage() {
  return <RegistrationClient />;
}
