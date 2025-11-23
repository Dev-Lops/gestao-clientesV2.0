import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get('auth')?.value
  if (!token) {
    redirect('/login')
  }
  return <>{children}</>
}
