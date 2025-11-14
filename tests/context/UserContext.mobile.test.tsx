import { UserProvider, useUser } from '@/context/UserContext'
import { act, render, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
  })),
}))

const mockGetRedirectResult = jest.fn()
const mockSignOut = jest.fn()
const mockUser = { uid: '123', getIdToken: jest.fn(() => Promise.resolve('token')) }

jest.mock('@/lib/firebase', () => ({
  auth: {},
  provider: {},
}))
jest.mock('firebase/auth', () => ({
  getRedirectResult: () => mockGetRedirectResult(),
  signOut: () => mockSignOut(),
  onAuthStateChanged: (auth: any, cb: any) => {
    cb(mockUser)
    return () => { }
  },
}))

describe('Mobile login redirect flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('should process redirect result and redirect to dashboard', async () => {
    mockGetRedirectResult.mockResolvedValueOnce({ user: mockUser })
    sessionStorage.setItem('pendingInviteToken', 'invite123')
    localStorage.setItem('pendingAuthRedirect', 'true')

    let redirectedPath = ''
      ; (useRouter as jest.Mock).mockReturnValue({
        push: (path: string) => { redirectedPath = path },
        refresh: jest.fn(),
        replace: jest.fn(),
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
