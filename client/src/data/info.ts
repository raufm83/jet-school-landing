/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
interface AboutPoint {
  title: string;
  description: string;
  position: "fixed" | "sticky";
  top: string;
}

export const getAboutPoints = (t: any) => {
  return [
    {
      title: t("points.interactive.title"),
      description: t("points.interactive.description"),
      position: "fixed",
      top: "25",
    },
    {
      title: t("points.experienced.title"),
      description: t("points.experienced.description"),
      position: "fixed",
      top: "100",
    },
    {
      title: t("points.individual.title"),
      description: t("points.individual.description"),
      position: "fixed",
      top: "175",
    },
    {
      title: t("points.future.title"),
      description: t("points.future.description"),
      position: "fixed",
      top: "250",
    },
    {
      title: t("points.parental.title"),
      description: t("points.parental.description"),
      position: "fixed",
      top: "325",
    },
    {
      title: t("points.certificate.title"),
      description: t("points.certificate.description"),
      position: "sticky",
      top: "400",
    },
  ];
};
