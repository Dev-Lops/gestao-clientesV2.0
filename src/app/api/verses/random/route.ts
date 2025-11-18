import { adaptVerse } from '@/features/verses/lib/verse-utils'
import { getServerEnv } from '@/lib/env'
import {
  checkRateLimit,
  getIdentifier,
  publicRatelimit,
  rateLimitExceeded,
} from '@/lib/ratelimit'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Rate limiting para endpoints públicos
    const identifier = getIdentifier(request)
    const rateLimitResult = await checkRateLimit(identifier, publicRatelimit)

    if (!rateLimitResult.success) {
      return rateLimitExceeded(rateLimitResult.reset)
    }

    const env = getServerEnv()
    const url = new URL(request.url)
    const translationParam = url.searchParams.get('translation') || 'almeida'

    // If custom API base configured try its random endpoint first for sequential nav support
    if (env?.BIBLE_API_BASE) {
      const base = env.BIBLE_API_BASE.replace(/\/$/, '')
      const randomEndpoint = `${base}/verses/random?translation=${translationParam}`
      try {
        const res = await fetch(randomEndpoint, {
          headers: env.BIBLE_API_TOKEN
            ? { Authorization: `Bearer ${env.BIBLE_API_TOKEN}` }
            : undefined,
          cache: 'no-store',
        })
        if (res.ok) {
          const data = await res.json()
          return NextResponse.json(adaptVerse(data))
        }
      } catch {
        // fall through to deterministic daily fallback
      }
    }

    // Verso aleatório em Português usando bible-api.com
    // Tradução: Almeida (única em português disponível)
    // Documentação: https://bible-api.com/

    // Gera um versículo "aleatório" baseado no dia (determinístico)
    const books = [
      { book: 'john', chapter: 3, verse: 16 },
      { book: 'psalm', chapter: 23, verse: 1 },
      { book: 'romans', chapter: 8, verse: 28 },
      { book: 'philippians', chapter: 4, verse: 13 },
      { book: 'jeremiah', chapter: 29, verse: 11 },
      { book: 'matthew', chapter: 11, verse: 28 },
      { book: 'isaiah', chapter: 41, verse: 10 },
      { book: 'proverbs', chapter: 3, verse: 5 },
    ]

    const now = new Date()
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    )
    const selected = books[dayOfYear % books.length]

    const verseUrl = `https://bible-api.com/${selected.book}+${selected.chapter}:${selected.verse}?translation=${translationParam}`
    const res = await fetch(verseUrl, { cache: 'no-store' })

    if (!res.ok) {
      const fallback = {
        id: 0,
        text: 'Não foi possível carregar o versículo agora. Tente novamente em alguns minutos.',
        book: { id: 0, name: 'Verso indisponível' },
        chapter: 0,
        verse: 0,
        translationId: 'almeida',
        translationName: 'João Ferreira de Almeida',
      }
      return NextResponse.json(fallback)
    }

    const raw = await res.json()
    const verses = raw?.verses || []
    const firstVerse = verses[0] || {}

    const adapted = adaptVerse({
      id: 0,
      text: raw?.text,
      book_name: firstVerse?.book_name || raw?.reference?.split(' ')[0],
      chapter: firstVerse?.chapter,
      verse: firstVerse?.verse,
      translation_id: raw?.translation_id || translationParam,
      translation_name: raw?.translation_name || 'João Ferreira de Almeida',
    })
    return NextResponse.json(adapted)
  } catch {
    const fallback = {
      id: 0,
      text: 'Não foi possível carregar o versículo agora. Verifique sua conexão e tente novamente.',
      book: { id: 0, name: 'Verso indisponível' },
      chapter: 0,
      verse: 0,
      translationId: 'almeida',
      translationName: 'João Ferreira de Almeida',
    }
    return NextResponse.json(adaptVerse(fallback))
  }
}
