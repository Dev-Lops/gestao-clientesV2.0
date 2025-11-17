'use server'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { revalidatePath } from 'next/cache'
import { DeleteNotificationInput } from '../domain'

export async function deleteNotification(id: string) {
  const { user } = await getSessionProfile()
  if (!user) throw new Error('Não autenticado')
  const { id: validId } = DeleteNotificationInput.parse({ id })
  await prisma.notification.delete({ where: { id: validId } })
  revalidatePath('/')
  return { ok: true }
}
