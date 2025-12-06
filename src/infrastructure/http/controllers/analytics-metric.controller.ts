import { IAnalyticsMetricRepository } from '@/core/ports/repositories/analytics-metric.repository.interface'
import {
  CreateAnalyticsMetricUseCase,
  ICreateAnalyticsMetricRequest,
  ICreateAnalyticsMetricResponse,
} from '@/core/use-cases/analytics/create-analytics-metric.use-case'
import {
  DeleteAnalyticsMetricUseCase,
  IDeleteAnalyticsMetricRequest,
  IDeleteAnalyticsMetricResponse,
} from '@/core/use-cases/analytics/delete-analytics-metric.use-case'
import {
  GetAnalyticsMetricUseCase,
  IGetAnalyticsMetricRequest,
  IGetAnalyticsMetricResponse,
} from '@/core/use-cases/analytics/get-analytics-metric.use-case'
import {
  IListAnalyticsMetricsRequest,
  IListAnalyticsMetricsResponse,
  ListAnalyticsMetricsUseCase,
} from '@/core/use-cases/analytics/list-analytics-metrics.use-case'
import {
  IUpdateAnalyticsMetricRequest,
  IUpdateAnalyticsMetricResponse,
  UpdateAnalyticsMetricUseCase,
} from '@/core/use-cases/analytics/update-analytics-metric.use-case'

export class AnalyticsMetricController {
  private createUseCase: CreateAnalyticsMetricUseCase
  private listUseCase: ListAnalyticsMetricsUseCase
  private getUseCase: GetAnalyticsMetricUseCase
  private updateUseCase: UpdateAnalyticsMetricUseCase
  private deleteUseCase: DeleteAnalyticsMetricUseCase

  constructor(repository: IAnalyticsMetricRepository) {
    this.createUseCase = new CreateAnalyticsMetricUseCase(repository)
    this.listUseCase = new ListAnalyticsMetricsUseCase(repository)
    this.getUseCase = new GetAnalyticsMetricUseCase(repository)
    this.updateUseCase = new UpdateAnalyticsMetricUseCase(repository)
    this.deleteUseCase = new DeleteAnalyticsMetricUseCase(repository)
  }

  async create(
    request: ICreateAnalyticsMetricRequest
  ): Promise<ICreateAnalyticsMetricResponse> {
    return this.createUseCase.execute(request)
  }

  async list(
    request: IListAnalyticsMetricsRequest
  ): Promise<IListAnalyticsMetricsResponse> {
    return this.listUseCase.execute(request)
  }

  async get(
    request: IGetAnalyticsMetricRequest
  ): Promise<IGetAnalyticsMetricResponse> {
    return this.getUseCase.execute(request)
  }

  async update(
    request: IUpdateAnalyticsMetricRequest
  ): Promise<IUpdateAnalyticsMetricResponse> {
    return this.updateUseCase.execute(request)
  }

  async delete(
    request: IDeleteAnalyticsMetricRequest
  ): Promise<IDeleteAnalyticsMetricResponse> {
    return this.deleteUseCase.execute(request)
  }
}
