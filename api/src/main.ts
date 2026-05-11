// main.ts
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { apiReference } from '@scalar/nestjs-api-reference';
import * as express from 'express';
import compression from 'compression';

const DEFAULT_ORIGINS = [
  'https://jetschool.az',
  'https://www.jetschool.az',

  'http://jetschool.az',
  'http://www.jetschool.az',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
];

const ALLOWED_ORIGINS: string[] = [
  ...DEFAULT_ORIGINS,
  ...(process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? []),
];
const isDev = process.env.NODE_ENV !== 'production';

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split('.').map(Number);

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;

  return (
    a === 10 ||
    a === 127 ||
    (a === 192 && b === 168) ||
    (a === 172 && b >= 16 && b <= 31)
  );
}

function isLocalHostname(hostname: string) {
  return hostname === 'localhost' || hostname === '::1' || hostname.endsWith('.local');
}

function isLanHostname(hostname: string) {
  return !hostname.includes('.') && hostname !== '';
}

function isAllowedOrigin(origin?: string) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (isDev) return true;

  try {
    const { hostname, protocol } = new URL(origin);

    if (protocol !== 'http:' && protocol !== 'https:') {
      return false;
    }

    return (
      isLocalHostname(hostname) ||
      isPrivateIpv4(hostname) ||
      isLanHostname(hostname)
    );
  } catch {
    return false;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Express body parser istifadə edəcəyik
  });

  // JSON/HTML cavabları gzip ilə kiçilt — şəkil/video statik fayllara toxunmur
  app.use(compression({ threshold: 1024 }));

  // CORS: başqa kompüterdən (IP və ya fərqli origin) girişdə brauzer cavabı bloklamasın.
  // Development-da istənilən origin icazəli; production-da CORS_ORIGINS və default siyahı.
  app.use((req, res, next) => {
    const origin = req.headers.origin as string | undefined;
    const allowed = isAllowedOrigin(origin);

    if (origin && allowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS',
      );
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Accept, Authorization, Origin, X-Requested-With',
      );
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
    }

    if (req.method === 'OPTIONS') {
      if (!allowed) {
        return res.status(403).end();
      }
      return res.status(204).end();
    }

    next();
  });

  // Body parser limitləri - 50MB
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(express.raw({ limit: '50mb', type: 'application/octet-stream' }));

  // JSON cavablarında charset (UTF-8 mətnlər — tələbə layihəsi kateqoriyaları və s.)
  app.use((_req, res, next) => {
    const sendJson = res.json.bind(res);
    res.json = function jsonWithCharset(body?: unknown) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return sendJson(body);
    };
    next();
  });

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (isAllowedOrigin(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'Origin',
      'X-Requested-With',
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 86400,
  });

  // Static files middleware
  app.use((req, res, next) => {
    if (req.path.includes('/uploads/') || req.path.endsWith('.webp')) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    next();
  });

  app.setGlobalPrefix('api');

  // Swagger config...
  const config = new DocumentBuilder()
    .setTitle('JET School API')
    .setDescription('API endpoints documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
    jsonDocumentUrl: 'docs/swagger/json',
  });

  app.use(
    '/reference',
    apiReference({
      theme: 'deepSpace',
      spec: {
        url: 'api/docs/swagger/json',
      },
    }),
  );

  app.use('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send('User-agent: *\nDisallow: /uploads/\nDisallow: /*.webp$');
  });

  app.enableShutdownHooks();

  const port = process.env.API_PORT || process.env.PORT || 3002;
  await app.listen(port);
}

bootstrap();
