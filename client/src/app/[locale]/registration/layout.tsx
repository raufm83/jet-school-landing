import { setRequestLocale } from "next-intl/server";

export default async function RegistrationLayout({
  params: { locale },
  children,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(locale);
  return <>{children}</>;
}
