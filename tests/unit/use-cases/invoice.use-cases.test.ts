import { Invoice } from '@/core/domain/invoice/entities/invoice.entity'
import { Money } from '@/core/domain/invoice/value-objects/money.vo'
import { CancelInvoiceUseCase } from '@/core/use-cases/invoice/cancel-invoice.use-case'
import { CreateInvoiceUseCase } from '@/core/use-cases/invoice/create-invoice.use-case'
import { ListInvoicesUseCase } from '@/core/use-cases/invoice/list-invoices.use-case'
import { PayInvoiceUseCase } from '@/core/use-cases/invoice/pay-invoice.use-case'
import { IInvoiceRepository } from '@/ports/repositories/invoice.repository.interface'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock Repository
const mockRepository: Partial<IInvoiceRepository> = {
  save: vi.fn(),
  findById: vi.fn(),
  findByOrgId: vi.fn(),
  findByNumber: vi.fn(),
  findByClientId: vi.fn(),
  update: vi.fn(),
  list: vi.fn(),
}

describe('Invoice Use Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('CreateInvoiceUseCase', () => {
    it('should create a new invoice', async () => {
      const useCase = new CreateInvoiceUseCase(
        mockRepository as IInvoiceRepository
      )

      const input = {
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: 1000,
        discount: 100,
        tax: 50,
        notes: 'Test invoice',
      }

      vi.mocked(mockRepository.findByNumber).mockResolvedValue(null)

      const result = await useCase.execute(input)

      expect(result.invoiceId).toBeDefined()
      expect(mockRepository.save).toHaveBeenCalled()
    })

    it('should validate input data', async () => {
      const useCase = new CreateInvoiceUseCase(
        mockRepository as IInvoiceRepository
      )

      const invalidInput = {
        orgId: 'invalid-id',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-02-01'),
        dueDate: new Date('2025-01-01'), // Invalid: after issueDate
        subtotal: 1000,
      }

      await expect(useCase.execute(invalidInput as any)).rejects.toThrow()
    })

    it('should accept optional discount and tax', async () => {
      const useCase = new CreateInvoiceUseCase(
        mockRepository as IInvoiceRepository
      )

      const input = {
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-002',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: 500,
      }

      vi.mocked(mockRepository.findByNumber).mockResolvedValue(null)

      const result = await useCase.execute(input)

      expect(result.invoiceId).toBeDefined()
    })
  })

  describe('ListInvoicesUseCase', () => {
    it('should list invoices with pagination', async () => {
      const mockInvoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
      })

      vi.mocked(mockRepository.findByOrgId).mockResolvedValue({
        invoices: [mockInvoice],
        total: 1,
      })

      const useCase = new ListInvoicesUseCase(
        mockRepository as IInvoiceRepository
      )

      const result = await useCase.execute({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        page: 1,
        limit: 10,
      })

      expect(result.invoices).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('should filter invoices by client', async () => {
      const mockInvoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(500),
      })

      vi.mocked(mockRepository.findByOrgId).mockResolvedValue({
        invoices: [mockInvoice],
        total: 1,
      })

      const useCase = new ListInvoicesUseCase(
        mockRepository as IInvoiceRepository
      )

      const result = await useCase.execute({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        page: 1,
        limit: 10,
      })

      expect(result.invoices).toHaveLength(1)
    })

    it('should return empty list when no invoices found', async () => {
      vi.mocked(mockRepository.findByOrgId).mockResolvedValue({
        invoices: [],
        total: 0,
      })

      const useCase = new ListInvoicesUseCase(
        mockRepository as IInvoiceRepository
      )

      const result = await useCase.execute({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        page: 1,
        limit: 10,
      })

      expect(result.invoices).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  describe('PayInvoiceUseCase', () => {
    it('should mark invoice as paid', async () => {
      const mockInvoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
      })

      // create a restored invoice with a valid id for zod validation
      const restored = Invoice.restore({
        id: '223e4567-e89b-12d3-a456-426614174111',
        orgId: mockInvoice.orgId,
        clientId: mockInvoice.clientId,
        number: mockInvoice.number,
        status: mockInvoice.status,
        issueDate: mockInvoice.issueDate,
        dueDate: mockInvoice.dueDate,
        subtotal: mockInvoice.subtotal,
        discount: mockInvoice.discount,
        tax: mockInvoice.tax,
        total: mockInvoice.total,
        notes: mockInvoice.notes ?? null,
        internalNotes: mockInvoice.internalNotes ?? null,
        paidAt: mockInvoice.paidAt ?? null,
        cancelledAt: mockInvoice.cancelledAt ?? null,
        createdAt: mockInvoice.createdAt,
        updatedAt: mockInvoice.updatedAt,
        deletedAt: mockInvoice.deletedAt ?? null,
        createdBy: mockInvoice.createdBy ?? null,
        updatedBy: mockInvoice.updatedBy ?? null,
      })

      vi.mocked(mockRepository.findById).mockResolvedValue(restored)
      vi.mocked(mockRepository.update).mockResolvedValue(undefined)

      const useCase = new PayInvoiceUseCase(
        mockRepository as IInvoiceRepository
      )

      const result = await useCase.execute({
        invoiceId: restored.id,
        orgId: '223e4567-e89b-12d3-a456-426614174000',
      })

      expect(result.paidAt).toBeDefined()
    })

    it('should throw error if invoice not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null)

      const useCase = new PayInvoiceUseCase(
        mockRepository as IInvoiceRepository
      )

      await expect(
        useCase.execute({
          invoiceId: '223e4567-e89b-12d3-a456-426614174999',
          orgId: '223e4567-e89b-12d3-a456-426614174000',
        })
      ).rejects.toThrow()
    })

    it('should validate org ownership', async () => {
      const mockInvoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
      })

      vi.mocked(mockRepository.findById).mockResolvedValue(mockInvoice)

      const useCase = new PayInvoiceUseCase(
        mockRepository as IInvoiceRepository
      )

      await expect(
        useCase.execute({
          invoiceId: mockInvoice.id,
          orgId: 'different-org-id',
        })
      ).rejects.toThrow()
    })
  })

  describe('CancelInvoiceUseCase', () => {
    it('should cancel an invoice', async () => {
      const mockInvoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
      })

      // restore with a valid id so zod uuid validation passes
      const restoredCancel = Invoice.restore({
        id: '223e4567-e89b-12d3-a456-426614174333',
        orgId: mockInvoice.orgId,
        clientId: mockInvoice.clientId,
        number: mockInvoice.number,
        status: mockInvoice.status,
        issueDate: mockInvoice.issueDate,
        dueDate: mockInvoice.dueDate,
        subtotal: mockInvoice.subtotal,
        discount: mockInvoice.discount,
        tax: mockInvoice.tax,
        total: mockInvoice.total,
        notes: mockInvoice.notes ?? null,
        internalNotes: mockInvoice.internalNotes ?? null,
        paidAt: mockInvoice.paidAt ?? null,
        cancelledAt: mockInvoice.cancelledAt ?? null,
        createdAt: mockInvoice.createdAt,
        updatedAt: mockInvoice.updatedAt,
        deletedAt: mockInvoice.deletedAt ?? null,
        createdBy: mockInvoice.createdBy ?? null,
        updatedBy: mockInvoice.updatedBy ?? null,
      })

      vi.mocked(mockRepository.findById).mockResolvedValue(restoredCancel)
      vi.mocked(mockRepository.update).mockResolvedValue(undefined)

      const useCase = new CancelInvoiceUseCase(
        mockRepository as IInvoiceRepository
      )

      const result = await useCase.execute({
        invoiceId: restoredCancel.id,
        orgId: '223e4567-e89b-12d3-a456-426614174000',
      })

      expect(result.invoiceId).toBe(restoredCancel.id)
    })

    it('should throw error if invoice not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null)

      const useCase = new CancelInvoiceUseCase(
        mockRepository as IInvoiceRepository
      )

      await expect(
        useCase.execute({
          invoiceId: '223e4567-e89b-12d3-a456-426614174999',
          orgId: '223e4567-e89b-12d3-a456-426614174000',
        })
      ).rejects.toThrow()
    })

    it('should throw error if trying to cancel paid invoice', async () => {
      const mockInvoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
      })

      mockInvoice.markAsPaid()

      const restoredPaid = Invoice.restore({
        id: '223e4567-e89b-12d3-a456-426614174444',
        orgId: mockInvoice.orgId,
        clientId: mockInvoice.clientId,
        number: mockInvoice.number,
        status: mockInvoice.status,
        issueDate: mockInvoice.issueDate,
        dueDate: mockInvoice.dueDate,
        subtotal: mockInvoice.subtotal,
        discount: mockInvoice.discount,
        tax: mockInvoice.tax,
        total: mockInvoice.total,
        notes: mockInvoice.notes ?? null,
        internalNotes: mockInvoice.internalNotes ?? null,
        paidAt: new Date(),
        cancelledAt: mockInvoice.cancelledAt ?? null,
        createdAt: mockInvoice.createdAt,
        updatedAt: mockInvoice.updatedAt,
        deletedAt: mockInvoice.deletedAt ?? null,
        createdBy: mockInvoice.createdBy ?? null,
        updatedBy: mockInvoice.updatedBy ?? null,
      })

      vi.mocked(mockRepository.findById).mockResolvedValue(restoredPaid)

      const useCase = new CancelInvoiceUseCase(
        mockRepository as IInvoiceRepository
      )

      await expect(
        useCase.execute({
          invoiceId: restoredPaid.id,
          orgId: '223e4567-e89b-12d3-a456-426614174000',
        })
      ).rejects.toThrow()
    })
  })
})
