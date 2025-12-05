import { Meeting } from '@/domain/meeting/entities/meeting.entity'
import { IMeetingRepository } from '@/ports/repositories/meeting.repository.interface'

/**
 * Use Case: Deletar uma reunião (soft delete)
 */
export class DeleteMeetingUseCase {
  constructor(private readonly meetingRepository: IMeetingRepository) {}

  async execute(id: string, deletedBy: string): Promise<void> {
    const meeting = await this.meetingRepository.findById(id)
    if (!meeting) {
      throw new Error('Reunião não encontrada')
    }

    const deleted = Meeting.restore({
      ...meeting,
      deletedAt: new Date(),
      deletedBy,
    })

    await this.meetingRepository.save(deleted)
  }
}
