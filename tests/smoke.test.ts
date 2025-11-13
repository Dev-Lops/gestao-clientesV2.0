import { describe, expect, it } from 'vitest'

// Simple smoke test to ensure test runner and types are wired

describe('smoke', () => {
  it('runs a basic assertion', () => {
    expect(1 + 1).toBe(2)
  })
})
