import { getContact } from "@/utils/api/contact";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/data/site-schema";
import OrgSchemaClient from "@/components/seo/org-schema-client";

export default async function OrgSchemaLoader({ locale }: { locale: string }) {
  const contact = await getContact();
  const orgSchema = buildOrganizationSchema(locale, contact) as Record<string, unknown>;
  const webSchema = buildWebSiteSchema(locale) as Record<string, unknown>;
  return <OrgSchemaClient orgSchema={orgSchema} webSchema={webSchema} />;
}
