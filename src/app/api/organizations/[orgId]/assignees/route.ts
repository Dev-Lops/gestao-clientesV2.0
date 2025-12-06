import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ orgId: string }>
}

/**
 * GET /api/organizations/[orgId]/assignees
 * Retorna lista de owners e staff ativos da organização para atribuição de tasks
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId } = await params

    if (!orgId) {
      return NextResponse.json(
        { error: 'orgId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar org e seu owner
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: {
        ownerId: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!org) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    // Buscar staff ativos
    const staffMembers = await prisma.member.findMany({
      where: {
        orgId,
        role: 'STAFF',
        isActive: true,
      },
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Montar lista de assignees
    const assignees: Array<{
      id: string
      name: string
      email?: string
      role: 'OWNER' | 'STAFF'
      isActive: boolean
    }> = []

    // Adicionar owner
    if (org.owner) {
      assignees.push({
        id: org.owner.id,
        name: org.owner.name || 'Owner',
        email: org.owner.email,
        role: 'OWNER',
        isActive: true,
      })
    }

    // Adicionar staff
    staffMembers.forEach((member) => {
      assignees.push({
        id: member.user.id,
        name: member.user.name || 'Staff',
        email: member.user.email,
        role: 'STAFF',
        isActive: true,
      })
    })

    return NextResponse.json(assignees, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar assignees:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
