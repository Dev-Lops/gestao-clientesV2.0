import { prisma } from '@/lib/prisma'

async function main() {
  const clientId = process.argv[2] || 'cmi3syz6o0001cmok4cu1byba'
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true, orgId: true } })
  if (!client) {
    console.error('Client not found:', clientId)
    process.exit(1)
  }
  console.log('Client found, orgId=', client.orgId)

  const media = await prisma.media.create({
    data: {
      title: 'PR Test file',
      description: 'Created by test script',
      fileKey: `clients/${clientId}/test_pr_media.mov`,
      mimeType: 'video/quicktime',
      fileSize: 12345,
      url: '/uploads/clients/...',
      type: 'video',
      clientId: client.id,
      orgId: client.orgId,
    },
  })
  console.log('Created media id=', media.id)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
