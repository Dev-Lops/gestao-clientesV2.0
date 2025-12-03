// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

const env = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // valores padrão conservadores em produção
  tracesSampleRate: Number(
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ??
      (process.env.NODE_ENV === 'production' ? '0.2' : '1')
  ),
  replaysSessionSampleRate: Number(
    process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE ??
      (process.env.NODE_ENV === 'production' ? '0.05' : '0.5')
  ),
  replaysOnErrorSampleRate: Number(
    process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE ?? '1'
  ),
  enableLogs: process.env.NODE_ENV !== 'production',
  sendDefaultPii: process.env.NEXT_PUBLIC_SENTRY_SEND_PII === 'true',
}

Sentry.init({
  dsn: env.dsn,
  integrations: [Sentry.replayIntegration()],
  tracesSampleRate: env.tracesSampleRate,
  enableLogs: env.enableLogs,
  replaysSessionSampleRate: env.replaysSessionSampleRate,
  replaysOnErrorSampleRate: env.replaysOnErrorSampleRate,
  sendDefaultPii: env.sendDefaultPii,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
