// @ts-nocheck
import { PrismaClient } from '@prisma/client'
import { IAnalyticsMetricRepository } from '@/core/ports/repositories/analytics-metric.repository.interface'
import { AnalyticsMetric } from '@/core/domain/analytics/entities/analytics-metric.entity'
import {
  MetricType,
  TimeRangeType,
} from '@/core/domain/analytics/value-objects/analytics-metric.vo'

const prisma = new PrismaClient()

export class PrismaAnalyticsMetricRepository
  implements IAnalyticsMetricRepository
{
  async save(metric: AnalyticsMetric): Promise<AnalyticsMetric> {
    const exists = await prisma.analyticsMetric.findUnique({
      where: { id: metric.id },
    })

    if (exists) {
      const updated = await prisma.analyticsMetric.update({
        where: { id: metric.id },
        data: {
          name: metric.name,
          value: metric.value,
          trend: metric.trend,
          trendPercentage: metric.trendPercentage,
          previousValue: metric.previousValue,
          tags: metric.tags,
          description: metric.description,
          updatedAt: metric.updatedAt,
          updatedBy: metric.updatedBy,
        },
      })

      return this.toDomain(updated)
    }

    const created = await prisma.analyticsMetric.create({
      data: {
        id: metric.id,
        orgId: metric.orgId,
        name: metric.name,
        metricType: metric.metricType,
        value: metric.value,
        unit: metric.unit,
        trend: metric.trend,
        trendPercentage: metric.trendPercentage,
        previousValue: metric.previousValue,
        timeRange: metric.timeRange,
        startDate: metric.startDate,
        endDate: metric.endDate,
        source: metric.source,
        tags: metric.tags,
        description: metric.description,
        createdAt: metric.createdAt,
        updatedAt: metric.updatedAt,
        createdBy: metric.createdBy,
        updatedBy: metric.updatedBy,
      },
    })

    return this.toDomain(created)
  }

  async findById(id: string, orgId: string): Promise<AnalyticsMetric | null> {
    const record = await prisma.analyticsMetric.findUnique({
      where: { id_orgId: { id, orgId } },
    })

    return record ? this.toDomain(record) : null
  }

  async findByOrgId(
    orgId: string,
    options?: {
      page?: number
      limit?: number
      offset?: number
      filters?: {
        metricType?: string
        startDate?: Date
        endDate?: Date
        source?: string
      }
    }
  ): Promise<{ items: AnalyticsMetric[]; total: number }> {
    const page = options?.page || 1
    const limit = options?.limit || 10
    const offset = options?.offset || (page - 1) * limit

    const where: any = { orgId }

    if (options?.filters?.metricType) {
      where.metricType = options.filters.metricType
    }

    if (options?.filters?.startDate) {
      where.startDate = { gte: options.filters.startDate }
    }

    if (options?.filters?.endDate) {
      where.endDate = { lte: options.filters.endDate }
    }

    if (options?.filters?.source) {
      where.source = options.filters.source
    }

    const [items, total] = await Promise.all([
      prisma.analyticsMetric.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.analyticsMetric.count({ where }),
    ])

    return {
      items: items.map((item) => this.toDomain(item)),
      total,
    }
  }

  async findByMetricType(
    orgId: string,
    metricType: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ items: AnalyticsMetric[]; total: number }> {
    const page = options?.page || 1
    const limit = options?.limit || 10
    const offset = (page - 1) * limit

    const [items, total] = await Promise.all([
      prisma.analyticsMetric.findMany({
        where: { orgId, metricType },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.analyticsMetric.count({ where: { orgId, metricType } }),
    ])

    return {
      items: items.map((item) => this.toDomain(item)),
      total,
    }
  }

  async findByDateRange(
    orgId: string,
    startDate: Date,
    endDate: Date,
    options?: { page?: number; limit?: number }
  ): Promise<{ items: AnalyticsMetric[]; total: number }> {
    const page = options?.page || 1
    const limit = options?.limit || 10
    const offset = (page - 1) * limit

    const [items, total] = await Promise.all([
      prisma.analyticsMetric.findMany({
        where: {
          orgId,
          startDate: { gte: startDate },
          endDate: { lte: endDate },
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.analyticsMetric.count({
        where: {
          orgId,
          startDate: { gte: startDate },
          endDate: { lte: endDate },
        },
      }),
    ])

    return {
      items: items.map((item) => this.toDomain(item)),
      total,
    }
  }

  async findBySource(
    orgId: string,
    source: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ items: AnalyticsMetric[]; total: number }> {
    const page = options?.page || 1
    const limit = options?.limit || 10
    const offset = (page - 1) * limit

    const [items, total] = await Promise.all([
      prisma.analyticsMetric.findMany({
        where: { orgId, source },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.analyticsMetric.count({ where: { orgId, source } }),
    ])

    return {
      items: items.map((item) => this.toDomain(item)),
      total,
    }
  }

  async exists(id: string, orgId: string): Promise<boolean> {
    const count = await prisma.analyticsMetric.count({
      where: { id, orgId },
    })
    return count > 0
  }

  async delete(id: string, orgId: string): Promise<void> {
    await prisma.analyticsMetric.delete({
      where: { id_orgId: { id, orgId } },
    })
  }

  private toDomain(record: any): AnalyticsMetric {
    return AnalyticsMetric.restore({
      id: record.id,
      orgId: record.orgId,
      name: record.name,
      metricType: record.metricType as MetricType,
      value: record.value,
      unit: record.unit,
      trend: record.trend,
      trendPercentage: record.trendPercentage,
      previousValue: record.previousValue,
      timeRange: record.timeRange as TimeRangeType,
      startDate: record.startDate,
      endDate: record.endDate,
      source: record.source,
      tags: record.tags || [],
      description: record.description,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
    })
  }
}
// @ts-nocheck
