import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock Firebase Admin BEFORE importing the route to avoid env checks
vi.mock('@/lib/firebaseAdmin', () => ({
  adminAuth: { verifyIdToken: vi.fn() },
}))

vi.mock('@/services/auth/session', () => ({
  getSessionProfile: vi.fn(),
}))

import { GET } from '@/app/api/session/route'
import { getSessionProfile } from '@/services/auth/session'

const mockedGetSession = getSessionProfile as unknown as ReturnType<
  typeof vi.fn
>

describe('GET /api/session', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockedGetSession.mockResolvedValue({ user: null, orgId: null, role: null })
    const res = await GET()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })

  it('returns session when authenticated', async () => {
    mockedGetSession.mockResolvedValue({
      user: { id: 'u1', email: 'a@b.com', name: 'A' },
      orgId: 'org1',
      role: 'OWNER',
    })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      user: { id: 'u1', email: 'a@b.com', name: 'A' },
      orgId: 'org1',
      role: 'OWNER',
    })
  })
})
