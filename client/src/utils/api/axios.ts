import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getSession } from "next-auth/react";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";

const api = axios.create({
  baseURL: PUBLIC_API_BASE,
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    config.headers = config.headers || {};

    if (typeof window !== "undefined") {
      try {
        const session = await getSession();

        if (session?.accessToken) {
          config.headers.Authorization = `Bearer ${session.accessToken}`;
        }
      } catch (error) {
        console.error("Error getting session:", error);
      }
    }

    if (config.data instanceof FormData) {
      delete (config.headers as Record<string, unknown>)["Content-Type"];
      delete (config.headers as Record<string, unknown>)["content-type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    config.headers["Accept"] = "*/*";

    return config;
  },
  (error: AxiosError) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const isTimeout = (error as any).code === "ECONNABORTED";
    const isSsgBuild =
      typeof window === "undefined" && process.env.NODE_ENV === "production";

    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        // Başqa cihazda sessiya olmaya bilər və ya token bitib – yenidən daxil olma tələb olunur
        sessionStorage.setItem("auth_redirect_message", "Sessiya bitib və ya etibarsızdır. Yenidən daxil olun.");
        window.location.href = "/dashboard/login/";
      }
    }

    // Avoid spamming logs during static generation when the external API times out.
    // Timeouts are already handled gracefully in the higher-level API helpers.
    if (!(isTimeout && isSsgBuild)) {
      console.error("API Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        },
      });
    }

    return Promise.reject(error);
  }
);

export default api;
