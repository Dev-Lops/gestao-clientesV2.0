'use server'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { revalidatePath } from 'next/cache'
import { MarkNotificationReadInput, UINotificationSchema } from '../domain'

export async function markNotificationAsRead(id: string) {
  const { user } = await getSessionProfile()
  if (!user) throw new Error('Não autenticado')
  const { id: validId } = MarkNotificationReadInput.parse({ id })
  const updated = await prisma.notification.update({
    where: { id: validId },
    data: { read: true },
  })
  revalidatePath('/')
  return UINotificationSchema.parse(updated)
}
