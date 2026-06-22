import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevents clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevents MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Forces HTTPS for 1 year
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Controls referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Restricts browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=self, microphone=(), geolocation=(), interest-cohort=()',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.hcaptcha.com https://hcaptcha.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https://*.supabase.co",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co https://api.smileidentity.com https://hcaptcha.com",
              "frame-src https://hcaptcha.com https://newassets.hcaptcha.com",
              "worker-src 'self' blob:",
            ].join('; '),
          },
          // XSS Protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;