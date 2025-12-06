import { Invoice } from '@/core/domain/invoice/entities/invoice.entity'
import { InvoiceStatus } from '@/core/domain/invoice/value-objects/invoice-status.vo'
import { Money } from '@/core/domain/invoice/value-objects/money.vo'
import { describe, expect, it } from 'vitest'

describe('Invoice Entity', () => {
  describe('Creation', () => {
    it('should create an invoice successfully', () => {
      const invoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
        discount: new Money(100),
        tax: new Money(50),
      })

      expect(invoice.id).toBeDefined()
      expect(invoice.number).toBe('INV-001')
      expect(invoice.status).toBe(InvoiceStatus.DRAFT)
    })

    it('should calculate total correctly (subtotal - discount + tax)', () => {
      const invoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
        discount: new Money(100),
        tax: new Money(50),
      })

      // Total = 1000 - 100 + 50 = 950
      expect(invoice.total.amount).toBe(950)
    })

    it('should throw error if dueDate is before issueDate', () => {
      expect(() =>
        Invoice.create({
          orgId: '223e4567-e89b-12d3-a456-426614174000',
          clientId: '323e4567-e89b-12d3-a456-426614174000',
          number: 'INV-001',
          issueDate: new Date('2025-02-01'),
          dueDate: new Date('2025-01-01'),
          subtotal: new Money(1000),
        })
      ).toThrow()
    })

    it('should accept optional fields', () => {
      const invoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
      })

      expect(invoice.notes).toBeNull()
      expect(invoice.paidAt).toBeNull()
    })

    it('should set optional fields when provided', () => {
      const invoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
        notes: 'Test invoice',
        internalNotes: 'Internal note',
      })

      expect(invoice.notes).toBe('Test invoice')
      expect(invoice.internalNotes).toBe('Internal note')
    })
  })

  describe('Status Management', () => {
    it('should allow transition from DRAFT to OPEN', () => {
      const invoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
      })

      invoice.open()

      expect(invoice.status).toBe(InvoiceStatus.OPEN)
    })

    it('should mark invoice as paid', () => {
      const invoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
      })

      invoice.markAsPaid()

      expect(invoice.status).toBe(InvoiceStatus.PAID)
      expect(invoice.paidAt).toBeInstanceOf(Date)
    })

    it('should cancel a draft invoice', () => {
      const invoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
      })

      invoice.cancel()

      expect(invoice.status).toBe(InvoiceStatus.VOID)
      expect(invoice.cancelledAt).toBeInstanceOf(Date)
    })

    it('should check overdue status correctly', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const invoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: pastDate,
        subtotal: new Money(1000),
      })

      invoice.open()
      expect(invoice.isOverdue()).toBe(true)
    })

    it('should not be overdue if paid', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const invoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: pastDate,
        subtotal: new Money(1000),
      })

      invoice.markAsPaid()
      expect(invoice.isOverdue()).toBe(false)
    })
  })

  describe('Modifications', () => {
    it('should update notes', () => {
      const invoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
      })

      invoice.updateNotes('Test note')

      expect(invoice.notes).toBe('Test note')
    })

    it('should update values', () => {
      const invoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
        discount: new Money(100),
        tax: new Money(50),
      })

      invoice.updateValues({ subtotal: new Money(2000) })

      expect(invoice.subtotal.amount).toBe(2000)
      // Total should be recalculated: 2000 - 100 + 50 = 1950
      expect(invoice.total.amount).toBe(1950)
    })
  })

  describe('Money Calculations', () => {
    it('should handle zero discount', () => {
      const invoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
        discount: new Money(0),
        tax: new Money(100),
      })

      // Total = 1000 - 0 + 100 = 1100
      expect(invoice.total.amount).toBe(1100)
    })

    it('should handle percentage-based calculations', () => {
      const subtotal = new Money(1000)
      const discount = subtotal.percentage(10) // 100
      const tax = subtotal.percentage(5) // 50

      const invoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal,
        discount,
        tax,
      })

      // Total = 1000 - 100 + 50 = 950
      expect(invoice.total.amount).toBe(950)
    })
  })

  describe('Getters', () => {
    it('should access all invoice properties', () => {
      const invoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
        discount: new Money(100),
        tax: new Money(50),
      })

      expect(invoice.id).toBeDefined()
      expect(invoice.orgId).toBeDefined()
      expect(invoice.clientId).toBeDefined()
      expect(invoice.number).toBeDefined()
      expect(invoice.status).toBeDefined()
      expect(invoice.issueDate).toBeDefined()
      expect(invoice.dueDate).toBeDefined()
      expect(invoice.subtotal).toBeDefined()
      expect(invoice.discount).toBeDefined()
      expect(invoice.tax).toBeDefined()
      expect(invoice.total).toBeDefined()
      expect(invoice.createdAt).toBeDefined()
      expect(invoice.updatedAt).toBeDefined()
    })

    it('should return null for optional properties when not set', () => {
      const invoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
      })

      expect(invoice.notes).toBeNull()
      expect(invoice.paidAt).toBeNull()
      expect(invoice.cancelledAt).toBeNull()
    })
  })

  describe('State Validation', () => {
    it('should validate can be edited', () => {
      const invoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
      })

      expect(invoice.canBeEdited()).toBe(true)
    })

    it('should not be editable if paid', () => {
      const invoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
      })

      invoice.markAsPaid()

      expect(invoice.canBeEdited()).toBe(false)
    })

    it('should not be editable if cancelled', () => {
      const invoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
      })

      invoice.cancel()

      expect(invoice.canBeEdited()).toBe(false)
    })
  })

  describe('Full Lifecycle', () => {
    it('should handle complete invoice lifecycle', () => {
      const invoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
        discount: new Money(100),
        tax: new Money(50),
      })

      expect(invoice.status).toBe(InvoiceStatus.DRAFT)

      invoice.open()
      expect(invoice.status).toBe(InvoiceStatus.OPEN)
      expect(invoice.canBeEdited()).toBe(true)

      invoice.markAsPaid()
      expect(invoice.status).toBe(InvoiceStatus.PAID)
      expect(invoice.paidAt).toBeInstanceOf(Date)
      expect(invoice.canBeEdited()).toBe(false)
    })

    it('should allow cancellation before payment', () => {
      const invoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
      })

      invoice.open()
      invoice.cancel()

      expect(invoice.status).toBe(InvoiceStatus.VOID)
    })

    it('should prevent cancellation after payment', () => {
      const invoice = Invoice.create({
        orgId: '223e4567-e89b-12d3-a456-426614174000',
        clientId: '323e4567-e89b-12d3-a456-426614174000',
        number: 'INV-001',
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-02-01'),
        subtotal: new Money(1000),
      })

      invoice.markAsPaid()

      expect(() => invoice.cancel()).toThrow()
    })
  })
})
