import { NextResponse } from "next/server";
import { resolvePublicApiBaseUrl } from "@/constants/public-api-base";

export const dynamic = "force-dynamic";

function backendApiBase(): string {
  const internal = process.env.API_INTERNAL_URL;
  if (typeof internal === "string" && internal.trim()) {
    return internal.trim().replace(/\/+$/, "");
  }
  return resolvePublicApiBaseUrl();
}

/**
 * Captcha-nı Next serverindən proxyləyir — brauzerdə CORS və səhv public URL qalmır.
 */
export async function GET() {
  try {
    const url = `${backendApiBase()}/captcha/math`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json(
        { message: "Captcha yüklənmədi" },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { message: "Captcha yüklənmədi" },
      { status: 502 },
    );
  }
}
