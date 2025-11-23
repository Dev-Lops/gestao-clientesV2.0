import 'dotenv/config'

/** @type {import('next').NextConfig} */
const s3Domain = process.env.S3_BUCKET
  ? `${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`
  : null

const nextConfig = {
  typedRoutes: false,
  // output: 'standalone' é para Docker, não Netlify
  ...(process.env.DOCKER_BUILD === 'true' && { output: 'standalone' }),
  images: {
    // Padrão de domínios remotos mais seguro (Next.js 16+)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fonts.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // Cloudflare R2 public assets (signed URLs)
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      ...(s3Domain
        ? [
            {
              protocol: 'https',
              hostname: s3Domain,
            },
          ]
        : []),
    ],
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ]
  },
  // Suporte para uploads grandes (até 1.5GB)
  experimental: {
    serverActions: {
      bodySizeLimit: '1.5gb',
    },
  },
}

// Sentry desabilitado - remova este bloco de comentário para reabilitar
export default nextConfig
