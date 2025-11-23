import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get('auth')?.value
  if (!token) redirect('/login')

  const role = cookies().get('role')?.value
  if (role !== 'OWNER') {
    redirect('/')
  }

  return <>{children}</>
}
