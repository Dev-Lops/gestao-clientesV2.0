import { Meeting } from '@/domain/meeting/entities/meeting.entity'
import { IMeetingRepository } from '@/ports/repositories/meeting.repository.interface'

/**
 * Use Case: Atualizar uma reunião
 */
export interface UpdateMeetingRequest {
  id: string
  title?: string
  description?: string
  clientId?: string
  participantIds?: string[]
  location?: string
  notes?: string
  updatedBy: string
}

export class UpdateMeetingUseCase {
  constructor(private readonly meetingRepository: IMeetingRepository) {}

  async execute(request: UpdateMeetingRequest): Promise<Meeting> {
    const meeting = await this.meetingRepository.findById(request.id)
    if (!meeting) {
      throw new Error('Reunião não encontrada')
    }

    const updated = Meeting.restore({
      ...meeting,
      title: request.title ?? meeting.title,
      description:
        request.description !== undefined
          ? request.description
          : meeting.description,
      clientId:
        request.clientId !== undefined ? request.clientId : meeting.clientId,
      participantIds: request.participantIds ?? meeting.participantIds,
      location:
        request.location !== undefined ? request.location : meeting.location,
      notes: request.notes !== undefined ? request.notes : meeting.notes,
      updatedAt: new Date(),
      updatedBy: request.updatedBy,
    })

    await this.meetingRepository.save(updated)
    return updated
  }
}
