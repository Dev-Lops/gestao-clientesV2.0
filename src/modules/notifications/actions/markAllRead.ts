'use server'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { revalidatePath } from 'next/cache'
import { MarkAllReadInput } from '../domain'

export async function markAllNotificationsRead(scope: 'user' | 'org' = 'user') {
  const { user, orgId } = await getSessionProfile()
  if (!user) throw new Error('Não autenticado')
  const { scope: validScope } = MarkAllReadInput.parse({ scope })

  if (validScope === 'org') {
    if (!orgId) throw new Error('Org não encontrada para escopo org')
    await prisma.notification.updateMany({
      where: { orgId, read: false },
      data: { read: true },
    })
  } else {
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    })
  }
  revalidatePath('/')
  return { ok: true }
}
