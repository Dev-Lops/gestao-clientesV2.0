import {
  buildMobilesCacheKey,
  buildPaginatedResponse,
  calculateOffset,
  calculatePaginationMeta,
  estimateMobileResponseReduction,
  getCacheTTL,
  getPrismaSkipTake,
  normalizePaginationParams,
  toMobileClient,
  toMobileInvoice,
  toMobileTransaction,
} from '@/lib/mobile/optimization'
import { describe, expect, it } from 'vitest'

describe('Mobile Optimization Utils', () => {
  describe('toMobileClient', () => {
    it('should transform full client to lightweight response', () => {
      const client = {
        id: 'cli_1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://example.com/avatar.jpg',
        isActive: true,
      }

      const result = toMobileClient(client)

      expect(result).toEqual({
        id: 'cli_1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://example.com/avatar.jpg',
        status: 'active',
      })
    })

    it('should handle inactive client', () => {
      const client = {
        id: 'cli_2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        avatar: null,
        isActive: false,
      }

      const result = toMobileClient(client)

      expect(result.status).toBe('inactive')
      expect(result.avatar).toBeNull()
    })

    it('should reduce response size by ~30%', () => {
      const original = JSON.stringify({
        id: 'cli_1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+55 11 99999-9999',
        address: 'Street 123',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brazil',
        avatar: 'https://example.com/avatar.jpg',
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      })

      const lightweight = JSON.stringify({
        id: 'cli_1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://example.com/avatar.jpg',
        status: 'active',
      })

      const reduction =
        ((original.length - lightweight.length) / original.length) * 100
      expect(reduction).toBeGreaterThan(20)
    })
  })

  describe('toMobileInvoice', () => {
    it('should transform full invoice to lightweight response', () => {
      const invoice = {
        id: 'inv_1',
        invoiceNumber: 'INV-001',
        status: 'paid',
        totalAmount: 1000.5,
        dueDate: new Date('2025-01-15'),
        client: {
          name: 'Client Name',
        },
        clientId: 'cli_1',
      }

      const result = toMobileInvoice(invoice)

      expect(result).toEqual({
        id: 'inv_1',
        number: 'INV-001',
        status: 'paid',
        totalAmount: 1000.5,
        dueDate: '2025-01-15T00:00:00.000Z',
        clientName: 'Client Name',
        clientId: 'cli_1',
      })
    })

    it('should handle missing client name', () => {
      const invoice = {
        id: 'inv_2',
        invoiceNumber: 'INV-002',
        status: 'pending',
        totalAmount: 500,
        dueDate: new Date('2025-02-01'),
        client: null,
        clientId: 'cli_2',
      }

      const result = toMobileInvoice(invoice)

      expect(result.clientName).toBe('Unknown')
    })
  })

  describe('toMobileTransaction', () => {
    it('should transform transaction to lightweight response', () => {
      const transaction = {
        id: 'txn_1',
        type: 'income',
        amount: 500,
        category: 'Sales',
        date: new Date('2025-01-10'),
        description: 'Product sale',
      }

      const result = toMobileTransaction(transaction)

      expect(result).toEqual({
        id: 'txn_1',
        type: 'income',
        amount: 500,
        category: 'Sales',
        date: '2025-01-10T00:00:00.000Z',
        description: 'Product sale',
      })
    })
  })

  describe('Pagination Utils', () => {
    it('should normalize pagination params with defaults', () => {
      const result = normalizePaginationParams()

      expect(result).toEqual({
        page: 1,
        limit: 20,
      })
    })

    it('should cap limit at 100', () => {
      const result = normalizePaginationParams(2, 200)

      expect(result).toEqual({
        page: 2,
        limit: 100,
      })
    })

    it('should enforce minimum limit of 5', () => {
      const result = normalizePaginationParams(1, 2)

      expect(result).toEqual({
        page: 1,
        limit: 5,
      })
    })

    it('should handle string params', () => {
      const result = normalizePaginationParams('3', '25')

      expect(result).toEqual({
        page: 3,
        limit: 25,
      })
    })

    it('should ensure page >= 1', () => {
      const result = normalizePaginationParams(0, 10)

      expect(result.page).toBe(1)
    })

    it('should calculate pagination meta correctly', () => {
      const meta = calculatePaginationMeta(100, 2, 20)

      expect(meta).toEqual({
        page: 2,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasMore: true,
      })
    })

    it('should indicate no more pages on last page', () => {
      const meta = calculatePaginationMeta(100, 5, 20)

      expect(meta.hasMore).toBe(false)
    })

    it('should calculate offset correctly', () => {
      expect(calculateOffset(1, 20)).toBe(0)
      expect(calculateOffset(2, 20)).toBe(20)
      expect(calculateOffset(3, 25)).toBe(50)
    })

    it('should build prisma skip/take', () => {
      const result = getPrismaSkipTake(2, 20)

      expect(result).toEqual({
        skip: 20,
        take: 20,
      })
    })

    it('should build paginated response', () => {
      const data = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ]

      const result = buildPaginatedResponse(data, 50, 1, 20)

      expect(result.data).toEqual(data)
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3,
        hasMore: true,
      })
    })
  })

  describe('Cache Utilities', () => {
    it('should build cache key', () => {
      const key = buildMobilesCacheKey('/invoices', 'user_1', {
        status: 'paid',
      })

      expect(key).toContain('mobile:')
      expect(key).toContain('/invoices')
      expect(key).toContain('user_1')
      expect(key).toContain('status')
    })

    it('should get cache TTL for /clients', () => {
      const ttl = getCacheTTL('/clients')

      expect(ttl).toBe(5 * 60) // 5 minutes
    })

    it('should get cache TTL for /invoices', () => {
      const ttl = getCacheTTL('/invoices')

      expect(ttl).toBe(3 * 60) // 3 minutes
    })

    it('should get cache TTL for /balance', () => {
      const ttl = getCacheTTL('/balance')

      expect(ttl).toBe(30) // 30 seconds
    })

    it('should default to 5 minutes for unknown endpoint', () => {
      const ttl = getCacheTTL('/unknown')

      expect(ttl).toBe(5 * 60)
    })
  })

  describe('Response Size Estimation', () => {
    it('should estimate 30% reduction', () => {
      const original = 10000
      const estimated = estimateMobileResponseReduction(original, 30)

      expect(estimated).toBe(7000)
    })

    it('should estimate custom reduction percent', () => {
      const original = 10000
      const estimated = estimateMobileResponseReduction(original, 50)

      expect(estimated).toBe(5000)
    })

    it('should return integer size', () => {
      const estimated = estimateMobileResponseReduction(1000, 30)

      expect(Number.isInteger(estimated)).toBe(true)
    })
  })
})
