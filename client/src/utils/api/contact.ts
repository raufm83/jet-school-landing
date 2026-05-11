import { cache } from "react";
import { ContactData } from "@/types/contact";
import { PUBLIC_API_BASE } from "@/constants/public-api-base";
import { CONTENT_ISR_LONG_SECONDS } from "@/constants/content-isr";

const emptyWorkingHours = {
  az: { weekdays: "", sunday: "" },
  ru: { weekdays: "", sunday: "" },
};

/** Admin paneldən (/contact API) məlumat gəlməyəndə boş struktur – UI "—" göstərir. */
function emptyContactData(): ContactData {
  return {
    email: "",
    phone: "",
    address: { az: "", ru: "" },
    address2: { az: "", ru: "" },
    whatsapp: "",
    workingHours: emptyWorkingHours,
  };
}

/**
 * Əlaqə məlumatı (GET /contact). `cache` eyni RSC sorğusunda Footer + OrgSchema təkrar çağırışlarını birləşdirir.
 */
export const getContact = cache(async function getContact(): Promise<ContactData> {
  try {
    const res = await fetch(`${PUBLIC_API_BASE}/contact`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: CONTENT_ISR_LONG_SECONDS },
    });

    if (!res.ok) {
      return emptyContactData();
    }

    const data = await res.json();
    const raw = Array.isArray(data) ? data[0] : data;
    if (!raw) return emptyContactData();

    return {
      email: raw.email ?? "",
      phone: raw.phone ?? "",
      address: {
        az: raw.address?.az ?? "",
        ru: raw.address?.ru ?? "",
      },
      address2: raw.address2 ?? { az: "", ru: "" },
      whatsapp: raw.whatsapp ?? "",
      workingHours: raw.workingHours ?? emptyWorkingHours,
      socialLinks: raw.socialLinks,
    };
  } catch (error) {
    console.error("Error fetching contact data:", error);
    return emptyContactData();
  }
});
