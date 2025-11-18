import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')

    // Custom performance tracking for Node.js runtime
    console.log('[Instrumentation] Node.js runtime initialized')

    // You can add custom slow query logging, API monitoring, etc.
    // Example: Track Prisma queries, external API calls, etc.
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
    console.log('[Instrumentation] Edge runtime initialized')
  }
}

export const onRequestError = Sentry.captureRequestError
