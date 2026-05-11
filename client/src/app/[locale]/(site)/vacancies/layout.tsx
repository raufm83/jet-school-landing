import { setRequestLocale } from "next-intl/server";

export default async function VacanciesLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(locale);

  return (
    <div className="relative flex min-h-0 min-w-0 w-full flex-1 flex-col bg-transparent">
      <div className="relative z-[1] flex min-h-0 min-w-0 w-full flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
