import { createMedia } from '@/lib/repositories/mediaRepository'
import { getFileUrl } from '@/lib/storage'
import { applySecurityHeaders, guardAccess } from '@/proxy'
import { CompleteMultipartUploadCommand, S3Client } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'
import path from 'node:path'

const USE_S3 = process.env.USE_S3 === 'true' || process.env.USE_S3 === '1'
const S3_BUCKET = process.env.STORAGE_BUCKET || process.env.AWS_S3_BUCKET || ''
const endpoint = process.env.STORAGE_ENDPOINT || process.env.AWS_ENDPOINT_URL
const regionEnv = process.env.STORAGE_REGION || process.env.AWS_REGION
const region = endpoint ? regionEnv || 'auto' : regionEnv || 'us-east-1'
const accessKeyId =
  process.env.STORAGE_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || ''
const secretAccessKey =
  process.env.STORAGE_SECRET_ACCESS_KEY ||
  process.env.AWS_SECRET_ACCESS_KEY ||
  ''

let s3: S3Client | null = null
if (USE_S3 && S3_BUCKET && accessKeyId && secretAccessKey) {
  const cfg: any = { region, credentials: { accessKeyId, secretAccessKey } }
  if (endpoint) {
    cfg.endpoint = endpoint
    cfg.forcePathStyle = true
  }
  s3 = new S3Client(cfg)
}

export async function POST(req: NextRequest) {
  try {
    const guard = guardAccess(req)
    if (guard) return guard
    if (!s3)
      return NextResponse.json({ error: 'S3 não configurado' }, { status: 500 })
    const {
      orgId,
      clientId,
      originalKey,
      uploadId,
      parts,
      title,
      description,
      mimeType,
      size,
    } = await req.json()
    if (
      !orgId ||
      !clientId ||
      !originalKey ||
      !uploadId ||
      !Array.isArray(parts)
    ) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos' },
        { status: 400 }
      )
    }

    const cmd = new CompleteMultipartUploadCommand({
      Bucket: S3_BUCKET,
      Key: originalKey,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.map((p: any) => ({
          ETag: p.ETag,
          PartNumber: Number(p.partNumber),
        })),
      },
    })
    await s3.send(cmd)

    // gerar URLs
    const originalDownloadUrl = await getFileUrl(originalKey, 7 * 24 * 3600)

    const ext = path.extname(originalKey)
    const base = originalKey.slice(0, -ext.length)
    // Para simplificar, nesta primeira versão de multipart não geramos otimizada/thumbnail aqui.
    // O cliente pode chamar /api/uploads/finalize para imagens se desejar derivativos.

    const media = await createMedia({
      orgId,
      clientId,
      title: title || 'Arquivo',
      description: description || null,
      type: (mimeType || '').startsWith('video/')
        ? 'video'
        : (mimeType || '').startsWith('image/')
          ? 'image'
          : 'document',
      mimeType,
      fileKey: originalKey,
      fileSize: typeof size === 'number' ? Math.round(size) : null,
      url: originalDownloadUrl,
      thumbUrl: null,
      tags: [],
    })

    const res = NextResponse.json({
      success: true,
      media,
      downloadUrl: originalDownloadUrl,
    })
    return applySecurityHeaders(req, res)
  } catch (err) {
    const res = NextResponse.json({ error: String(err) }, { status: 500 })
    return applySecurityHeaders(req, res)
  }
}
