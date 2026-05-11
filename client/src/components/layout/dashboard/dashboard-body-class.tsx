"use client";

import { useEffect } from "react";

const BODY_CLASS = "dashboard-admin";

/** Dashboard-da body-ə sinif əlavə edir — yalnız bu hissədə kopyalama/seçmək/yapışdırma aktiv olur */
export default function DashboardBodyClass() {
  useEffect(() => {
    document.body.classList.add(BODY_CLASS);
    return () => document.body.classList.remove(BODY_CLASS);
  }, []);
  return null;
}
