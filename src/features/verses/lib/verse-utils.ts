export interface UnifiedVerse {
  id: number
  text: string
  book: { id: number; name: string }
  chapter: number
  verse: number
  translationId?: string
  translationName?: string
}

type RawVerse = {
  id?: number
  text?: string
  verse?: { text?: string }
  book?: { name?: string; name_pt?: string }
  book_name?: string
  reference?: string
  chapter?: number | { number?: number }
  chapterNumber?: number
  number?: number
  verseNumber?: number
  translationId?: string
  translation_id?: string
  translationName?: string
  translation_name?: string
}

export function adaptVerse(input: unknown): UnifiedVerse {
  const v = (input || {}) as RawVerse
  const bookName =
    v.book?.name ||
    v.book_name ||
    v.book?.name_pt ||
    (typeof v.reference === 'string' ? v.reference.split(' ')[0] : undefined) ||
    'Bíblia'
  const chapter =
    (typeof v.chapter === 'number' ? v.chapter : v.chapter?.number) ??
    v.chapterNumber ??
    0
  const verseNumber = v.verse ?? v.number ?? v.verseNumber ?? 0
  const text = (v.text || v.verse?.text || '').toString().trim()
  const translationId = v.translationId || v.translation_id
  const translationName = v.translationName || v.translation_name
  const id = typeof v.id === 'number' ? v.id : 0
  return {
    id,
    text,
    book: { id: 0, name: bookName },
    chapter: Number.isFinite(chapter) ? Number(chapter) : 0,
    verse: Number.isFinite(verseNumber) ? Number(verseNumber) : 0,
    translationId,
    translationName,
  }
}

export async function fetchUnified(
  url: string,
  init?: RequestInit
): Promise<UnifiedVerse> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || 'Falha ao carregar versículo')
  }
  const data = await res.json()
  return adaptVerse(data)
}
