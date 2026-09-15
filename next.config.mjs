/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdf-parse (and its worker's @napi-rs/canvas native binary dependency)
  // breaks if webpack tries to bundle it for the serverless function —
  // browser-only code paths (DOMMatrix) and a .node binary webpack can't
  // parse. Keeping it external forces Node's own require() resolution at
  // runtime instead. `serverExternalPackages` is only stable as a
  // top-level key from Next.js 15; on 14.2.x it's still under
  // `experimental.serverComponentsExternalPackages`.
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
