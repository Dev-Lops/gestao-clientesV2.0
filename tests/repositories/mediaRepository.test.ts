import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      media: {
        create: vi.fn(async ({ data }: any) => ({
          id: 'm1',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      },
    },
  }
})

vi.mock('firebase-admin/app', () => ({ getApp: () => ({}) }))
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: () => ({
      doc: () => ({
        collection: () => ({
          doc: () => ({ set: vi.fn(async () => {}) }),
        }),
        set: vi.fn(async () => {}),
      }),
    }),
  }),
}))

import { createMedia } from '@/lib/repositories/mediaRepository'

describe('mediaRepository.createMedia', () => {
  beforeEach(() => {
    // Evita dual-write no teste por padrão
    // @ts-ignore
    process.env.DUAL_WRITE = 'false'
  })

  it('creates media in prisma and returns entity', async () => {
    const media = await createMedia({
      orgId: 'org1',
      clientId: 'client1',
      title: 'Arquivo',
      type: 'image',
      mimeType: 'image/jpeg',
      fileKey: 'clients/client1/file.jpg',
      fileSize: 1234,
      url: 'https://example.com/optimized',
      thumbUrl: 'https://example.com/thumb',
      tags: [],
    })
    expect(media.id).toBe('m1')
    expect(media.orgId).toBe('org1')
    expect(media.clientId).toBe('client1')
  })
})
