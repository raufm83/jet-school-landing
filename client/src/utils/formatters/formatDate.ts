function isValidDate(d: Date): boolean {
  return !Number.isNaN(d.getTime());
}

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  if (!isValidDate(d)) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Baku",
  })
    .format(d)
    .replace(/\//g, ".");
};

export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  if (!isValidDate(d)) return "";
  const datePart = formatDate(d);
  const timePart = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Baku",
  }).format(d);

  return `${datePart} ${timePart}`;
};

export const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  if (!isValidDate(d)) return "";

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Baku",
  }).format(d);
};
