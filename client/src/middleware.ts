/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse, NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { getToken } from "next-auth/jwt";

export enum Role {
  ADMIN = "ADMIN",
  AUTHOR = "AUTHOR",
  STAFF = "STAFF",
  USER = "USER",
  CRMOPERATOR = "CRMOPERATOR",
  CONTENTMANAGER = "CONTENTMANAGER",
  HRMANAGER = "HRMANAGER",
}

const ROUTE_PERMISSIONS = {
  COMMON: ["/dashboard/login"],

  ADMIN_ONLY: [
    "/dashboard/admin",
    "/dashboard/settings",
    "/dashboard/users",
    "/dashboard/users/create",
    "/dashboard/users/edit",
    "/dashboard/contact-info",
  ],

  STAFF: [
    "/dashboard/settings",
    "/dashboard/student-projects",
    "/dashboard/student-projects/create",
    "/dashboard/student-projects/edit",
    "/dashboard/student-reviews",
    "/dashboard/student-reviews/create",
    "/dashboard/student-reviews/edit",
    "/dashboard/team",
    "/dashboard/team/create",
    "/dashboard/team/edit",
    "/dashboard/requests",
    "/dashboard/exams",
    "/dashboard/gallery",
    "/dashboard/gallery/create",
    "/dashboard/gallery/edit",
  ],

  USER: ["/dashboard/profile", "/dashboard/settings"],

  AUTHOR: [
    "/dashboard/posts",
    "/dashboard/posts/create",
    "/dashboard/posts/edit",
    "/dashboard/glossary",
    "/dashboard/glossary/create",
    "/dashboard/glossary/edit",
    "/dashboard/settings",
  ],

  CRMOPERATOR: ["/dashboard/requests", "/dashboard/settings"],

  CONTENTMANAGER: [
    "/dashboard/settings",
    "/dashboard/student-projects",
    "/dashboard/student-projects/create",
    "/dashboard/student-projects/edit",
    "/dashboard/student-reviews",
    "/dashboard/student-reviews/create",
    "/dashboard/student-reviews/edit",
    "/dashboard/gallery",
    "/dashboard/gallery/create",
    "/dashboard/gallery/edit",
    "/dashboard/courses",
    "/dashboard/posts",
    "/dashboard/posts/create",
    "/dashboard/posts/edit",
    "/dashboard/blog-categories",
    "/dashboard/team",
    "/dashboard/team/create",
    "/dashboard/team/edit",
    "/dashboard/glossary",
    "/dashboard/glossary/create",
    "/dashboard/glossary/edit",
    "/dashboard/seo",
    "/dashboard/faq",
    "/dashboard/faq/create",
    "/dashboard/faq/edit",
    "/dashboard/vacancies",
    "/dashboard/vacancies/create",
    "/dashboard/vacancies/edit",
  ],

  /** Yalnız vakansiyalar + şəxsi profil (CRM operator kimi) */
  HRMANAGER: [
    "/dashboard/settings",
    "/dashboard/vacancies",
    "/dashboard/vacancies/create",
    "/dashboard/vacancies/edit",
  ],
};

const ROLE_HOME_PAGES = {
  [Role.ADMIN]: "/dashboard/requests",
  [Role.AUTHOR]: "/dashboard/posts",
  [Role.STAFF]: "/dashboard/requests",
  [Role.USER]: "/dashboard/settings",
  [Role.CRMOPERATOR]: "/dashboard/requests",
  [Role.CONTENTMANAGER]: "/dashboard/student-projects",
  [Role.HRMANAGER]: "/dashboard/vacancies",
};

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Next.js `trailingSlash: true` → pathname `/dashboard/login/` olur; marşrut müqayisələri isə slash-sızdır.
 */
