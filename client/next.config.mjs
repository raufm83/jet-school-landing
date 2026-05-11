import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();
const DEV_RECAPTCHA_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === "development"
        ? "http://localhost:3002/api"
        : "https://api.jetschool.az/api"),
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY:
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
      process.env.RECAPTCHA_SITE_KEY ||
      process.env.GOOGLE_RECAPTCHA_SITE_KEY ||
      (process.env.NODE_ENV === "development" ? DEV_RECAPTCHA_SITE_KEY : ""),
  },
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  // Canonical / alternates URL-ləri üçün kök və səhifə sonunda / — Next metadata x-default-u düzgün saxlayır
  trailingSlash: true,
  experimental: {
    optimizePackageImports: [
      "@nextui-org/react",
      "react-icons",
      "date-fns",
      "swiper",
      "framer-motion",
      "yet-another-react-lightbox",
    ],
    // Keçidlərdə müştəri router keşini sıfır saxlayırıq ki, admin/ISR yeniləmələri daha az müşahidə olunan gecikmə ilə görünsün.
    staleTimes: {
      dynamic: 0,
      static: 600,
    },
    // Inline critical CSS and defer non-critical CSS to remove render-blocking stylesheets
    optimizeCss: true,
  },
  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Development optimizations
    if (dev) {
      // Enable fast refresh
      config.optimization.moduleIds = "named";

      // Optimize development builds
      config.optimization.removeAvailableModules = false;
      config.optimization.removeEmptyChunks = false;
      config.optimization.splitChunks = false;
    }

    // Production optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        minSize: 20000,
        maxSize: 244000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 25,
        cacheGroups: {
          // React core — tiny, very cacheable
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: "framework",
            priority: 50,
            chunks: "all",
            enforce: true,
          },
          // Heavy animation library — only loaded when async components mount
          framerMotion: {
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            name: "framer-motion",
            priority: 40,
            chunks: "async",
            reuseExistingChunk: true,
          },
          // NextUI component library
          nextui: {
            test: /[\\/]node_modules[\\/]@nextui-org[\\/]/,
            name: "nextui",
            priority: 40,
            chunks: "async",
            reuseExistingChunk: true,
          },
          // Swiper — only needed on pages with sliders
          swiper: {
            test: /[\\/]node_modules[\\/]swiper[\\/]/,
            name: "swiper",
            priority: 35,
            chunks: "async",
            reuseExistingChunk: true,
          },
          // Remaining node_modules
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      };
    }

    // Optimize module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },

  images: {
    // WebP birinci: ilk sorğuda AVIF kodlamasından daha tez cavab; AVIF hələ də dəstəklənəndə alternativdir.
    formats: ["image/webp", "image/avif"],
    // 560 əlavə edildi: 2x DPR mobil (280px*2=560px) → 640-dan əvəzinə 560px versiyası seçilir
    deviceSizes: [320, 400, 560, 640, 750, 828, 1080, 1200, 1920],
    // 192 əlavə edildi: 1.5x DPR (120px*1.5=180px) → 256-dan əvəzinə 192px versiyası seçilir
    imageSizes: [16, 32, 48, 64, 96, 128, 192, 256, 384],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "place-hold.it",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.jetschool.az",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "jetschool.az",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.jetschool.az",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3002",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "localhost",
        port: "3002",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "3002",
        pathname: "/**",
      },
      ...(typeof process.env.NEXT_PUBLIC_CDN_URL === "string" &&
      process.env.NEXT_PUBLIC_CDN_URL
        ? (() => {
            try {
              const host = new URL(process.env.NEXT_PUBLIC_CDN_URL).hostname;
              return host && host !== "api.jetschool.az"
                ? [{ protocol: "https", hostname: host, port: "", pathname: "/**" }]
                : [];
            } catch {
              return [];
            }
          })()
        : []),
    ],
  },
  async headers() {
    return [
      {
        // Static assets: aggressive long-term caching
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Optimized images: 1-year cache
        source: "/_next/image",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Static public files (fonts, images, icons)
        source: "/:path*\\.(webp|png|jpg|jpeg|svg|ico|woff2|woff|ttf|otf)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Security headers for all pages
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/sitemap.xml",
        destination: "/api/sitemap",
      },
    ];
  },
};

export default withNextIntl(nextConfig);
