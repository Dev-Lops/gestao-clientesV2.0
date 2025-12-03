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
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value:
              'accelerometer=(), camera=(), geolocation=(), microphone=(), payment=(), usb=()',
          },
          // HSTS apenas em produção com HTTPS
          ...(process.env.NODE_ENV === 'production'
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains; preload',
                },
              ]
            : []),
        ],
      },
    ]
  },
  // Reduzir corpo máximo: incentivar uploads diretos (presigned). Sem aumento global.
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

// Sentry desabilitado - remova este bloco de comentário para reabilitar
export default nextConfig
