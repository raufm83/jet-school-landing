"use client";

import { useCallback, useEffect, useState } from "react";

export type MathCaptchaChallenge = {
  question: string;
  token: string;
  expiresAt: number;
};

export function useMathCaptcha({ enabled = true }: { enabled?: boolean } = {}) {
  const [challenge, setChallenge] = useState<MathCaptchaChallenge | null>(null);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(false);

  const refreshCaptcha = useCallback(async () => {
    if (!enabled) {
      setChallenge(null);
      setQuestion("");
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/captcha/math", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load math captcha");
      }

      const data = (await response.json()) as MathCaptchaChallenge;
      setChallenge(data);
      setQuestion(data.question);
    } catch {
      setChallenge(null);
      setQuestion("");
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refreshCaptcha();
  }, [refreshCaptcha]);

  return {
    challenge,
    error,
    loading,
    question,
    refreshCaptcha,
  };
}
