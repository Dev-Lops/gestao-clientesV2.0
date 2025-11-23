import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get('auth')?.value
  if (!token) {
    redirect('/login')
  }

  // If needed later, enforce role-based redirects here
  // const role = cookies().get('role')?.value
  // if (role === 'CLIENT') redirect('/clients')

  return <>{children}</>
}
