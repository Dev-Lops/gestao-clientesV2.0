import { prisma } from '@/lib/prisma'
import { getApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const DUAL_WRITE = process.env.DUAL_WRITE?.toLowerCase() === 'true'

export type MediaCreateInput = {
  orgId: string
  clientId: string
  title: string
  description?: string | null
  type: string
  mimeType?: string | null
  fileKey?: string | null
  fileSize?: number | null
  url?: string | null
  thumbUrl?: string | null
  tags?: string[]
}

export async function createMedia(input: MediaCreateInput) {
  const media = await prisma.media.create({
    data: { ...input, tags: input.tags ?? [] },
  })

  if (DUAL_WRITE) {
    try {
      const firestore = getFirestore(getApp())
      await firestore
        .collection('orgs')
        .doc(input.orgId)
        .collection('clients')
        .doc(input.clientId)
        .collection('media')
        .doc(media.id)
        .set({
          id: media.id,
          title: media.title,
          description: media.description ?? null,
          type: media.type,
          mimeType: media.mimeType ?? null,
          fileKey: media.fileKey ?? null,
          fileSize: media.fileSize ?? null,
          url: media.url ?? null,
          thumbUrl: media.thumbUrl ?? null,
          tags: media.tags,
          createdAt: media.createdAt.toISOString(),
          updatedAt: media.updatedAt.toISOString(),
        })
    } catch (err) {
      console.error('[dual-write:media:create] falhou no Firestore', err)
    }
  }

  return media
}
