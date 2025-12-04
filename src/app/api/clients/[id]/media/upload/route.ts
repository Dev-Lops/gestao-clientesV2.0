import { AppRole, can } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import {
  checkRateLimit,
  rateLimitExceeded,
  uploadRatelimit,
} from '@/lib/ratelimit'
import {
  generateFileKey,
  getFileUrl,
  getMediaTypeFromMime,
  isAllowedMimeType,
  mimeRejectionReason,
  uploadFile,
} from '@/lib/storage'
import { getMaxUploadSizeBytes, getMaxUploadSizeMB } from '@/lib/upload-config'
import { getSessionProfile } from '@/services/auth/session'
import crypto from 'crypto'
import { fileTypeFromBuffer } from 'file-type'
import { NextRequest, NextResponse } from 'next/server'

const MAX_FILE_SIZE = getMaxUploadSizeBytes()

// Snapshot simplificado de variáveis de storage para debug opcional
function storageSnapshot() {
  return {
    USE_S3: process.env.USE_S3,
    STORAGE_BUCKET: process.env.STORAGE_BUCKET,
    STORAGE_ENDPOINT: process.env.STORAGE_ENDPOINT,
    STORAGE_REGION: process.env.STORAGE_REGION,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    endpointSource: process.env.STORAGE_ENDPOINT
      ? 'STORAGE_ENDPOINT'
      : process.env.AWS_ENDPOINT_URL
        ? 'AWS_ENDPOINT_URL'
        : 'none',
    accessKeyLen: (
      process.env.STORAGE_ACCESS_KEY_ID ||
      process.env.AWS_ACCESS_KEY_ID ||
      ''
    ).length,
  }
}

