/**
 * Teste Unitário - Transaction Entity
 */

import {
  TransactionStatus,
  TransactionSubtype,
  TransactionType,
} from '@/domain/transaction/value-objects/transaction-type.vo'
import { Money } from '@/domain/invoice/value-objects/money.vo'
import { Transaction } from '@/domain/transaction/entities/transaction.entity'
import { describe, expect, it } from 'vitest'

describe('Transaction Entity', () => {
  describe('create', () => {
    it('deve criar uma transação com sucesso', () => {
      const transaction = Transaction.create({
        type: TransactionType.INCOME,
        subtype: TransactionSubtype.OTHER_INCOME,
        amount: new Money(1000),
        orgId: 'org-123',
        date: new Date(),
        description: 'Venda de produto',
      })

      expect(transaction).toBeDefined()
      expect(transaction.type).toBe(TransactionType.INCOME)
      expect(transaction.status).toBe(TransactionStatus.PENDING)
      expect(transaction.amount.toNumber()).toBe(1000)
    })

    it('deve lançar erro para valor negativo', () => {
      expect(() => {
        Transaction.create({
          type: TransactionType.INCOME,
          subtype: TransactionSubtype.OTHER_INCOME,
          amount: new Money(-100),
          orgId: 'org-123',
          date: new Date(),
        })
      }).toThrow()
    })

    it('deve lançar erro para valor zero', () => {
      expect(() => {
        Transaction.create({
          type: TransactionType.INCOME,
          subtype: TransactionSubtype.OTHER_INCOME,
          amount: new Money(0),
          orgId: 'org-123',
          date: new Date(),
        })
      }).toThrow()
    })
  })

  describe('confirm', () => {
    it('deve confirmar uma transação pendente', () => {
      const transaction = Transaction.create({
        type: TransactionType.INCOME,
        subtype: TransactionSubtype.OTHER_INCOME,
        amount: new Money(1000),
        orgId: 'org-123',
        date: new Date(),
      })

      transaction.confirm()

      expect(transaction.status).toBe(TransactionStatus.CONFIRMED)
    })

    it('deve lançar erro ao confirmar transação já confirmada', () => {
      const transaction = Transaction.create({
        type: TransactionType.INCOME,
        subtype: TransactionSubtype.OTHER_INCOME,
        amount: new Money(1000),
        orgId: 'org-123',
        date: new Date(),
      })

      transaction.confirm()

      expect(() => transaction.confirm()).toThrow()
    })

    it('deve lançar erro ao confirmar transação cancelada', () => {
      const transaction = Transaction.create({
        type: TransactionType.INCOME,
        subtype: TransactionSubtype.OTHER_INCOME,
        amount: new Money(1000),
        orgId: 'org-123',
        date: new Date(),
      })

      transaction.cancel()

      expect(() => transaction.confirm()).toThrow()
    })
  })

  describe('cancel', () => {
    it('deve cancelar uma transação pendente', () => {
      const transaction = Transaction.create({
        type: TransactionType.INCOME,
        subtype: TransactionSubtype.OTHER_INCOME,
        amount: new Money(1000),
        orgId: 'org-123',
        date: new Date(),
      })

      transaction.cancel()

      expect(transaction.status).toBe(TransactionStatus.CANCELLED)
    })

    it('deve lançar erro ao cancelar transação confirmada', () => {
      const transaction = Transaction.create({
        type: TransactionType.INCOME,
        subtype: TransactionSubtype.OTHER_INCOME,
        amount: new Money(1000),
        orgId: 'org-123',
        date: new Date(),
      })

      transaction.confirm()

      expect(() => transaction.cancel()).toThrow()
    })
  })

  describe('calculateBalance', () => {
    it('deve calcular saldo de receitas e despesas', () => {
      const income = Transaction.create({
        type: TransactionType.INCOME,
        subtype: TransactionSubtype.OTHER_INCOME,
        amount: new Money(1000),
        orgId: 'org-123',
        date: new Date(),
      })

      const expense = Transaction.create({
        type: TransactionType.EXPENSE,
        subtype: TransactionSubtype.FIXED_EXPENSE,
        amount: new Money(300),
        orgId: 'org-123',
        date: new Date(),
      })

      const balance = Transaction.calculateBalance([income, expense])

      expect(balance.toNumber()).toBe(700)
    })

    it('deve retornar zero para lista vazia', () => {
      const balance = Transaction.calculateBalance([])

      expect(balance.toNumber()).toBe(0)
    })

    it('deve ignorar transações deletadas', () => {
      const income = Transaction.create({
        type: TransactionType.INCOME,
        subtype: TransactionSubtype.OTHER_INCOME,
        amount: new Money(1000),
        orgId: 'org-123',
        date: new Date(),
      })

      income.softDelete()

      const balance = Transaction.calculateBalance([income])

      expect(balance.toNumber()).toBe(0)
    })
  })
})
