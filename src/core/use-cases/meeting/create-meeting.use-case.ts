import { Meeting } from '@/domain/meeting/entities/meeting.entity'
import {
  MeetingStatus,
  MeetingType,
} from '@/domain/meeting/value-objects/meeting-status.vo'
import { IMeetingRepository } from '@/ports/repositories/meeting.repository.interface'

/**
 * Use Case: Criar uma nova reunião
 */
export interface CreateMeetingRequest {
  title: string
  description?: string
  type: MeetingType
  clientId?: string
  participantIds: string[]
  startDate: Date
  endDate: Date
  location?: string
  notes?: string
  orgId: string
  createdBy: string
}

export class CreateMeetingUseCase {
  constructor(private readonly meetingRepository: IMeetingRepository) {}

  async execute(request: CreateMeetingRequest): Promise<Meeting> {
    const meeting = Meeting.create({
      title: request.title,
      description: request.description,
      type: request.type,
      status: MeetingStatus.SCHEDULED,
      clientId: request.clientId,
      participantIds: request.participantIds,
      startDate: request.startDate,
      endDate: request.endDate,
      location: request.location,
      notes: request.notes,
      orgId: request.orgId,
      createdBy: request.createdBy,
    })

    await this.meetingRepository.save(meeting)
    return meeting
  }
}