// POST /api/clients/[id]/media/upload
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
    const correlationId = crypto.randomUUID()
    const startedAt = Date.now()
    console.log('[upload:start]', {
      correlationId,
      clientId,
      contentType: req.headers.get('content-type'),
      contentLength: req.headers.get('content-length'),
      debug: req.headers.get('x-debug') === '1',
    })

    // Permite modo debug para reproduzir localmente sem depender de Firebase
    // Envie header `x-debug: 1` com `x-debug-org-id` e `x-debug-role` para simular sessão
    const debugFlag = req.headers.get('x-debug') === '1'
    let user: { id: string; email: string; name: string | null } | null = null
    let orgId: string | null = null
    let role: AppRole | null = null
    const normalizeRole = (value: string | null): AppRole | null => {
      if (!value) return null
      const upper = value.toUpperCase()
      return ['OWNER', 'STAFF', 'CLIENT'].includes(upper)
        ? (upper as AppRole)
        : null
    }

    if (debugFlag) {
      const hOrg = req.headers.get('x-debug-org-id')
      const hRole = req.headers.get('x-debug-role')
      const hUserId = req.headers.get('x-debug-user-id') || 'debug-user'
      const hUserEmail =
        req.headers.get('x-debug-user-email') || 'debug@example.com'
      const hUserName = req.headers.get('x-debug-user-name') || 'Debug User'
      orgId = hOrg || null
      role = normalizeRole(hRole)
      user = { id: hUserId, email: hUserEmail, name: hUserName }
    } else {
      const session = await getSessionProfile()
      user = session.user
      orgId = session.orgId
      role = session.role
    }

    if (!user || !orgId || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting para uploads
    const identifier = `${user.id}-upload`
    const rateLimitResult = await checkRateLimit(identifier, uploadRatelimit)

    if (!rateLimitResult.success) {
      return rateLimitExceeded(rateLimitResult.reset)
    }

    if (!role || !can(role, 'create', 'media')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, orgId: true },
    })

    // Em modo debug (reprodução local) permitimos pular a checagem estrita de orgId
    if (!debugFlag) {
      if (!client || client.orgId !== orgId) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }

    let formData: FormData
    try {
      formData = await req.formData()
    } catch (err) {
      console.error('[upload:formdata-error]', { correlationId, err })
      return NextResponse.json(
        { error: 'Malformed form-data', correlationId },
        { status: 400 }
      )
    }
    // Logging básico para diagnóstico (não inclui conteúdo do arquivo)
    const fileField = formData.get('file') as File | null
    const claimedSize = fileField?.size
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
        { error: `Arquivo muito grande (máx ${getMaxUploadSizeMB()}MB)` },
        { status: 400 }
      )
    }

    if (!isAllowedMimeType(file.type)) {
      const reason = mimeRejectionReason(file.type)
      console.log('[upload:mime-rejected]', {
        correlationId,
        claimedMime: file.type,
        claimedSize,
        fileName: file.name,
        reason,
      })
      return NextResponse.json(
        {
          error:
            reason === 'blocked'
              ? 'File type blocked for security'
              : 'Unsupported media type',
          claimedMime: file.type,
          correlationId,
        },
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

    let buffer: Buffer
    try {
      buffer = Buffer.from(await file.arrayBuffer())
    } catch (err) {
      console.error('[upload:buffer-error]', { correlationId, err })
      return NextResponse.json(
        { error: 'Failed to read file buffer', correlationId },
        { status: 500 }
      )
    }

    // Validar magic bytes para garantir que o tipo do arquivo é real
    const detectedType = await fileTypeFromBuffer(buffer)
    console.log('[upload:mime-detection]', {
      correlationId,
      fileName: file.name,
      claimedMime: file.type,
      detectedMime: detectedType?.mime || 'none',
      detectedExt: detectedType?.ext || 'none',
    })

    if (detectedType && !isAllowedMimeType(detectedType.mime)) {
      const reason = mimeRejectionReason(detectedType.mime)
      console.log('[upload:magic-bytes-rejected]', {
        correlationId,
        detectedMime: detectedType.mime,
        claimedMime: file.type,
        fileName: file.name,
        reason,
      })
      return NextResponse.json(
        {
          error:
            reason === 'blocked'
              ? 'File type blocked for security (magic bytes)'
              : 'Unsupported media type (magic bytes)',
          detectedMime: detectedType.mime,
          claimedMime: file.type,
          correlationId,
        },
        { status: 400 }
      )
    }

    const fileKey = generateFileKey(clientId, file.name)

    // Execução do upload (S3 ou local)
    const debugStorage = req.headers.get('x-debug-storage') === '1'
    if (debugStorage) {
      console.log('[upload:storage-snapshot]', {
        correlationId,
        snapshot: storageSnapshot(),
      })
    }
    const uploadResult = await uploadFile(fileKey, buffer, file.type)
    if (!uploadResult.success) {
      console.error('[upload:storage-error]', {
        correlationId,
        fileKey,
        error: uploadResult.error,
      })
      return NextResponse.json(
        {
          error: 'Falha no upload do arquivo',
          details: uploadResult.error,
          correlationId,
        },
        { status: 500 }
      )
    }

    // Persistir metadados no banco
    // IMPORTANTE: Para R2/S3, NÃO salvamos URLs presigned (expiram)
    // Apenas fileKey é salvo, URLs são geradas dinamicamente no GET
    let media
    try {
      const isLocalStorage =
        !process.env.USE_S3 || process.env.USE_S3 === 'false'
      media = await prisma.media.create({
        data: {
          title: title || file.name,
          description: description || null,
          fileKey,
          mimeType: file.type,
          fileSize: file.size,
          // Apenas salva URL/thumbUrl para storage local (não expira)
          url: isLocalStorage ? uploadResult.url || null : null,
          thumbUrl: isLocalStorage ? uploadResult.thumbUrl || null : null,
          type: getMediaTypeFromMime(file.type),
          folderId: folderId || null,
          tags: tags,
          clientId,
          orgId,
        },
      })
    } catch (dbErr) {
      console.error('[upload:db-error]', { correlationId, error: dbErr })
      // Tentar remover o arquivo recém subido para evitar órfãos (melhor esforço)
      try {
        // se storage local, cleanup will be handled by upload cleanup script; for S3 we'd attempt delete
      } catch {}
      return NextResponse.json(
        {
          error: 'Falha ao persistir metadados da mídia',
          details: String(dbErr),
          correlationId,
        },
        { status: 500 }
      )
    }

    // Inclui cores extraídas no payload de resposta (não persiste em DB aqui)
    const finishedAt = Date.now()
    console.log('[upload:success]', {
      correlationId,
      clientId,
      fileKey,
      mime: file.type,
      size: file.size,
      durationMs: finishedAt - startedAt,
    })

    // Regenerate fresh URLs for response (7 days expiry)
    const isLocalStorage = !process.env.USE_S3 || process.env.USE_S3 === 'false'
    let freshUrl = media.url
    let freshThumbUrl = media.thumbUrl
    if (!isLocalStorage && media.fileKey) {
      freshUrl = await getFileUrl(media.fileKey, 604800) // 7 days
      if (media.thumbUrl) {
        const ext = media.fileKey.substring(media.fileKey.lastIndexOf('.'))
        const thumbKey = media.fileKey.replace(ext, '_thumb.webp')
        freshThumbUrl = await getFileUrl(thumbKey, 604800).catch(() => null)
      }
    }

    return NextResponse.json({
      ...media,
      url: freshUrl,
      thumbUrl: freshThumbUrl,
      colors: colors || undefined,
      correlationId,
      debugStorage: debugStorage ? storageSnapshot() : undefined,
    })
  } catch (e) {
    // Garantir que crypto está disponível (importado acima). Gerar ID de fallback se falhar.
    let correlationId: string
    try {
      correlationId = crypto.randomUUID()
    } catch {
      correlationId = `cid-${Date.now()}-${Math.random().toString(16).slice(2)}`
    }
    console.error('[upload:unhandled-error]', { correlationId, error: e })
    // Se requisitado, explodir detalhe do erro para debugging (não em produção sem autorização)
    const url = new URL(req.url)
    const debugFlag =
      req.headers.get('x-debug') === '1' ||
      url.searchParams.get('debug') === 'true'
    if (debugFlag) {
      return NextResponse.json(
        { error: 'Internal error', details: String(e), correlationId },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Internal error', correlationId },
      { status: 500 }
    )
  }
}

// Força runtime Node.js (sharp, file-type não funcionam em edge runtime)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // Desabilita cache estático
export const maxDuration = 300 // 5 minutos (máx Netlify Pro)

// Documentação rápida de debug:
// - Enviar header `x-debug: 1` para incluir mais detalhes em erros controlados.
// - CorrelationId aparece em cada resposta 500 para cruzar com logs no Netlify.
// - Para inspecionar credenciais/storage: verificar logs '[storage] Inicializando S3 Client'.
