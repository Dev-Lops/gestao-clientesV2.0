import { headers } from 'next/headers'

/**
 * Recupera o nonce da requisição atual.
 * Deve ser chamado apenas em Server Components.
 * @returns O nonce único desta requisição ou undefined
 */
export async function getNonce(): Promise<string | undefined> {
  const headersList = await headers()
  return headersList.get('x-nonce') || undefined
}
