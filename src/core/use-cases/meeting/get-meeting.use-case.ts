import { Meeting } from '@/domain/meeting/entities/meeting.entity'
import { IMeetingRepository } from '@/ports/repositories/meeting.repository.interface'

/**
 * Use Case: Obter uma reunião por ID
 */
export class GetMeetingUseCase {
  constructor(private readonly meetingRepository: IMeetingRepository) {}

  async execute(id: string): Promise<Meeting | null> {
    return this.meetingRepository.findById(id)
  }
}
