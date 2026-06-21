import type { NextConfig } from 'next';
import path from 'path';

const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? process.env.R2_PUBLIC_URL;
let r2Hostname: string | undefined;
try {
  if (r2PublicUrl) {
    r2Hostname = new URL(r2PublicUrl).hostname;
  }
} catch {
  r2Hostname = undefined;
}

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@storix/ui', '@storix/shared', '@storix/sdk'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'plus.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'img.vietqr.io', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', pathname: '/**' },
      ...(r2Hostname
        ? [{ protocol: 'https' as const, hostname: r2Hostname, pathname: '/**' }]
        : [{ protocol: 'https' as const, hostname: '*.r2.dev', pathname: '/**' }]),
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
