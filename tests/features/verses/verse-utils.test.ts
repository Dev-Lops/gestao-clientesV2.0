import { adaptVerse } from '@/features/verses/lib/verse-utils'
import { describe, expect, it } from 'vitest'

describe('adaptVerse', () => {
  it('adapts minimal verse', () => {
    const v = adaptVerse({
      text: 'Test',
      book_name: 'Genesis',
      chapter: 1,
      verse: 1,
    })
    expect(v.text).toBe('Test')
    expect(v.book.name).toBe('Genesis')
    expect(v.chapter).toBe(1)
    expect(v.verse).toBe(1)
  })

  it('handles nested chapter object', () => {
    const v = adaptVerse({
      text: 'Nested',
      book: { name: 'Exodus' },
      chapter: { number: 3 },
      verseNumber: 5,
    })
    expect(v.book.name).toBe('Exodus')
    expect(v.chapter).toBe(3)
    expect(v.verse).toBe(5)
  })

  it('prefers translation fields', () => {
    const v = adaptVerse({
      text: 'T',
      book_name: 'Ruth',
      chapter: 2,
      number: 7,
      translation_id: 'nvi',
      translation_name: 'Nova Versão Internacional',
    })
    expect(v.translationId).toBe('nvi')
    expect(v.translationName).toMatch(/Nova Versão/)
  })
})
