export interface GlossaryLinkTerm {
  text: string;
  href: string;
}

const SKIP_TAGS = new Set([
  "a", "h1", "h2", "h3", "h4", "h5", "h6",
  "script", "style", "code", "pre", "button",
  "textarea", "select", "noscript", "svg",
]);

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const escapeAttr = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * HTML mətnində glossary terminlərini <a> ilə əvəz edir (server tərəfdə).
 * - maksimum `max` link, hər termin yalnız ilk rastlaşmada
 * - başlıq, mövcud link, code/pre daxilində link yoxdur
 * - `excludeHref` (terminin öz səhifəsi) linklənmir
 */
export function linkGlossaryTerms(
  html: string,
  terms: GlossaryLinkTerm[],
  opts: { max?: number; excludeHref?: string; minLength?: number } = {}
): string {
  const { max = 10, excludeHref, minLength = 3 } = opts;
  if (!html || !terms?.length) return html;

  const map = new Map<string, GlossaryLinkTerm>();
  for (const t of terms) {
    const text = (t.text || "").trim();
    if (text.length < minLength || !t.href) continue;
    if (excludeHref && t.href === excludeHref) continue;
    const key = text.toLowerCase();
    if (!map.has(key)) map.set(key, { text, href: t.href });
  }
  if (map.size === 0) return html;

  const alternation = Array.from(map.values())
    .map((t) => t.text)
    .sort((a, b) => b.length - a.length)
    .map(escapeRe)
    .join("|");
  const re = new RegExp(
    `(?<![\\p{L}\\p{N}_])(${alternation})(?![\\p{L}\\p{N}_])`,
    "giu"
  );

  const used = new Set<string>();
  let count = 0;
  let skipDepth = 0;

  const parts = html.split(/(<!--[\s\S]*?-->|<[^>]+>)/g);
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    if (part.startsWith("<")) {
      if (part.startsWith("<!--")) continue;
      const m = /^<\s*(\/)?\s*([a-zA-Z][a-zA-Z0-9-]*)/.exec(part);
      if (!m) continue;
      const closing = !!m[1];
      const name = m[2].toLowerCase();
      const selfClosing = /\/\s*>$/.test(part);
      if (SKIP_TAGS.has(name) && !selfClosing) {
        skipDepth = closing ? Math.max(0, skipDepth - 1) : skipDepth + 1;
      }
      continue;
    }

    if (skipDepth > 0 || count >= max) continue;

    re.lastIndex = 0;
    parts[i] = part.replace(re, (match) => {
      if (count >= max) return match;
      const key = match.toLowerCase();
      const term = map.get(key);
      if (!term || used.has(key)) return match;
      used.add(key);
      count++;
      return `<a href="${escapeAttr(term.href)}">${match}</a>`;
    });
  }
  return parts.join("");
}


