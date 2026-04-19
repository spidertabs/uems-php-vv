// next.config.ts
import type { NextConfig } from 'next';
import createAnalyzer from '@next/bundle-analyzer';

/* -----------------------------
   Bundle Analyzer
------------------------------ */
const withBundleAnalyzer = createAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/* -----------------------------
   Content Security Policy
------------------------------ */
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob:;
  media-src 'self' data: blob:;
  connect-src *;
  font-src 'self' data: https://fonts.gstatic.com;
  frame-src 'self';
  worker-src 'self' blob:;
`.replace(/\n/g, '');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
];

/* -----------------------------
   Env-based options
------------------------------ */
const output = process.env.EXPORT ? 'export' : undefined;
const basePath = process.env.BASE_PATH || undefined;
const unoptimized = !!process.env.UNOPTIMIZED;

/* -----------------------------
   Next.js Config
------------------------------ */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: false,

  output,
  basePath,

  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],

  env: {
    APP_NAME: 'UEMS',
    APP_VERSION: '3.0.0',
    CSP: ContentSecurityPolicy,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized,
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 85],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
