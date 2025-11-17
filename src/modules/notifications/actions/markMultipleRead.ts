'use server'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { revalidatePath } from 'next/cache'
import { MarkMultipleReadInput, UINotificationSchema } from '../domain'

export async function markMultipleNotificationsRead(ids: string[]) {
  const { user } = await getSessionProfile()
  if (!user) throw new Error('Não autenticado')
  const { ids: validIds } = MarkMultipleReadInput.parse({ ids })
  await prisma.notification.updateMany({
    where: { id: { in: validIds }, userId: user.id },
    data: { read: true },
  })
  // Retorna notificações atualizadas para UI caso necessário
  const refreshed = await prisma.notification.findMany({
    where: { id: { in: validIds } },
    orderBy: { createdAt: 'desc' },
  })
  revalidatePath('/')
  return refreshed.map((n) => UINotificationSchema.parse(n))
}
