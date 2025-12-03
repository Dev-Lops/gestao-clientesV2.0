import { prisma } from '@/lib/prisma'
import { getApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const MAX_ATTEMPTS = Number(process.env.OUTBOX_MAX_ATTEMPTS || '5')

async function main() {
  // Busca eventos de dual-write pendentes
  const events = await prisma.webhookEvent.findMany({
    where: { provider: 'dual-write', eventType: 'firestore' },
    orderBy: { receivedAt: 'asc' },
    take: 50,
  })

  if (!events.length) {
    console.log('[outbox] nada a processar')
    return
  }

  const firestore = getFirestore(getApp())

  for (const evt of events) {
    const payload = evt.payload as any
    const attempts = Number(payload?.attempts ?? 0)
    if (attempts >= MAX_ATTEMPTS) {
      console.error('[outbox] descartando após tentativas máximas', evt.id)
      // Poderia mover para uma Dead-Letter, aqui apenas removemos
      await prisma.webhookEvent.delete({ where: { id: evt.id } })
      continue
    }

    try {
      if (payload?.entity === 'invoice' && payload?.op === 'create') {
        await firestore
          .collection('orgs')
          .doc(payload.orgId)
          .collection('clients')
          .doc(payload.clientId)
          .collection('invoices')
          .doc(payload.data.id)
          .set(payload.data)
      } else if (payload?.entity === 'task' && payload?.op === 'create') {
        await firestore
          .collection('orgs')
          .doc(payload.orgId)
          .collection('clients')
          .doc(payload.clientId)
          .collection('tasks')
          .doc(payload.data.id)
          .set(payload.data)
      } else {
        console.warn('[outbox] payload desconhecido, removendo', evt.id)
      }

      await prisma.webhookEvent.delete({ where: { id: evt.id } })
      console.log('[outbox] processado com sucesso', evt.id)
    } catch (err) {
      console.error('[outbox] falha, re-enfileirando', evt.id, err)
      await prisma.webhookEvent.update({
        where: { id: evt.id },
        data: { payload: { ...payload, attempts: attempts + 1 } },
      })
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
