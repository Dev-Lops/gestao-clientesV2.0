import { can } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import {
  checkRateLimit,
  rateLimitExceeded,
  uploadRatelimit,
} from '@/lib/ratelimit'
import {
  generateFileKey,
  getMediaTypeFromMime,
  isAllowedMimeType,
  uploadFile,
} from '@/lib/storage'
import { getSessionProfile } from '@/services/auth/session'
import { fileTypeFromBuffer } from 'file-type'
import { NextResponse } from 'next/server'

const MAX_FILE_SIZE = 1.5 * 1024 * 1024 * 1024 // 1.5GB

// POST /api/clients/[id]/media/upload
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
    const { user, orgId, role } = await getSessionProfile()
    if (!user || !orgId || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting para uploads
    const identifier = `${user.id}-upload`
    const rateLimitResult = await checkRateLimit(identifier, uploadRatelimit)

    if (!rateLimitResult.success) {
      return rateLimitExceeded(rateLimitResult.reset)
    }

    if (!can(role, 'create', 'media')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, orgId: true },
    })

    if (!client || client.orgId !== orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const formData = await req.formData()
    // Logging básico para diagnóstico (não inclui conteúdo do arquivo)
    const claimedMime = (formData.get('file') as File | null)?.type || 'unknown'
    const claimedSize = (formData.get('file') as File | null)?.size || 0
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string) || ''
    const description = (formData.get('description') as string) || ''
    let folderId = (formData.get('folderId') as string) || null
    const tagsRaw = (formData.get('tags') as string) || null
    const isLogo = (formData.get('isLogo') as string) === 'true'
    const colorsRaw = (formData.get('colors') as string) || null
    let tags: string[] = []
    let colors: string[] | null = null
    try {
      if (tagsRaw) tags = JSON.parse(tagsRaw) as string[]
      if (colorsRaw) colors = JSON.parse(colorsRaw) as string[]
    } catch {
      // ignore parse errors
      tags = []
      colors = null
    }

    // Se for logo, criar/buscar pasta "Logos" automaticamente
    if (isLogo) {
      let logoFolder = await prisma.mediaFolder.findFirst({
        where: {
          clientId,
          name: 'Logos',
          parentId: null,
        },
      })
      if (!logoFolder) {
        logoFolder = await prisma.mediaFolder.create({
          data: {
            name: 'Logos',
            description: 'Logos e identidade visual do cliente',
            clientId,
          },
        })
      }
      folderId = logoFolder.id
      if (!tags.includes('logo')) {
        tags.push('logo')
      }
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Arquivo muito grande (máx 1.5GB)` },
        { status: 400 }
      )
    }

    if (!isAllowedMimeType(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed', claimedMime: file.type },
        { status: 400 }
      )
    }

    // Valida pasta se especificada
    if (folderId) {
      const folder = await prisma.mediaFolder.findFirst({
        where: { id: folderId, clientId },
      })
      if (!folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Validar magic bytes para garantir que o tipo do arquivo é real
    const detectedType = await fileTypeFromBuffer(buffer)
    if (detectedType && !isAllowedMimeType(detectedType.mime)) {
      return NextResponse.json(
        {
          error: 'File type not allowed (magic bytes)',
          detectedMime: detectedType.mime,
          claimedMime: file.type,
        },
        { status: 400 }
      )
    }

    const fileKey = generateFileKey(clientId, file.name)
    const uploadResult = await uploadFile(fileKey, buffer, file.type)

    if (!uploadResult.success) {
      return NextResponse.json(
        {
          error: 'Falha no upload do arquivo',
          details: uploadResult.error,
        },
        { status: 500 }
      )
    }

    const media = await prisma.media.create({
      data: {
        title: title || file.name,
        description: description || null,
        fileKey,
        mimeType: file.type,
        fileSize: file.size,
        url: uploadResult.url || null,
        thumbUrl: uploadResult.thumbUrl || null,
        type: getMediaTypeFromMime(file.type),
        folderId: folderId || null,
        tags: tags,
        clientId,
        orgId,
      },
    })

    // Inclui cores extraídas no payload de resposta (não persiste em DB aqui)
    return NextResponse.json({ ...media, colors: colors || undefined })
  } catch (e) {
    console.error('Upload error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
