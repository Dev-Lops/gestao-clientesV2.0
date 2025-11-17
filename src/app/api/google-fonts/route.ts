import GOOGLE_FONTS_FALLBACK from '@/lib/google-fonts-fallback'
import { NextResponse } from 'next/server'

type CacheEntry = {
  ts: number
  data: Array<{ family: string; variants?: string[] }>
}

let cache: CacheEntry | null = null

const CACHE_TTL = 1000 * 60 * 60 * 24 // 24h

interface GoogleFontItem {
  family: string
  variants: string[]
  subsets: string[]
  version: string
  lastModified: string
  files: Record<string, string>
  category: string
  kind: string
}

// interface GoogleFontsResponse {
//   kind: string
//   items: GoogleFontItem[]
// }

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json({ families: cache.data })
    }
    const key =
      process.env.GOOGLE_FONTS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY
    if (!key) {
      // No API key: return a small curated fallback list instead of erroring.
      // This keeps the frontend functional in local/dev without a Google key.
      const families = GOOGLE_FONTS_FALLBACK
      cache = { ts: Date.now(), data: families }
      return NextResponse.json({ families })
    }
    const res = await fetch(
      `https://www.googleapis.com/webfonts/v1/webfonts?key=${key}&sort=popularity`
    )
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('Google Fonts API error', res.status, text)
      return NextResponse.json({ error: 'API_ERROR' }, { status: 502 })
    }
    const data = await res.json()
    const families = Array.isArray(data.items)
      ? data.items.map((i: GoogleFontItem) => ({
          family: i.family,
          variants: i.variants || [],
        }))
      : []
    cache = { ts: Date.now(), data: families }
    return NextResponse.json({ families })
  } catch (e) {
    console.error('Error proxying Google Fonts', e)
    return NextResponse.json({ error: 'ERROR' }, { status: 500 })
  }
}
