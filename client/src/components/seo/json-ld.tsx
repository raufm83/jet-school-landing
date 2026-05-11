import React from "react";

type JsonLdProps = {
  data: object | object[];
};

/**
 * JSON-LD component.
 * - Single object → rendered as-is.
 * - Array of objects → each item is rendered as a separate JSON-LD script.
 *   This keeps entities isolated (one script = one container in validators).
 */
export default function JsonLd({ data }: JsonLdProps) {
  if (!data) return null;
  if (Array.isArray(data) && data.length === 0) return null;

  try {
    if (Array.isArray(data)) {
      return (
        <>
          {data.map((item, index) => {
            const normalized = item as Record<string, unknown>;
            const output = normalized["@context"]
              ? normalized
              : { "@context": "https://schema.org", ...normalized };
            const str = JSON.stringify(output).replace(/</g, "\\u003c");
            return (
              <script
                key={index}
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: str }}
              />
            );
          })}
        </>
      );
    }

    const output = data;
    const str = JSON.stringify(output).replace(/</g, "\\u003c");
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: str }}
      />
    );
  } catch {
    return null;
  }
}
