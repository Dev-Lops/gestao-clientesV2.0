import {
  MeetingStatus,
  MeetingType,
  isValidMeetingStatus,
  isValidMeetingType,
} from '../value-objects/meeting-status.vo'

/**
 * Meeting Entity
 * Representa uma reunião com cliente, parceiro ou interno
 *
 * Regras de Negócio:
 * - Reunião agendada não pode ser no passado
 * - Reunião em progresso precisa ter horário de início
 * - Reunião concluída precisa ter horário de fim
 * - Duração deve ser sempre positiva
 * - Participantes devem ser um array não vazio
 */

export interface MeetingProps {
  id: string
  title: string
  description?: string | null
  type: MeetingType
  status: MeetingStatus
  clientId?: string | null
  participantIds: string[]
  startDate: Date
  endDate: Date
  location?: string | null
  notes?: string | null
  orgId: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  createdBy?: string | null
  updatedBy?: string | null
  deletedBy?: string | null
}

export class Meeting {
  readonly id: string
  readonly title: string
  readonly description: string | null
  readonly type: MeetingType
  readonly status: MeetingStatus
  readonly clientId: string | null
  readonly participantIds: string[]
  readonly startDate: Date
  readonly endDate: Date
  readonly location: string | null
  readonly notes: string | null
  readonly orgId: string
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly deletedAt: Date | null
  readonly createdBy: string | null
  readonly updatedBy: string | null
  readonly deletedBy: string | null

  private constructor(props: MeetingProps) {
    this.id = props.id
    this.title = props.title
    this.description = props.description ?? null
    this.type = props.type
    this.status = props.status
    this.clientId = props.clientId ?? null
    this.participantIds = props.participantIds
    this.startDate = props.startDate
    this.endDate = props.endDate
    this.location = props.location ?? null
    this.notes = props.notes ?? null
    this.orgId = props.orgId
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
    this.deletedAt = props.deletedAt ?? null
    this.createdBy = props.createdBy ?? null
    this.updatedBy = props.updatedBy ?? null
    this.deletedBy = props.deletedBy ?? null
  }

  /**
   * Cria uma nova reunião
   */
  static create(
    props: Omit<
      MeetingProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'updatedBy'
      | 'deletedBy'
    >
  ): Meeting {
    // Validações
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('Título da reunião é obrigatório')
    }

    if (!isValidMeetingStatus(props.status)) {
      throw new Error('Status da reunião inválido')
    }

    if (!isValidMeetingType(props.type)) {
      throw new Error('Tipo de reunião inválido')
    }

    if (props.participantIds.length === 0) {
      throw new Error('Reunião deve ter pelo menos um participante')
    }

    if (props.endDate <= props.startDate) {
      throw new Error('Data de fim deve ser posterior à data de início')
    }

    const now = new Date()
    if (props.startDate < now && props.status === MeetingStatus.SCHEDULED) {
      throw new Error('Não é possível agendar reunião no passado')
    }

    return new Meeting({
      id: crypto.randomUUID(),
      title: props.title,
      description: props.description,
      type: props.type,
      status: props.status,
      clientId: props.clientId,
      participantIds: props.participantIds,
      startDate: props.startDate,
      endDate: props.endDate,
      location: props.location,
      notes: props.notes,
      orgId: props.orgId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: props.createdBy ?? null,
      updatedBy: null,
      deletedBy: null,
    })
  }

  /**
   * Restaura uma reunião existente (do banco de dados)
   */
  static restore(props: MeetingProps): Meeting {
    return new Meeting(props)
  }

  /**
   * Marca reunião como em progresso
   */
  startMeeting(): Meeting {
    if (
      this.status === MeetingStatus.COMPLETED ||
      this.status === MeetingStatus.CANCELLED
    ) {
      throw new Error(
        'Não é possível iniciar reunião já finalizada ou cancelada'
      )
    }

    return Meeting.restore({
      ...this,
      status: MeetingStatus.IN_PROGRESS,
      updatedAt: new Date(),
    })
  }

  /**
   * Marca reunião como concluída
   */
  completeMeeting(): Meeting {
    if (this.status === MeetingStatus.CANCELLED) {
      throw new Error('Não é possível concluir reunião cancelada')
    }

    return Meeting.restore({
      ...this,
      status: MeetingStatus.COMPLETED,
      updatedAt: new Date(),
    })
  }

  /**
   * Cancela reunião
   */
  cancel(): Meeting {
    if (this.status === MeetingStatus.COMPLETED) {
      throw new Error('Não é possível cancelar reunião já concluída')
    }

    return Meeting.restore({
      ...this,
      status: MeetingStatus.CANCELLED,
      updatedAt: new Date(),
    })
  }

  /**
   * Reagenda reunião
   */
  reschedule(newStartDate: Date, newEndDate: Date): Meeting {
    if (
      this.status === MeetingStatus.COMPLETED ||
      this.status === MeetingStatus.CANCELLED
    ) {
      throw new Error(
        'Não é possível reagendar reunião finalizada ou cancelada'
      )
    }

    if (newEndDate <= newStartDate) {
      throw new Error('Data de fim deve ser posterior à data de início')
    }

    return Meeting.restore({
      ...this,
      startDate: newStartDate,
      endDate: newEndDate,
      status: MeetingStatus.RESCHEDULED,
      updatedAt: new Date(),
    })
  }

  /**
   * Adiciona participante
   */
  addParticipant(participantId: string): Meeting {
    if (this.participantIds.includes(participantId)) {
      throw new Error('Participante já adicionado')
    }

    return Meeting.restore({
      ...this,
      participantIds: [...this.participantIds, participantId],
      updatedAt: new Date(),
    })
  }

  /**
   * Remove participante
   */
  removeParticipant(participantId: string): Meeting {
    if (this.participantIds.length === 1) {
      throw new Error('Reunião deve ter pelo menos um participante')
    }

    return Meeting.restore({
      ...this,
      participantIds: this.participantIds.filter((id) => id !== participantId),
      updatedAt: new Date(),
    })
  }

  /**
   * Calcula duração em minutos
   */
  getDurationMinutes(): number {
    return Math.floor(
      (this.endDate.getTime() - this.startDate.getTime()) / 60000
    )
  }

  /**
   * Verifica se reunião está em atraso
   */
  isOverdue(): boolean {
    return this.status !== MeetingStatus.COMPLETED && new Date() > this.endDate
  }

  /**
   * Verifica se reunião está agendada para o futuro
   */
  isFuture(): boolean {
    return this.startDate > new Date()
  }
}
