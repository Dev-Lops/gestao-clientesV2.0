/**
 * Teste Unitário - Meeting Entity
 */

import { Meeting } from '@/domain/meeting/entities/meeting.entity'
import {
  MeetingStatus,
  MeetingType,
} from '@/domain/meeting/value-objects/meeting-status.vo'
import { describe, expect, it } from 'vitest'

describe('Meeting Entity', () => {
  describe('criar', () => {
    it('deve criar uma reunião com sucesso', () => {
      const startDate = new Date(Date.now() + 86400000) // amanhã
      const endDate = new Date(startDate.getTime() + 3600000) // 1 hora depois

      const meeting = Meeting.create({
        title: 'Reunião com cliente',
        description: 'Discussão sobre novo projeto',
        type: MeetingType.PRESENCIAL,
        status: MeetingStatus.SCHEDULED,
        participantIds: ['user-1', 'user-2'],
        startDate,
        endDate,
        orgId: 'org-123',
        clientId: 'client-1',
      })

      expect(meeting).toBeDefined()
      expect(meeting.title).toBe('Reunião com cliente')
      expect(meeting.type).toBe(MeetingType.PRESENCIAL)
      expect(meeting.status).toBe(MeetingStatus.SCHEDULED)
      expect(meeting.participantIds).toHaveLength(2)
    })

    it('deve lançar erro se título estiver vazio', () => {
      const startDate = new Date(Date.now() + 86400000)
      const endDate = new Date(startDate.getTime() + 3600000)

      expect(() => {
        Meeting.create({
          title: '',
          type: MeetingType.VIRTUAL,
          status: MeetingStatus.SCHEDULED,
          participantIds: ['user-1'],
          startDate,
          endDate,
          orgId: 'org-123',
        })
      }).toThrow('Título da reunião é obrigatório')
    })

    it('deve lançar erro se não houver participantes', () => {
      const startDate = new Date(Date.now() + 86400000)
      const endDate = new Date(startDate.getTime() + 3600000)

      expect(() => {
        Meeting.create({
          title: 'Reunião',
          type: MeetingType.HIBRIDO,
          status: MeetingStatus.SCHEDULED,
          participantIds: [],
          startDate,
          endDate,
          orgId: 'org-123',
        })
      }).toThrow('Reunião deve ter pelo menos um participante')
    })

    it('deve lançar erro se data de fim for anterior à de início', () => {
      const startDate = new Date()
      const endDate = new Date(startDate.getTime() - 3600000)

      expect(() => {
        Meeting.create({
          title: 'Reunião',
          type: MeetingType.VIRTUAL,
          status: MeetingStatus.SCHEDULED,
          participantIds: ['user-1'],
          startDate,
          endDate,
          orgId: 'org-123',
        })
      }).toThrow('Data de fim deve ser posterior à data de início')
    })

    it('deve lançar erro se agendar reunião no passado', () => {
      const startDate = new Date(Date.now() - 86400000) // ontem
      const endDate = new Date(startDate.getTime() + 3600000)

      expect(() => {
        Meeting.create({
          title: 'Reunião',
          type: MeetingType.PRESENCIAL,
          status: MeetingStatus.SCHEDULED,
          participantIds: ['user-1'],
          startDate,
          endDate,
          orgId: 'org-123',
        })
      }).toThrow('Não é possível agendar reunião no passado')
    })
  })

  describe('workflow de reunião', () => {
    let meeting: Meeting

    beforeEach(() => {
      const startDate = new Date(Date.now() + 86400000)
      const endDate = new Date(startDate.getTime() + 3600000)

      meeting = Meeting.create({
        title: 'Reunião',
        type: MeetingType.PRESENCIAL,
        status: MeetingStatus.SCHEDULED,
        participantIds: ['user-1'],
        startDate,
        endDate,
        orgId: 'org-123',
      })
    })

    it('deve iniciar reunião', () => {
      const started = meeting.startMeeting()
      expect(started.status).toBe(MeetingStatus.IN_PROGRESS)
    })

    it('deve concluir reunião', () => {
      const started = meeting.startMeeting()
      const completed = started.completeMeeting()
      expect(completed.status).toBe(MeetingStatus.COMPLETED)
    })

    it('deve cancelar reunião', () => {
      const cancelled = meeting.cancel()
      expect(cancelled.status).toBe(MeetingStatus.CANCELLED)
      expect(cancelled.deletedAt).toBeNull()
    })

    it('deve reagendar reunião', () => {
      const newStart = new Date(Date.now() + 172800000) // 2 dias depois
      const newEnd = new Date(newStart.getTime() + 3600000)

      const rescheduled = meeting.reschedule(newStart, newEnd)
      expect(rescheduled.status).toBe(MeetingStatus.RESCHEDULED)
      expect(rescheduled.startDate).toEqual(newStart)
      expect(rescheduled.endDate).toEqual(newEnd)
    })

    it('não deve concluir reunião cancelada', () => {
      const cancelled = meeting.cancel()
      expect(() => {
        cancelled.completeMeeting()
      }).toThrow('Não é possível concluir reunião cancelada')
    })
  })

  describe('participantes', () => {
    let meeting: Meeting

    beforeEach(() => {
      const startDate = new Date(Date.now() + 86400000)
      const endDate = new Date(startDate.getTime() + 3600000)

      meeting = Meeting.create({
        title: 'Reunião',
        type: MeetingType.VIRTUAL,
        status: MeetingStatus.SCHEDULED,
        participantIds: ['user-1', 'user-2'],
        startDate,
        endDate,
        orgId: 'org-123',
      })
    })

    it('deve adicionar participante', () => {
      const updated = meeting.addParticipant('user-3')
      expect(updated.participantIds).toHaveLength(3)
      expect(updated.participantIds).toContain('user-3')
    })

    it('deve lançar erro ao adicionar participante duplicado', () => {
      expect(() => {
        meeting.addParticipant('user-1')
      }).toThrow('Participante já adicionado')
    })

    it('deve remover participante', () => {
      const updated = meeting.removeParticipant('user-2')
      expect(updated.participantIds).toHaveLength(1)
      expect(updated.participantIds).toContain('user-1')
    })

    it('deve lançar erro ao remover último participante', () => {
      const updated = meeting.removeParticipant('user-2')
      expect(() => {
        updated.removeParticipant('user-1')
      }).toThrow('Reunião deve ter pelo menos um participante')
    })
  })

  describe('utilitários', () => {
    it('deve calcular duração em minutos', () => {
      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + 90 * 60000) // 90 minutos

      const meeting = Meeting.create({
        title: 'Reunião',
        type: MeetingType.HIBRIDO,
        status: MeetingStatus.SCHEDULED,
        participantIds: ['user-1'],
        startDate,
        endDate,
        orgId: 'org-123',
      })

      expect(meeting.getDurationMinutes()).toBe(90)
    })

    it('deve verificar se reunião está em atraso', () => {
      const startDate = new Date(Date.now() - 2 * 3600000) // 2 horas atrás
      const endDate = new Date(Date.now() - 3600000) // 1 hora atrás

      const meeting = Meeting.create({
        title: 'Reunião',
        type: MeetingType.PRESENCIAL,
        status: MeetingStatus.SCHEDULED,
        participantIds: ['user-1'],
        startDate,
        endDate,
        orgId: 'org-123',
      })

      // Criar um novo meeting com data no passado para testar (bypass da validação de agendamento)
      const pastMeeting = Meeting.restore({
        ...meeting,
        startDate,
        endDate,
      })

      expect(pastMeeting.isOverdue()).toBe(true)
    })

    it('deve verificar se reunião é no futuro', () => {
      const startDate = new Date(Date.now() + 86400000)
      const endDate = new Date(startDate.getTime() + 3600000)

      const meeting = Meeting.create({
        title: 'Reunião',
        type: MeetingType.VIRTUAL,
        status: MeetingStatus.SCHEDULED,
        participantIds: ['user-1'],
        startDate,
        endDate,
        orgId: 'org-123',
      })

      expect(meeting.isFuture()).toBe(true)
    })
  })
})
