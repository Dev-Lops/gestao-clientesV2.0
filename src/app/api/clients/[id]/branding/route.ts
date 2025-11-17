import { can } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (!role || !can(role, 'read', 'branding')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }
    const { id: clientId } = await params
    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
    })
    if (!client)
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    const brandings = await prisma.branding.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(brandings)
  } catch (e) {
    console.error('Erro GET branding', e)
    return NextResponse.json(
      { error: 'Erro ao buscar branding' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (!role || !can(role, 'create', 'branding')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }
    const { id: clientId } = await params
    const body = await req.json()
    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
    })
    if (!client)
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    const created = await prisma.branding.create({
      data: {
        clientId,
        title: body.title,
        type: body.type,
        description: body.description ?? null,
        fileUrl: body.fileUrl ?? null,
        content: body.content ?? null,
        thumbUrl: body.thumbUrl ?? null,
        palette: body.palette ?? null,
      },
    })
    return NextResponse.json(created)
  } catch (e) {
    console.error('Erro POST branding', e)
    return NextResponse.json(
      { error: 'Erro ao criar item de branding' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (!role || !can(role, 'update', 'branding')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }
    const url = new URL(req.url)
    const brandingId = url.searchParams.get('brandingId')
    if (!brandingId)
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
    const body = await req.json()
    // Build update object and allow explicit nulls. Use hasOwnProperty to
    // distinguish between "missing" and explicit `null` values from the client.
    const updateData: Prisma.BrandingUpdateInput = {}
    if (Object.prototype.hasOwnProperty.call(body, 'title'))
      updateData.title = body.title
    if (Object.prototype.hasOwnProperty.call(body, 'type'))
      updateData.type = body.type
    if (Object.prototype.hasOwnProperty.call(body, 'description'))
      updateData.description = body.description
    if (Object.prototype.hasOwnProperty.call(body, 'fileUrl'))
      updateData.fileUrl = body.fileUrl // allow null to clear
    if (Object.prototype.hasOwnProperty.call(body, 'content'))
      updateData.content = body.content
    if (Object.prototype.hasOwnProperty.call(body, 'thumbUrl'))
      updateData.thumbUrl = body.thumbUrl
    if (Object.prototype.hasOwnProperty.call(body, 'palette'))
      updateData.palette = body.palette
    const found = await prisma.branding.findUnique({
      where: { id: brandingId },
      include: { client: true },
    })
    if (!found || found.client.orgId !== orgId)
      return NextResponse.json(
        { error: 'Item não encontrado' },
        { status: 404 }
      )
    const updated = await prisma.branding.update({
      where: { id: brandingId },
      data: updateData,
    })
    return NextResponse.json(updated)
  } catch (e) {
    console.error('Erro PATCH branding', e)
    return NextResponse.json(
      { error: 'Erro ao atualizar item de branding' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (!role || !can(role, 'delete', 'branding')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }
    const url = new URL(req.url)
    const brandingId = url.searchParams.get('brandingId')
    if (!brandingId)
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
    const found = await prisma.branding.findUnique({
      where: { id: brandingId },
      include: { client: true },
    })
    if (!found || found.client.orgId !== orgId)
      return NextResponse.json(
        { error: 'Item não encontrado' },
        { status: 404 }
      )
    await prisma.branding.delete({ where: { id: brandingId } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Erro DELETE branding', e)
    return NextResponse.json(
      { error: 'Erro ao deletar item de branding' },
      { status: 500 }
    )
  }
}
