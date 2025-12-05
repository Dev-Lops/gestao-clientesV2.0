/**
 * Teste Unitário - Task Entity
 */

import {
  TaskPriority,
  TaskStatus,
} from '@/domain/task/value-objects/task-type.vo'
import { Task } from '@/domain/task/entities/task.entity'
import { describe, expect, it } from 'vitest'

describe('Task Entity', () => {
  describe('create', () => {
    it('deve criar uma tarefa com sucesso', () => {
      const task = Task.create({
        title: 'Revisar contrato',
        orgId: 'org-123',
        priority: TaskPriority.HIGH,
        description: 'Revisar contrato com cliente',
        clientId: 'client-456',
      })

      expect(task).toBeDefined()
      expect(task.title).toBe('Revisar contrato')
      expect(task.status).toBe(TaskStatus.TODO)
      expect(task.priority).toBe(TaskPriority.HIGH)
    })

    it('deve lançar erro para título vazio', () => {
      expect(() => {
        Task.create({
          title: '',
          orgId: 'org-123',
          priority: TaskPriority.MEDIUM,
        })
      }).toThrow()
    })

    it('deve lançar erro para título com apenas espaços', () => {
      expect(() => {
        Task.create({
          title: '   ',
          orgId: 'org-123',
          priority: TaskPriority.MEDIUM,
        })
      }).toThrow()
    })
  })

  describe('startProgress', () => {
    it('deve mover tarefa para "Em Progresso"', () => {
      const task = Task.create({
        title: 'Revisar contrato',
        orgId: 'org-123',
        priority: TaskPriority.HIGH,
      })

      task.startProgress()

      expect(task.status).toBe(TaskStatus.IN_PROGRESS)
    })

    it('deve lançar erro ao tentar iniciar tarefa cancelada', () => {
      const task = Task.create({
        title: 'Revisar contrato',
        orgId: 'org-123',
        priority: TaskPriority.HIGH,
      })

      task.cancel()

      expect(() => task.startProgress()).toThrow()
    })

    it('deve lançar erro ao tentar reabrir tarefa concluída', () => {
      const task = Task.create({
        title: 'Revisar contrato',
        orgId: 'org-123',
        priority: TaskPriority.HIGH,
      })

      task.complete()

      expect(() => task.startProgress()).toThrow()
    })
  })

  describe('moveToReview', () => {
    it('deve mover tarefa para "Em Revisão"', () => {
      const task = Task.create({
        title: 'Revisar contrato',
        orgId: 'org-123',
        priority: TaskPriority.HIGH,
      })

      task.startProgress()
      task.moveToReview()

      expect(task.status).toBe(TaskStatus.REVIEW)
    })
  })

  describe('complete', () => {
    it('deve marcar tarefa como concluída', () => {
      const task = Task.create({
        title: 'Revisar contrato',
        orgId: 'org-123',
        priority: TaskPriority.HIGH,
      })

      task.startProgress()
      task.moveToReview()
      task.complete()

      expect(task.status).toBe(TaskStatus.DONE)
    })

    it('deve lançar erro ao completar tarefa cancelada', () => {
      const task = Task.create({
        title: 'Revisar contrato',
        orgId: 'org-123',
        priority: TaskPriority.HIGH,
      })

      task.cancel()

      expect(() => task.complete()).toThrow()
    })
  })

  describe('cancel', () => {
    it('deve cancelar uma tarefa', () => {
      const task = Task.create({
        title: 'Revisar contrato',
        orgId: 'org-123',
        priority: TaskPriority.HIGH,
      })

      task.cancel()

      expect(task.status).toBe(TaskStatus.CANCELLED)
    })

    it('deve lançar erro ao cancelar tarefa concluída', () => {
      const task = Task.create({
        title: 'Revisar contrato',
        orgId: 'org-123',
        priority: TaskPriority.HIGH,
      })

      task.complete()

      expect(() => task.cancel()).toThrow()
    })
  })

  describe('updatePriority', () => {
    it('deve atualizar prioridade de uma tarefa', () => {
      const task = Task.create({
        title: 'Revisar contrato',
        orgId: 'org-123',
        priority: TaskPriority.LOW,
      })

      task.updatePriority(TaskPriority.URGENT)

      expect(task.priority).toBe(TaskPriority.URGENT)
    })

    it('deve lançar erro ao atualizar prioridade de tarefa concluída', () => {
      const task = Task.create({
        title: 'Revisar contrato',
        orgId: 'org-123',
        priority: TaskPriority.LOW,
      })

      task.complete()

      expect(() => task.updatePriority(TaskPriority.HIGH)).toThrow()
    })
  })

  describe('isOverdue', () => {
    it('deve retornar true para tarefa com data passada', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const task = Task.create({
        title: 'Revisar contrato',
        orgId: 'org-123',
        priority: TaskPriority.HIGH,
        dueDate: pastDate,
      })

      expect(task.isOverdue()).toBe(true)
    })

    it('deve retornar false para tarefa com data futura', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      const task = Task.create({
        title: 'Revisar contrato',
        orgId: 'org-123',
        priority: TaskPriority.HIGH,
        dueDate: futureDate,
      })

      expect(task.isOverdue()).toBe(false)
    })

    it('deve retornar false para tarefa concluída mesmo se atrasada', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const task = Task.create({
        title: 'Revisar contrato',
        orgId: 'org-123',
        priority: TaskPriority.HIGH,
        dueDate: pastDate,
      })

      task.complete()

      expect(task.isOverdue()).toBe(false)
    })
  })

  describe('getProgress', () => {
    it('deve retornar 0 para tarefa em TODO', () => {
      const task = Task.create({
        title: 'Revisar contrato',
        orgId: 'org-123',
        priority: TaskPriority.HIGH,
      })

      expect(task.getProgress()).toBe(0)
    })

    it('deve retornar 50 para tarefa em IN_PROGRESS', () => {
      const task = Task.create({
        title: 'Revisar contrato',
        orgId: 'org-123',
        priority: TaskPriority.HIGH,
      })

      task.startProgress()

      expect(task.getProgress()).toBe(50)
    })

    it('deve retornar 100 para tarefa concluída', () => {
      const task = Task.create({
        title: 'Revisar contrato',
        orgId: 'org-123',
        priority: TaskPriority.HIGH,
      })

      task.complete()

      expect(task.getProgress()).toBe(100)
    })
  })
})
