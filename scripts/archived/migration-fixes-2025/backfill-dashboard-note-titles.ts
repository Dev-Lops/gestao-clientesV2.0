/*
  Backfill DashboardNote titles where missing or empty.
  - Sets title to first 60 chars of content (trimmed) or 'Sem título' if content is empty.
  - Leaves existing non-empty titles untouched.
*/

// Load environment for Prisma (DATABASE_URL, etc.)
import 'dotenv/config'
// Use the app's Prisma singleton to avoid client init issues
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('Starting backfill: DashboardNote titles...')

  const notes = await prisma.dashboardNote.findMany({
    where: {
      OR: [{ title: '' }, { title: { equals: ' ', mode: 'insensitive' } }],
    },
    select: { id: true, content: true, title: true },
  })

  if (notes.length === 0) {
    console.log('No notes require backfill. Done.')
    return
  }

  console.log(`Found ${notes.length} notes to update.`)

  let updated = 0
  for (const n of notes) {
    const content = (n.content || '').trim()
    const fallback = content.length > 0 ? content.slice(0, 60) : 'Sem título'

    await prisma.dashboardNote.update({
      where: { id: n.id },
      data: { title: fallback },
    })
    updated++
  }

  console.log(`Backfill complete. Updated ${updated} notes.`)
}

main()
  .catch((err) => {
    console.error('Backfill failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
