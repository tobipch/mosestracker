/**
 * MOSES - Next.js Konfiguration
 * "Und der HERR sprach: Ich habe das Elend meines Volkes gesehen." (Ex 3,7)
 */

/** Sicherheits-Header, die fuer jede Antwort gelten. Die Content-Security-Policy
 *  wird pro Request in src/proxy.ts gesetzt (sie braucht eine frische Nonce). */
const sicherheitsHeader = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Kein Suchmaschinen-Index: Personendaten gehoeren nicht in Google.
  { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet, noimageindex' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: sicherheitsHeader }];
  },
};

export default nextConfig;
