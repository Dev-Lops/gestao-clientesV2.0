import { can } from '@/lib/permissions'
import { describe, expect, it } from 'vitest'

describe('permissions', () => {
  it('OWNER manages everything', () => {
    expect(can('OWNER', 'manage', 'client')).toBe(true)
    expect(can('OWNER', 'delete', 'media')).toBe(true)
  })

  it('STAFF cannot delete client', () => {
    expect(can('STAFF', 'delete', 'client')).toBe(false)
    expect(can('STAFF', 'update', 'client')).toBe(true)
  })

  it('CLIENT can only read limited resources', () => {
    expect(can('CLIENT', 'read', 'client')).toBe(true)
    expect(can('CLIENT', 'update', 'client')).toBe(false)
    expect(can('CLIENT', 'delete', 'media')).toBe(false)
  })
})
