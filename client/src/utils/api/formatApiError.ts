import type { AxiosError } from "axios";

type ErrorBody = {
  message?: unknown;
  error?: unknown;
  errors?: Record<string, string[] | string> | unknown;
  statusCode?: number;
};

/**
 * Axios / backend cavabından istifadəçiyə göstəriləcək konkret xəta mətni çıxarır.
 */
export function formatApiError(error: unknown, fallback = "Xəta baş verdi. Yenidən cəhd edin."): string {
  if (typeof error === "string" && error.trim()) return error.trim();

  const err = error as AxiosError<ErrorBody>;
  const status = err?.response?.status;
  const data = err?.response?.data;

  if (status === 413) {
    return "Fayl server üçün çox böyükdür. Şəkli 2 MB-dan kiçik edin və ya daha az piksel ilə saxlayın.";
  }

  if (status === 400 && !data) {
    return "Məlumatlar düzgün deyil (400). Zəhmət olmasa formanı yoxlayın.";
  }

  if (data && typeof data === "object") {
    const msg = data.message;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
    if (Array.isArray(msg) && msg.length) {
      return msg
        .map((m) => (typeof m === "string" ? m : typeof m === "object" ? JSON.stringify(m) : String(m)))
        .filter(Boolean)
        .join(" ");
    }

    const errField = data.error;
    if (typeof errField === "string" && errField.trim()) return errField.trim();
    if (Array.isArray(errField) && errField.length) {
      return errField.map(String).join(" ");
    }

    const errors = data.errors;
    if (errors && typeof errors === "object" && !Array.isArray(errors)) {
      const parts: string[] = [];
      for (const v of Object.values(errors as Record<string, unknown>)) {
        if (Array.isArray(v)) parts.push(...v.map(String));
        else if (typeof v === "string") parts.push(v);
      }
      if (parts.length) return parts.join(" ");
    }
  }

  const netMsg = err?.message;
  if (typeof netMsg === "string" && netMsg && !/^Request failed with status code \d+$/i.test(netMsg)) {
    if (netMsg === "Network Error") {
      return "Şəbəkə xətası. İnternet bağlantınızı yoxlayın.";
    }
    return netMsg;
  }

  if (status) {
    const text = err.response?.statusText;
    return text ? `Server xətası (${status}): ${text}` : `Server xətası (${status}).`;
  }

  return fallback;
}
