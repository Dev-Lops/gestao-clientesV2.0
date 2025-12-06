import { prisma } from '@/lib/prisma'
import { getApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Feature flag para dual-write
const DUAL_WRITE = process.env.DUAL_WRITE?.toLowerCase() === 'true'

export type ClientCreateInput = {
  orgId: string
  name: string
  email?: string | null
  phone?: string | null
}

export async function createClient(input: ClientCreateInput) {
  // Postgres (fonte de verdade objetiva)
  const client = await prisma.client.create({
    data: { ...input, email: input.email ?? '' },
  })

  if (DUAL_WRITE) {
    try {
      const firestore = getFirestore(getApp())
      await firestore
        .collection('orgs')
        .doc(input.orgId)
        .collection('clients')
        .doc(client.id)
        .set({
          id: client.id,
          name: client.name,
          email: client.email ?? null,
          phone: client.phone ?? null,
          createdAt: client.createdAt.toISOString(),
          updatedAt: client.updatedAt.toISOString(),
          status: client.status,
        })
    } catch (err) {
      // Registro de erro, mas não quebra a criação no Postgres
      console.error('[dual-write:client:create] falhou no Firestore', err)
    }
  }

  return client
}