function normalizePathname(pathname: string): string {
  if (pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

const DASHBOARD_LOGIN_PATH = "/dashboard/login";

function htmlLangFromPathname(pathname: string): "az" | "ru" {
  const p = pathname.replace(/\/+$/, "") || "/";
  const first = p.split("/").filter(Boolean)[0];
  if (first === "ru") return "ru";
  return "az";
}

function withHtmlLangHeader(request: NextRequest, lang: "az" | "ru"): NextRequest {
  const h = new Headers(request.headers);
  h.set("x-html-lang", lang);
  return new NextRequest(request, { headers: h });
}

function nextDashboard(request: NextRequest) {
  const h = new Headers(request.headers);
  h.set("x-html-lang", "az");
  return NextResponse.next({ request: { headers: h } });
}

/**
 * Checks if a pathname matches any route in the provided routes array
 */
const pathMatches = (pathname: string, routes: string[]): boolean => {
  if (routes.includes(pathname)) {
    return true;
  }

  return routes.some((route) => {
    if (route.endsWith("/edit") || route.endsWith("/create")) {
      const baseRoute = route.split("/").slice(0, -1).join("/");
      return (
        pathname.startsWith(baseRoute + "/") &&
        (pathname.includes("/edit/") || pathname.includes("/create/"))
      );
    }
    return false;
  });
};

/**
 * Determines if a user with the given role has access to the specified path
 */
const hasRouteAccess = (pathname: string, role: Role): boolean => {
  if (pathMatches(pathname, ROUTE_PERMISSIONS.COMMON)) {
    return true;
  }

  if (pathname === "/dashboard") {
    return true;
  }

  if (role === Role.ADMIN) {
    return true;
  }

  switch (role) {
    case Role.AUTHOR:
      return pathMatches(pathname, ROUTE_PERMISSIONS.AUTHOR);
    case Role.STAFF:
      return pathMatches(pathname, ROUTE_PERMISSIONS.STAFF);
    case Role.USER:
      return pathMatches(pathname, ROUTE_PERMISSIONS.USER);
    case Role.CRMOPERATOR:
      return pathMatches(pathname, ROUTE_PERMISSIONS.CRMOPERATOR);
    case Role.CONTENTMANAGER:
      return pathMatches(pathname, ROUTE_PERMISSIONS.CONTENTMANAGER);
    case Role.HRMANAGER:
      return pathMatches(pathname, ROUTE_PERMISSIONS.HRMANAGER);
    default:
      return false;
  }
};

/**
 * Gets the appropriate home page URL for a given role
 */
const getRoleHomePage = (role: Role, request: Request): URL => {
  let homePath = ROLE_HOME_PAGES[role] || "/dashboard/settings";
  return new URL(homePath, request.url);
};

const middlewares = withAuth(
  async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const path = normalizePathname(pathname);

    // Protect robots.txt from normal users
    if (pathname === "/robots.txt") {
      const userAgent = request.headers.get("user-agent") || "";
      const isSearchEngine = /Googlebot|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot/i.test(userAgent);
      if (!isSearchEngine) {
        return new NextResponse("Not Found", { status: 404 });
      }
      return NextResponse.next();
    }

    if (pathname.match(/^\/(az|ru)\/dashboard\/login/)) {
      const newUrl = new URL(pathname.replace(/^\/(az|ru)/, ""), request.url);
      return NextResponse.redirect(newUrl);
    }

    if (pathname.startsWith("/en/") || pathname === "/en") {
      const newUrl = new URL(pathname.replace(/^\/en/, "/az"), request.url);
      return NextResponse.redirect(newUrl);
    }

    /* ?letter=… (lüğət hərfi və s.) axtarış nəticələri indekslənməsin */
    if (request.nextUrl.searchParams.has("letter") && !pathname.startsWith("/dashboard")) {
      const intlRes = intlMiddleware(
        withHtmlLangHeader(request, htmlLangFromPathname(pathname))
      );
      intlRes.headers.set("X-Robots-Tag", "noindex, follow");
      return intlRes;
    }

    if (pathname.startsWith("/dashboard")) {
      if (path === "/dashboard/login") {
        const token = await getToken({ req: request });

        if (token) {
          const roleName = (token.role as Role) || Role.USER;
          return NextResponse.redirect(getRoleHomePage(roleName, request));
        }
        return nextDashboard(request);
      }

      const token = await getToken({ req: request });
      if (!token) {
        const loginUrl = new URL(DASHBOARD_LOGIN_PATH, request.url);
        if (path !== "/dashboard/login") {
          loginUrl.searchParams.set("callbackUrl", pathname);
        }
        return NextResponse.redirect(loginUrl);
      }

      const userRole = (token.role as Role) || Role.USER;

      if (path === "/dashboard") {
        return NextResponse.redirect(getRoleHomePage(userRole, request));
      }

      if (!hasRouteAccess(path, userRole)) {
        return NextResponse.redirect(getRoleHomePage(userRole, request));
      }

      return nextDashboard(request);
    }

    // SEO: JSON-LD schema üçün layout-da pathname oxumaq
    const h = new Headers(request.headers);
    h.set("x-html-lang", htmlLangFromPathname(pathname));
    h.set("x-pathname", pathname);
    const newReq = new NextRequest(request, { headers: h });
    
    return intlMiddleware(newReq);
  },
  {
    callbacks: {
      authorized: ({ token }) => true,
    },
    pages: {
      signIn: "/dashboard/login",
    },
  }
);

export default middlewares;

export const config = {
  matcher: [
    "/robots.txt",
    "/dashboard/:path*",
    "/((?!api|_next|public|_vercel|.*\\..*|favicon.ico).*)",
    "/",
    "/(az|ru)/:path*",
  ],
};
