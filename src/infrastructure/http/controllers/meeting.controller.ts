import { Meeting } from '@/domain/meeting/entities/meeting.entity'
import { IMeetingRepository } from '@/ports/repositories/meeting.repository.interface'
import {
  CreateMeetingRequest,
  CreateMeetingUseCase,
} from '@/use-cases/meeting/create-meeting.use-case'
import { DeleteMeetingUseCase } from '@/use-cases/meeting/delete-meeting.use-case'
import { GetMeetingUseCase } from '@/use-cases/meeting/get-meeting.use-case'
import {
  ListMeetingsRequest,
  ListMeetingsResponse,
  ListMeetingsUseCase,
} from '@/use-cases/meeting/list-meetings.use-case'
import {
  UpdateMeetingRequest,
  UpdateMeetingUseCase,
} from '@/use-cases/meeting/update-meeting.use-case'

/**
 * Controller HTTP para Meeting
 * Orquestra as requisições HTTP e delega para os Use Cases
 */
export class MeetingController {
  private readonly createUseCase: CreateMeetingUseCase
  private readonly listUseCase: ListMeetingsUseCase
  private readonly getUseCase: GetMeetingUseCase
  private readonly updateUseCase: UpdateMeetingUseCase
  private readonly deleteUseCase: DeleteMeetingUseCase

  constructor(meetingRepository: IMeetingRepository) {
    this.createUseCase = new CreateMeetingUseCase(meetingRepository)
    this.listUseCase = new ListMeetingsUseCase(meetingRepository)
    this.getUseCase = new GetMeetingUseCase(meetingRepository)
    this.updateUseCase = new UpdateMeetingUseCase(meetingRepository)
    this.deleteUseCase = new DeleteMeetingUseCase(meetingRepository)
  }

  async create(request: CreateMeetingRequest): Promise<Meeting> {
    return this.createUseCase.execute(request)
  }

  async list(request: ListMeetingsRequest): Promise<ListMeetingsResponse> {
    return this.listUseCase.execute(request)
  }

  async get(id: string): Promise<Meeting | null> {
    return this.getUseCase.execute(id)
  }

  async update(request: UpdateMeetingRequest): Promise<Meeting> {
    return this.updateUseCase.execute(request)
  }

  async delete(id: string, deletedBy: string): Promise<void> {
    return this.deleteUseCase.execute(id, deletedBy)
  }
}
