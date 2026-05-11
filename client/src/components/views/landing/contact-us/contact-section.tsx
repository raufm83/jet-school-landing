import { getLocale, getTranslations } from "next-intl/server";
import ContactForm from "./contact-form";
import ContactInfo from "./contact-info";
import { getContact } from "@/utils/api/contact";
import { ContactData } from "@/types/contact";

/** initialData veriləndə (məs. contact-us səhifəsindən) təkrar fetch edilmir – admin paneldən gələn məlumat istifadə olunur. */
export default async function ContactSection({
  initialData,
}: {
  initialData?: ContactData;
}) {
  const t = await getTranslations();
  const locale = await getLocale();
  const contactData: ContactData = initialData ?? (await getContact());

  return (
    <section className="container py-12 flex flex-col  w-full gap-12 items-center">
      <div className="w-full block md:hidden">
        <ContactInfo
          phone={contactData.phone}
          email={contactData.email}
          address={
            contactData.address[locale as keyof typeof contactData.address]
          }
          address2={
            contactData.address2[locale as keyof typeof contactData.address2]
          }
          whatsapp={contactData.whatsapp}
          workingHours={contactData.workingHours[locale as keyof typeof contactData.workingHours]}
        />
      </div>

      <div className="space-y-6 w-full">
        <h1 className="mb-3 font-bold text-jsblack text-2xl sm:text-3xl md:text-4xl leading-tight">
          {t("contact.form.title")}
        </h1>
        <p className="text-pretty text-base leading-snug text-jsblack/70 sm:text-lg">
          {t("contact.form.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-12">
        {/* Form – her cihazda sol/sıralı */}
        <div className="w-full">
          <ContactForm />
        </div>

        <div className="w-full hidden md:block">
          <ContactInfo
            phone={contactData.phone}
            email={contactData.email}
            address={
              contactData.address[locale as keyof typeof contactData.address]
            }
            address2={
              contactData.address2[locale as keyof typeof contactData.address2]
            }
            whatsapp={contactData.whatsapp}
            workingHours={contactData.workingHours[locale as keyof typeof contactData.workingHours]}
          />
        </div>
      </div>
    </section>
  );
}
