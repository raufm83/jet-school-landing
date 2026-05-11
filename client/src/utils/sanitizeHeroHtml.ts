/**
 * İdarə panelindən gələn HTML üçün əsas təhlükəsizlik filtirı (admin məzmununa güvənsək belə).
 */
export function sanitizeHeroHtml(html: string): string {
  if (!html?.trim()) return "";
  let s = html;
  s = s.replace(/<script\b[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style\b[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<\/?(?:iframe|object|embed|form|input|button|textarea|select)\b[^>]*>/gi, "");
  s = s.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  s = s.replace(/href\s*=\s*(?:"|')?\s*javascript:[^"'>]*/gi, 'href="#"');
  return s;
}
