import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default function HomeRedirect() {
  const token = cookies().get('auth')?.value
  if (!token) {
    redirect('/login')
  }
  redirect('/dashboard')
}
