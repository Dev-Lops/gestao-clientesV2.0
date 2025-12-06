export interface IGetAnalyticsMetricRequest {
  id: string
  orgId: string
}

export interface IGetAnalyticsMetricResponse {
  success: boolean
  data?: {
    id: string
    name: string
    metricType: string
    value: number
    unit: string
    trend: string
    trendPercentage: number
    previousValue?: number
    timeRange: string
    startDate: string
    endDate: string
    source: string
    tags: string[]
    description?: string
    createdAt: string
    updatedAt: string
  }
  error?: string
}

import { IAnalyticsMetricRepository } from '../../ports/repositories/analytics-metric.repository.interface'

export class GetAnalyticsMetricUseCase {
  constructor(private repository: IAnalyticsMetricRepository) {}

  async execute(
    request: IGetAnalyticsMetricRequest
  ): Promise<IGetAnalyticsMetricResponse> {
    try {
      const metric = await this.repository.findById(request.id, request.orgId)

      if (!metric) {
        return {
          success: false,
          error: 'Métrica não encontrada',
        }
      }

      return {
        success: true,
        data: {
          id: metric.id,
          name: metric.name,
          metricType: metric.metricType,
          value: metric.value,
          unit: metric.unit,
          trend: metric.trend,
          trendPercentage: metric.trendPercentage,
          previousValue: metric.previousValue,
          timeRange: metric.timeRange,
          startDate: metric.startDate.toISOString(),
          endDate: metric.endDate.toISOString(),
          source: metric.source,
          tags: metric.tags,
          description: metric.description,
          createdAt: metric.createdAt.toISOString(),
          updatedAt: metric.updatedAt.toISOString(),
        },
      }
    } catch (error) {
      return {
        success: false,
        error: `Erro ao buscar métrica: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      }
    }
  }
}
