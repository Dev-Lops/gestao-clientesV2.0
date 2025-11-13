import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { user, orgId, role } = await getSessionProfile()

    if (!user || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Apenas owners podem ver a lista completa de membros
    if (role !== 'OWNER') {
      return NextResponse.json(
        {
          error:
            'Acesso negado. Apenas proprietários podem visualizar membros.',
        },
        { status: 403 }
      )
    }

    const members = await prisma.member.findMany({
      where: { orgId },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Formatar dados para o frontend
    const formattedMembers = members.map((member) => ({
      id: member.id,
      user_id: member.userId,
      role: member.role,
      status: member.isActive === false ? 'inactive' : 'active',
      full_name: member.user.name,
      email: member.user.email,
      created_at: member.createdAt.toISOString(),
      org_id: member.orgId,
    }))

    return NextResponse.json({ data: formattedMembers })
  } catch (error) {
    console.error('Erro ao buscar membros:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar membros' },
      { status: 500 }
    )
  }
}
