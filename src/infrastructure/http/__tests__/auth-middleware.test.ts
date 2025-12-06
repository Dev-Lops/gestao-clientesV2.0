/**
 * Testes unitários para middleware de autenticação
 */

import { checkRateLimit } from '@/lib/ratelimit'
import { getSessionProfile } from '@/services/auth/session'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  authenticateOwner,
  authenticateRequest,
  authenticateStaff,
} from '../middlewares/auth.middleware'

// Mock das dependências
vi.mock('@/services/auth/session')
vi.mock('@/lib/ratelimit')

describe('auth-middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('authenticateRequest', () => {
    it('deve retornar erro 429 quando rate limit excedido', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue({
        success: false,
        reset: new Date(),
      } as any)

      const req = new Request('http://localhost/api/test')
      const result = await authenticateRequest(req)

      expect('error' in result).toBe(true)
      if ('error' in result) {
        const json = await result.error.json()
        expect(result.error.status).toBe(429)
        expect(json.code).toBe('RATE_LIMIT_EXCEEDED')
      }
    })

    it('deve retornar erro 401 quando sessão inválida', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as any)
      vi.mocked(getSessionProfile).mockResolvedValue(null as any)

      const req = new Request('http://localhost/api/test')
      const result = await authenticateRequest(req)

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error.status).toBe(401)
      }
    })

    it('deve retornar erro 403 quando papel não autorizado', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as any)
      vi.mocked(getSessionProfile).mockResolvedValue({
        user: { id: 'user1', email: 'test@test.com' },
        orgId: 'org1',
        role: 'STAFF',
      } as any)

      const req = new Request('http://localhost/api/test')
      const result = await authenticateRequest(req, {
        allowedRoles: ['OWNER'],
      })

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error.status).toBe(403)
      }
    })

    it('deve retornar contexto quando autenticado com sucesso', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as any)
      vi.mocked(getSessionProfile).mockResolvedValue({
        user: { id: 'user1', email: 'test@test.com' },
        orgId: 'org1',
        role: 'OWNER',
      } as any)

      const req = new Request('http://localhost/api/test')
      const result = await authenticateRequest(req)

      expect('context' in result).toBe(true)
      if ('context' in result) {
        expect(result.context.userId).toBe('user1')
        expect(result.context.orgId).toBe('org1')
        expect(result.context.role).toBe('OWNER')
      }
    })
  })

  describe('authenticateOwner', () => {
    it('deve aceitar apenas OWNER', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as any)
      vi.mocked(getSessionProfile).mockResolvedValue({
        user: { id: 'user1', email: 'test@test.com' },
        orgId: 'org1',
        role: 'OWNER',
      } as any)

      const req = new Request('http://localhost/api/test')
      const result = await authenticateOwner(req)

      expect('context' in result).toBe(true)
    })

    it('deve rejeitar STAFF', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as any)
      vi.mocked(getSessionProfile).mockResolvedValue({
        user: { id: 'user1', email: 'test@test.com' },
        orgId: 'org1',
        role: 'STAFF',
      } as any)

      const req = new Request('http://localhost/api/test')
      const result = await authenticateOwner(req)

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error.status).toBe(403)
      }
    })
  })

  describe('authenticateStaff', () => {
    it('deve aceitar OWNER e STAFF', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue({ success: true } as any)

      // Teste com STAFF
      vi.mocked(getSessionProfile).mockResolvedValue({
        user: { id: 'user1', email: 'test@test.com' },
        orgId: 'org1',
        role: 'STAFF',
      } as any)

      const req = new Request('http://localhost/api/test')
      const result = await authenticateStaff(req)

      expect('context' in result).toBe(true)
    })
  })
})
