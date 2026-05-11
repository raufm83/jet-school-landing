"use client";

import { useEffect } from "react";
import { useSchemaStore } from "@/stores/useSchemaStore";

type SchemaNode = Record<string, unknown>;

/**
 * OrgSchemaLoader (server component) tərəfindən render edilir.
 * Serialized org+website schema-larını store-a yazır.
 * Özü heç bir <script> render etmir — GlobalSchemaRenderer bunu edir.
 */
export default function OrgSchemaClient({
  orgSchema,
  webSchema,
}: {
  orgSchema: SchemaNode;
  webSchema: SchemaNode;
}) {
  const setOrgNode = useSchemaStore((s) => s.setOrgNode);
  const setWebsiteNode = useSchemaStore((s) => s.setWebsiteNode);

  useEffect(() => {
    // @context-i strip edirik — GlobalSchemaRenderer @graph içinə @context-siz yazacaq
    const stripContext = (obj: SchemaNode): SchemaNode =>
      Object.fromEntries(Object.entries(obj).filter(([k]) => k !== "@context")) as SchemaNode;
    setOrgNode(stripContext(orgSchema));
    setWebsiteNode(stripContext(webSchema));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
