import 'dotenv/config'

/** @type {import('next').NextConfig} */
const s3Domain = process.env.S3_BUCKET
  ? `${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`
  : null

const nextConfig = {
  typedRoutes: false,
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
  // Suporte para uploads grandes (até 1.5GB)
  experimental: {
    serverActions: {
      bodySizeLimit: '1.5gb',
    },
  },
}

export default nextConfig
