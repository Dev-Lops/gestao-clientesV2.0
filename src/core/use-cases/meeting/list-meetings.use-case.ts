import { Meeting } from '@/domain/meeting/entities/meeting.entity'
import { IMeetingRepository } from '@/ports/repositories/meeting.repository.interface'

/**
 * Use Case: Listar reuniões da organização
 */
export interface ListMeetingsRequest {
  orgId: string
  page?: number
  limit?: number
  status?: string[]
  clientId?: string
}

export interface ListMeetingsResponse {
  meetings: Meeting[]
  total: number
  page: number
  limit: number
}

export class ListMeetingsUseCase {
  constructor(private readonly meetingRepository: IMeetingRepository) {}

  async execute(request: ListMeetingsRequest): Promise<ListMeetingsResponse> {
    const { meetings, total } = await this.meetingRepository.findByOrgId(
      request.orgId,
      {
        page: request.page,
        limit: request.limit,
        status: request.status,
        clientId: request.clientId,
      }
    )

    return {
      meetings,
      total,
      page: request.page ?? 1,
      limit: request.limit ?? 10,
    }
  }
}
