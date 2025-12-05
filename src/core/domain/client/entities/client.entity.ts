import type { ClientStatus as ClientStatusEnum } from '@/types/enums'
import type { ClientPlan, SocialChannel } from '@prisma/client'

import { ClientStatus as DomainClientStatus } from '../value-objects/client-status.vo'
import { CNPJ } from '../value-objects/cnpj.vo'
import { Email } from '../value-objects/email.vo'

/**
 * Entity: Cliente
 * Representa um cliente no sistema
 */

export interface ClientProps {
  id: string
  name: string
  email: Email
  phone?: string | null
  cnpj?: CNPJ | null
  cpf?: string | null
  status: DomainClientStatus
  orgId: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

export class Client {
  private constructor(private props: ClientProps) {}

  static create(props: Omit<ClientProps, 'createdAt' | 'updatedAt'>): Client {
    return new Client({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static restore(props: ClientProps): Client {
    return new Client(props)
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get name(): string {
    return this.props.name
  }

  get email(): Email {
    return this.props.email
  }

  get phone(): string | null {
    return this.props.phone ?? null
  }

  get cnpj(): CNPJ | null {
    return this.props.cnpj ?? null
  }

  get cpf(): string | null {
    return this.props.cpf ?? null
  }

  get status(): DomainClientStatus {
    return this.props.status
  }

  get orgId(): string {
    return this.props.orgId
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt ?? null
  }

  get isActive(): boolean {
    return this.props.status === DomainClientStatus.ACTIVE
  }

  get isDeleted(): boolean {
    return (
      this.props.status === DomainClientStatus.DELETED &&
      this.props.deletedAt !== null
    )
  }

  // Business Methods
  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Nome do cliente não pode ser vazio')
    }
    this.props.name = name.trim()
    this.props.updatedAt = new Date()
  }

  updateEmail(email: Email): void {
    this.props.email = email
    this.props.updatedAt = new Date()
  }

  updatePhone(phone: string | null): void {
    this.props.phone = phone
    this.props.updatedAt = new Date()
  }

  activate(): void {
    if (this.isDeleted) {
      throw new Error('Cliente excluído não pode ser ativado')
    }
    this.props.status = DomainClientStatus.ACTIVE
    this.props.updatedAt = new Date()
  }

  deactivate(): void {
    if (this.isDeleted) {
      throw new Error('Cliente excluído não pode ser desativado')
    }
    this.props.status = DomainClientStatus.INACTIVE
    this.props.updatedAt = new Date()
  }

  softDelete(): void {
    this.props.status = DomainClientStatus.DELETED
    this.props.deletedAt = new Date()
    this.props.updatedAt = new Date()
  }

  // Validations
  canBeUpdated(): boolean {
    return !this.isDeleted
  }

  canBeDeleted(): boolean {
    return !this.isDeleted
  }

  // Serialization
  toJSON(): ClientProps {
    return { ...this.props }
  }
}

// Aggregate shapes used by infrastructure mappers and use cases
export interface ClientAggregate {
  id: string
  name: string
  email: string | null
  phone: string | null
  status: ClientStatusEnum
  plan: ClientPlan | null
  mainChannel: SocialChannel | null
  paymentStatus: string | null
  contractStart: Date | null
  contractEnd: Date | null
  contractValue: number | null
  paymentDay: number | null
  isInstallment: boolean
  installmentCount: number | null
  installmentValue: number | null
  installmentPaymentDays: number[]
  createdAt: Date
  updatedAt: Date
}

export type LiteClientAggregate = Pick<ClientAggregate, 'id' | 'name' | 'email'>
