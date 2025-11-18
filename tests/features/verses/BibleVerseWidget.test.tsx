import { BibleVerseWidget } from '@/features/verses/BibleVerseWidget'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

describe('BibleVerseWidget', () => {
  it('renders loading skeleton then verse', async () => {
    const mockVerse = {
      id: 123,
      text: 'Porque Deus amou o mundo de tal maneira...'
    }
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: mockVerse.id,
          text: mockVerse.text,
          book_name: 'João',
          chapter: 3,
          verse: 16,
          translation_id: 'almeida',
          translation_name: 'João Ferreira de Almeida'
        })
      } as Response)
    })

    render(<BibleVerseWidget />)

    // Skeleton present
    expect(screen.getByLabelText('Widget Versículo do Dia')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByLabelText('Texto do versículo')).toBeInTheDocument()
    })

    expect(screen.getByText(/João 3:16/)).toBeInTheDocument()
    fetchSpy.mockRestore()
  })
})
