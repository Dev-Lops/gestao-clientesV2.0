import { can } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { sanitizeObject } from '@/lib/sanitize'
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

    // Sanitize user-generated content
    const sanitized = sanitizeObject(body, {
      textFields: ['title', 'description'],
      urlFields: ['fileUrl', 'thumbUrl'],
      htmlFields: ['content'],
    })

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
        title: sanitized.title,
        type: sanitized.type,
        description: sanitized.description ?? null,
        fileUrl: sanitized.fileUrl ?? null,
        content: sanitized.content ?? null,
        thumbUrl: sanitized.thumbUrl ?? null,
        palette: sanitized.palette ?? null,
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

    // Sanitize user-generated content
    const sanitized = sanitizeObject(body, {
      textFields: ['title', 'description'],
      urlFields: ['fileUrl', 'thumbUrl'],
      htmlFields: ['content'],
    })

    // Build update object and allow explicit nulls. Use hasOwnProperty to
    // distinguish between "missing" and explicit `null` values from the client.
    const updateData: Prisma.BrandingUpdateInput = {}
    if (Object.prototype.hasOwnProperty.call(sanitized, 'title'))
      updateData.title = sanitized.title
    if (Object.prototype.hasOwnProperty.call(sanitized, 'type'))
      updateData.type = sanitized.type
    if (Object.prototype.hasOwnProperty.call(sanitized, 'description'))
      updateData.description = sanitized.description
    if (Object.prototype.hasOwnProperty.call(sanitized, 'fileUrl'))
      updateData.fileUrl = sanitized.fileUrl // allow null to clear
    if (Object.prototype.hasOwnProperty.call(sanitized, 'content'))
      updateData.content = sanitized.content
    if (Object.prototype.hasOwnProperty.call(sanitized, 'thumbUrl'))
      updateData.thumbUrl = sanitized.thumbUrl
    if (Object.prototype.hasOwnProperty.call(sanitized, 'palette'))
      updateData.palette = sanitized.palette
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
