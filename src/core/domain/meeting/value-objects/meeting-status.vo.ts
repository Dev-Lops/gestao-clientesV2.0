/**
 * Meeting Status Value Object
 * Define os estados possíveis de uma reunião
 */

export enum MeetingStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
}

export enum MeetingType {
  PRESENCIAL = 'PRESENCIAL',
  VIRTUAL = 'VIRTUAL',
  HIBRIDO = 'HIBRIDO',
}

/**
 * Valida se o status é válido
 */
export function isValidMeetingStatus(status: string): boolean {
  return Object.values(MeetingStatus).includes(status as MeetingStatus)
}

/**
 * Valida se o tipo é válido
 */
export function isValidMeetingType(type: string): boolean {
  return Object.values(MeetingType).includes(type as MeetingType)
}
