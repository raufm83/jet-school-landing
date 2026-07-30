import type { Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import dynamic from "next/dynamic";
import { GoogleAnalytics } from '@next/third-parties/google';
import Preloader from "@/components/ui/preloader";

const ContentProtection = dynamic(
  () => import("@/components/content-protection"),
  { ssr: false }
);

const Toaster = dynamic(
  () => import("sonner").then((m) => ({ default: m.Toaster })),
  { ssr: false }
);

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

const manrope = Manrope({
  display: "swap",
  preload: true,
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  adjustFontFallback: true,
});

/**
 * Root layout `headers()`/`cookies()` çağırmır — bütün sayt statik qabığı router önbellekində daha yaxşı işləyir,
 * keçidlər daha tez RSC faylı əldə edir. `lang` URL-dən `beforeInteractive` skriptdə (və HtmlLangSync-də) təyin olunur.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az" suppressHydrationWarning>
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-K3WBZ7F2');`,
          }}
        />
        {/* End Google Tag Manager */}
        {/* Yalnız lazımi prefetch */}
        <link rel="dns-prefetch" href="https://img.youtube.com" />
      </head>
      <body
        className={`${manrope.className} scroll-smooth antialiased max-w-full bg-white`}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-K3WBZ7F2"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <Preloader />
        <Script
          id="sync-html-lang-from-path"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var p=location.pathname.split('/').filter(Boolean);var l=p[0]==='ru'?'ru':'az';document.documentElement.setAttribute('lang',l);}catch(e){}})();",
          }}
        />
        <ContentProtection />
        {children}
        <Toaster />
        <Script
          id="meta-pixel"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '24501015369551397');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            alt=""
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=24501015369551397&ev=PageView&noscript=1"
          />
        </noscript>
        <GoogleAnalytics gaId="G-8PKPCDFDSF" />
      </body>
    </html>
  );
}