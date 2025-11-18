'use client'

import posthog from 'posthog-js'

let initialized = false

export function initPostHog() {
  if (initialized) return
  if (typeof window === 'undefined') return

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return

  posthog.init(key, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    capture_pageview: false,
    person_profiles: 'identified_only',
    autocapture: true,
  })

  initialized = true
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  if (!initialized) return
  posthog.capture(event, properties)
}

export function identifyUser(id: string, properties?: Record<string, any>) {
  if (!initialized) return
  posthog.identify(id, properties)
}

export function trackPageview(path: string) {
  if (!initialized) return
  posthog.capture('$pageview', { path })
}

export function getPostHog() {
  return posthog
}
