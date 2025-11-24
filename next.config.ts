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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://*.googletagmanager.com https://www.gstatic.com; script-src-elem 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://*.googletagmanager.com https://www.gstatic.com; worker-src 'self' blob:; connect-src 'self' https://*.googleapis.com https://apis.google.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com https://*.ingest.us.sentry.io https://*.ingest.sentry.io https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.google.com https://www.googleapis.com https://*.r2.cloudflarestorage.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com; img-src 'self' data: https: blob:; media-src 'self' https://*.r2.cloudflarestorage.com blob: data:; font-src 'self' data: https://fonts.gstatic.com https://www.gstatic.com; frame-src 'self' https://accounts.google.com https://*.firebaseapp.com; form-action 'self' https://accounts.google.com; frame-ancestors 'self'",
          },
        ],
      },
    ]
  },
  // Suporte para uploads grandes (até 1.5GB)
  experimental: {
    serverActions: {
      bodySizeLimit: '1.5gb',
    },
  },
  // Configuração de API routes para Netlify
  serverRuntimeConfig: {
    // Limite de body para API routes (padrão é 4MB)
    // Netlify respeita isso junto com configuração do plugin
    bodyParser: {
      sizeLimit: '1.5gb',
    },
  },
}

// Sentry desabilitado - remova este bloco de comentário para reabilitar
export default nextConfig
