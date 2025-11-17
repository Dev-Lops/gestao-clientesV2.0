import { act, render, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { UserProvider, useUser } from '../../src/context/UserContext'

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  })),
}))


const mockGetRedirectResult = vi.fn()
const mockSignOut = vi.fn()
const mockUser = { uid: '123', getIdToken: vi.fn(() => Promise.resolve('token')) }

vi.mock('@/lib/firebase', () => ({
  auth: {},
  provider: {},
}))
vi.mock('firebase/auth', () => ({
  getRedirectResult: () => mockGetRedirectResult(),
  signOut: () => mockSignOut(),
  onAuthStateChanged: (_auth: unknown, cb: (user: unknown) => void) => {
    cb(mockUser as unknown)
    return () => { }
  },
}))

describe('Mobile login redirect flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('should process redirect result and redirect to dashboard', async () => {
    mockGetRedirectResult.mockResolvedValueOnce({ user: mockUser })
    sessionStorage.setItem('pendingInviteToken', 'invite123')
    localStorage.setItem('pendingAuthRedirect', 'true')

    let redirectedPath = ''
      ; (useRouter as unknown as { mockReturnValue: (value: { push: (path: string) => void; refresh: () => void; replace: () => void }) => void }).mockReturnValue({
        push: (path: string) => { redirectedPath = path },
        refresh: vi.fn(),
        replace: vi.fn(),
      })

    function TestComponent() {
      const { user, loading } = useUser()
      return <div>{loading ? 'Loading' : user ? 'Logged' : 'Not logged'}</div>
    }

    await act(async () => {
      render(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      )
    })

    await waitFor(() => {
      expect(mockGetRedirectResult).toHaveBeenCalled()
      expect(redirectedPath === '/' || redirectedPath === '/dashboard').toBeTruthy()
    })
  })

  it('should clean flags if no redirect result', async () => {
    mockGetRedirectResult.mockResolvedValueOnce(null)
    localStorage.setItem('pendingAuthRedirect', 'true')
    sessionStorage.setItem('pendingInviteToken', 'invite123')

    await act(async () => {
      render(
        <UserProvider>
          <div>Test</div>
        </UserProvider>
      )
    })

    await waitFor(() => {
      expect(localStorage.getItem('pendingAuthRedirect')).toBeNull()
      expect(sessionStorage.getItem('pendingInviteToken')).toBeNull()
    })
  })
})
