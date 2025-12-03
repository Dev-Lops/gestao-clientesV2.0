import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/finance/bulk-delete
 * Deletar múltiplas transações financeiras
 */
export async function DELETE(request: NextRequest) {
  try {
    const { orgId, role } = await getSessionProfile()
    if (!orgId || role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ids } = body as { ids: string[] }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs array is required' },
        { status: 400 }
      )
    }

    // Verificar se todas as transações pertencem à org
    const finances = await prisma.finance.findMany({
      where: {
        id: { in: ids },
        orgId,
      },
    })

    if (finances.length !== ids.length) {
      return NextResponse.json(
        {
          error:
            'Some transactions not found or do not belong to your organization',
        },
        { status: 403 }
      )
    }

    // Deletar transações
    const result = await prisma.finance.deleteMany({
      where: {
        id: { in: ids },
        orgId,
      },
    })

    return NextResponse.json({
      success: true,
      deleted: result.count,
    })
  } catch (error) {
    console.error('Error deleting finances:', error)
    return NextResponse.json(
      { error: 'Failed to delete transactions' },
      { status: 500 }
    )
  }
}
