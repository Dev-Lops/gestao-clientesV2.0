export function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDateBR(date: Date | string | number) {
  const d =
    typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR')
}
