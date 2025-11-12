import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Converte uma string de data no formato YYYY-MM-DD para um objeto Date
 * ajustado para o timezone local, evitando problemas de diferença de dias.
 *
 * @param dateString - Data no formato YYYY-MM-DD (do input type="date")
 * @returns Date object com a data correta no timezone local
 */
export function parseDateInput(dateString: string): Date {
  if (!dateString) return new Date()

  // Separa ano, mês e dia da string
  const [year, month, day] = dateString.split('-').map(Number)

  // Cria a data no timezone local (mês é 0-indexed no JS)
  return new Date(year, month - 1, day)
}

/**
 * Converte um objeto Date para string no formato YYYY-MM-DD
 * usado em inputs type="date", mantendo a data local correta.
 *
 * @param date - Objeto Date ou string de data
 * @returns String no formato YYYY-MM-DD
 */
export function formatDateInput(
  date: Date | string | null | undefined
): string {
  if (!date) return ''

  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
