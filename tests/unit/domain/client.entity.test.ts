import { Client } from '@/core/domain/client/entities/client.entity'
import { ClientStatus } from '@/core/domain/client/value-objects/client-status.vo'
import { CNPJ } from '@/core/domain/client/value-objects/cnpj.vo'
import { Email } from '@/core/domain/client/value-objects/email.vo'
import { beforeEach, describe, expect, it } from 'vitest'

describe('Client Entity', () => {
  let client: Client
  const baseProps = {
    id: 'client-1',
    name: 'Acme Corporation',
    email: new Email('contact@acme.com'),
    phone: '+55 11 98765-4321',
    cnpj: new CNPJ('11222333000181'),
    cpf: null,
    status: ClientStatus.ACTIVE,
    orgId: 'org-1',
  }

  beforeEach(() => {
    client = Client.create(baseProps)
  })

  describe('Creation', () => {
    it('should create a new client with valid props', () => {
      expect(client.id).toBe('client-1')
      expect(client.name).toBe('Acme Corporation')
      expect(client.email.value).toBe('contact@acme.com')
      expect(client.status).toBe(ClientStatus.ACTIVE)
    })

    it('should set createdAt and updatedAt on creation', () => {
      expect(client.createdAt).toBeInstanceOf(Date)
      expect(client.updatedAt).toBeInstanceOf(Date)
    })

    it('should restore an existing client', () => {
      const props = client.toJSON()
      const restoredClient = Client.restore(props)

      expect(restoredClient.id).toBe(client.id)
      expect(restoredClient.name).toBe(client.name)
      expect(restoredClient.email.value).toBe(client.email.value)
    })

    it('should create a client with null cnpj', () => {
      const clientWithoutCNPJ = Client.create({
        ...baseProps,
        cnpj: null,
      })

      expect(clientWithoutCNPJ.cnpj).toBeNull()
    })

    it('should create a client with null phone', () => {
      const clientWithoutPhone = Client.create({
        ...baseProps,
        phone: null,
      })

      expect(clientWithoutPhone.phone).toBeNull()
    })
  })

  describe('Getters', () => {
    it('should return all properties correctly', () => {
      expect(client.id).toBe('client-1')
      expect(client.name).toBe('Acme Corporation')
      expect(client.email.value).toBe('contact@acme.com')
      expect(client.phone).toBe('+55 11 98765-4321')
      expect(client.cnpj?.value).toBe('11222333000181')
      expect(client.status).toBe(ClientStatus.ACTIVE)
      expect(client.orgId).toBe('org-1')
    })

    it('should return isActive as true when status is ACTIVE', () => {
      expect(client.isActive).toBe(true)
    })

    it('should return isActive as false when status is INACTIVE', () => {
      client.deactivate()
      expect(client.isActive).toBe(false)
    })

    it('should return isDeleted as false for active client', () => {
      expect(client.isDeleted).toBe(false)
    })

    it('should return isDeleted as true after soft delete', () => {
      client.softDelete()
      expect(client.isDeleted).toBe(true)
    })
  })

  describe('Update Name', () => {
    it('should update name successfully', () => {
      client.updateName('New Name Inc')
      expect(client.name).toBe('New Name Inc')
    })

    it('should trim name before updating', () => {
      client.updateName('  Trimmed Name  ')
      expect(client.name).toBe('Trimmed Name')
    })

    it('should update updatedAt when name changes', async () => {
      const previousUpdatedAt = client.updatedAt.getTime()
      // Small delay to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 1))
      client.updateName('New Name')
      expect(client.updatedAt.getTime()).toBeGreaterThanOrEqual(
        previousUpdatedAt
      )
    })

    it('should throw error when updating name to empty string', () => {
      expect(() => client.updateName('')).toThrow(
        'Nome do cliente não pode ser vazio'
      )
    })

    it('should throw error when updating name to whitespace only', () => {
      expect(() => client.updateName('   ')).toThrow(
        'Nome do cliente não pode ser vazio'
      )
    })
  })

  describe('Update Email', () => {
    it('should update email successfully', () => {
      const newEmail = new Email('newemail@acme.com')
      client.updateEmail(newEmail)
      expect(client.email.value).toBe('newemail@acme.com')
    })

    it('should update updatedAt when email changes', () => {
      const previousUpdatedAt = client.updatedAt.getTime()
      client.updateEmail(new Email('newemail@acme.com'))
      expect(client.updatedAt.getTime()).toBeGreaterThanOrEqual(
        previousUpdatedAt
      )
    })

    it('should throw error when updating with invalid email', () => {
      expect(() => client.updateEmail(new Email('invalid-email'))).toThrow()
    })
  })

  describe('Update Phone', () => {
    it('should update phone successfully', () => {
      client.updatePhone('+55 11 99999-9999')
      expect(client.phone).toBe('+55 11 99999-9999')
    })

    it('should set phone to null', () => {
      client.updatePhone(null)
      expect(client.phone).toBeNull()
    })

    it('should update updatedAt when phone changes', () => {
      const previousUpdatedAt = client.updatedAt.getTime()
      client.updatePhone('+55 11 99999-9999')
      expect(client.updatedAt.getTime()).toBeGreaterThanOrEqual(
        previousUpdatedAt
      )
    })
  })

  describe('Activate', () => {
    it('should activate an inactive client', () => {
      client.deactivate()
      expect(client.status).toBe(ClientStatus.INACTIVE)

      client.activate()
      expect(client.status).toBe(ClientStatus.ACTIVE)
    })

    it('should update updatedAt when activating', () => {
      client.deactivate()
      const previousUpdatedAt = client.updatedAt.getTime()

      client.activate()
      expect(client.updatedAt.getTime()).toBeGreaterThanOrEqual(
        previousUpdatedAt
      )
    })

    it('should throw error when trying to activate deleted client', () => {
      client.softDelete()
      expect(() => client.activate()).toThrow(
        'Cliente excluído não pode ser ativado'
      )
    })
  })

  describe('Deactivate', () => {
    it('should deactivate an active client', () => {
      expect(client.status).toBe(ClientStatus.ACTIVE)

      client.deactivate()
      expect(client.status).toBe(ClientStatus.INACTIVE)
    })

    it('should update updatedAt when deactivating', () => {
      const previousUpdatedAt = client.updatedAt.getTime()
      client.deactivate()
      expect(client.updatedAt.getTime()).toBeGreaterThanOrEqual(
        previousUpdatedAt
      )
    })

    it('should throw error when trying to deactivate deleted client', () => {
      client.softDelete()
      expect(() => client.deactivate()).toThrow(
        'Cliente excluído não pode ser desativado'
      )
    })
  })

  describe('Soft Delete', () => {
    it('should soft delete client successfully', () => {
      expect(client.isDeleted).toBe(false)

      client.softDelete()

      expect(client.isDeleted).toBe(true)
      expect(client.status).toBe(ClientStatus.DELETED)
      expect(client.deletedAt).toBeInstanceOf(Date)
    })

    it('should update updatedAt when soft deleting', () => {
      const previousUpdatedAt = client.updatedAt.getTime()
      client.softDelete()
      expect(client.updatedAt.getTime()).toBeGreaterThanOrEqual(
        previousUpdatedAt
      )
    })

    it('should prevent activation after soft delete', () => {
      client.softDelete()
      expect(() => client.activate()).toThrow()
    })

    it('should prevent deactivation after soft delete', () => {
      client.softDelete()
      expect(() => client.deactivate()).toThrow()
    })
  })

  describe('Validations', () => {
    it('should return true for canBeUpdated when not deleted', () => {
      expect(client.canBeUpdated()).toBe(true)
    })

    it('should return false for canBeUpdated when deleted', () => {
      client.softDelete()
      expect(client.canBeUpdated()).toBe(false)
    })

    it('should return true for canBeDeleted when not deleted', () => {
      expect(client.canBeDeleted()).toBe(true)
    })

    it('should return false for canBeDeleted when already deleted', () => {
      client.softDelete()
      expect(client.canBeDeleted()).toBe(false)
    })
  })

  describe('Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const json = client.toJSON()

      expect(json.id).toBe('client-1')
      expect(json.name).toBe('Acme Corporation')
      expect(json.email.value).toBe('contact@acme.com')
      expect(json.status).toBe(ClientStatus.ACTIVE)
      expect(json.orgId).toBe('org-1')
    })

    it('should preserve all properties in JSON serialization', () => {
      const json = client.toJSON()
      const restoredClient = Client.restore(json)

      expect(restoredClient.name).toBe(client.name)
      expect(restoredClient.email.value).toBe(client.email.value)
      expect(restoredClient.phone).toBe(client.phone)
      expect(restoredClient.status).toBe(client.status)
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle multiple updates maintaining state', () => {
      client.updateName('Updated Name 1')
      expect(client.name).toBe('Updated Name 1')

      client.updateName('Updated Name 2')
      expect(client.name).toBe('Updated Name 2')

      client.updatePhone('+55 11 91234-5678')
      expect(client.phone).toBe('+55 11 91234-5678')

      expect(client.status).toBe(ClientStatus.ACTIVE)
    })

    it('should maintain consistency after activate/deactivate cycle', () => {
      client.deactivate()
      expect(client.isActive).toBe(false)

      client.activate()
      expect(client.isActive).toBe(true)

      client.deactivate()
      expect(client.isActive).toBe(false)
    })

    it('should have consistent timestamps after operations', () => {
      const createdAt = client.createdAt.getTime()
      const updatedAt1 = client.updatedAt.getTime()

      client.updateName('New Name')
      const updatedAt2 = client.updatedAt.getTime()

      expect(createdAt).toBe(updatedAt1)
      expect(updatedAt2).toBeGreaterThanOrEqual(updatedAt1)
    })
  })
})
