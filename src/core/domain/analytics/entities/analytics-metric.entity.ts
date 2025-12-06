import { randomUUID } from 'crypto'
import {
  MetricType,
  TimeRangeType,
  isValidMetricType,
  isValidTimeRangeType,
} from '../value-objects/analytics-metric.vo'

export interface IAnalyticsMetric {
  id: string
  orgId: string
  name: string
  metricType: MetricType
  value: number
  unit: string
  trend: 'UP' | 'DOWN' | 'STABLE'
  trendPercentage: number
  previousValue?: number
  timeRange: TimeRangeType
  startDate: Date
  endDate: Date
  source: string
  tags?: string[]
  description?: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}

export class AnalyticsMetric {
  private readonly _id: string
  private readonly _orgId: string
  private _name: string
  private _metricType: MetricType
  private _value: number
  private _unit: string
  private _trend: 'UP' | 'DOWN' | 'STABLE'
  private _trendPercentage: number
  private _previousValue?: number
  private _timeRange: TimeRangeType
  private _startDate: Date
  private _endDate: Date
  private _source: string
  private _tags: string[]
  private _description?: string
  private _createdAt: Date
  private _updatedAt: Date
  private _createdBy: string
  private _updatedBy: string

  private constructor(props: IAnalyticsMetric) {
    this._id = props.id
    this._orgId = props.orgId
    this._name = props.name
    this._metricType = props.metricType
    this._value = props.value
    this._unit = props.unit
    this._trend = props.trend
    this._trendPercentage = props.trendPercentage
    this._previousValue = props.previousValue
    this._timeRange = props.timeRange
    this._startDate = props.startDate
    this._endDate = props.endDate
    this._source = props.source
    this._tags = props.tags || []
    this._description = props.description
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
    this._createdBy = props.createdBy
    this._updatedBy = props.updatedBy
  }

  public static create(
    props: Omit<IAnalyticsMetric, 'id' | 'createdAt' | 'updatedAt'>
  ): AnalyticsMetric {
    if (!props.name || props.name.trim() === '') {
      throw new Error('Nome da métrica é obrigatório')
    }

    if (!isValidMetricType(props.metricType)) {
      throw new Error('Tipo de métrica inválido')
    }

    if (!isValidTimeRangeType(props.timeRange)) {
      throw new Error('Período de tempo inválido')
    }

    if (props.value < 0) {
      throw new Error('Valor da métrica não pode ser negativo')
    }

    if (props.trendPercentage < -100 || props.trendPercentage > 100) {
      throw new Error('Percentual de tendência deve estar entre -100 e 100')
    }

    if (props.endDate < props.startDate) {
      throw new Error('Data final não pode ser anterior à data inicial')
    }

    if (!props.source || props.source.trim() === '') {
      throw new Error('Fonte da métrica é obrigatória')
    }

    return new AnalyticsMetric({
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...props,
    })
  }

  public static restore(props: IAnalyticsMetric): AnalyticsMetric {
    return new AnalyticsMetric(props)
  }

  public updateValue(
    newValue: number,
    previousValue: number,
    updatedBy: string
  ): void {
    if (newValue < 0) {
      throw new Error('Novo valor não pode ser negativo')
    }

    this._previousValue = previousValue
    this._value = newValue

    // Calcular tendência
    if (newValue > previousValue) {
      this._trend = 'UP'
    } else if (newValue < previousValue) {
      this._trend = 'DOWN'
    } else {
      this._trend = 'STABLE'
    }

    // Calcular percentual de tendência
    const difference = newValue - previousValue
    this._trendPercentage =
      previousValue === 0 ? 0 : (difference / previousValue) * 100

    this._updatedAt = new Date()
    this._updatedBy = updatedBy
  }

  public addTag(tag: string): void {
    if (!tag || tag.trim() === '') {
      throw new Error('Tag não pode ser vazia')
    }

    if (this._tags.includes(tag)) {
      throw new Error('Tag duplicada')
    }

    this._tags.push(tag)
    this._updatedAt = new Date()
  }

  public removeTag(tag: string): void {
    if (!this._tags.includes(tag)) {
      throw new Error('Tag não encontrada')
    }

    this._tags = this._tags.filter((t) => t !== tag)
    this._updatedAt = new Date()
  }

  public updateDescription(
    description: string | undefined,
    updatedBy: string
  ): void {
    this._description = description
    this._updatedAt = new Date()
    this._updatedBy = updatedBy
  }

  public calculateComparisonPercentage(otherValue: number): number {
    if (this._value === 0 && otherValue === 0) {
      return 0
    }
    if (otherValue === 0) {
      return this._value > 0 ? 100 : -100
    }
    return ((this._value - otherValue) / otherValue) * 100
  }

  public isInDateRange(date: Date): boolean {
    return date >= this._startDate && date <= this._endDate
  }

  // Getters
  get id(): string {
    return this._id
  }
  get orgId(): string {
    return this._orgId
  }
  get name(): string {
    return this._name
  }
  get metricType(): MetricType {
    return this._metricType
  }
  get value(): number {
    return this._value
  }
  get unit(): string {
    return this._unit
  }
  get trend(): 'UP' | 'DOWN' | 'STABLE' {
    return this._trend
  }
  get trendPercentage(): number {
    return this._trendPercentage
  }
  get previousValue(): number | undefined {
    return this._previousValue
  }
  get timeRange(): TimeRangeType {
    return this._timeRange
  }
  get startDate(): Date {
    return this._startDate
  }
  get endDate(): Date {
    return this._endDate
  }
  get source(): string {
    return this._source
  }
  get tags(): string[] {
    return this._tags
  }
  get description(): string | undefined {
    return this._description
  }
  get createdAt(): Date {
    return this._createdAt
  }
  get updatedAt(): Date {
    return this._updatedAt
  }
  get createdBy(): string {
    return this._createdBy
  }
  get updatedBy(): string {
    return this._updatedBy
  }
}
