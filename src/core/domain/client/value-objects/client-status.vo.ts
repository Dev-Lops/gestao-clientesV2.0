/**
 * Enumeração: Status do Cliente
 */

export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  DELETED = 'DELETED',
}

export const ClientStatusLabels: Record<ClientStatus, string> = {
  [ClientStatus.ACTIVE]: 'Ativo',
  [ClientStatus.INACTIVE]: 'Inativo',
  [ClientStatus.PENDING]: 'Pendente',
  [ClientStatus.DELETED]: 'Excluído',
}
