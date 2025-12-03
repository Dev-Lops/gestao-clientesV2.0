import { createMedia } from '@/lib/repositories/mediaRepository'
import { getFileUrl } from '@/lib/storage'
import { applySecurityHeaders, guardAccess } from '@/proxy'
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'
import path from 'node:path'
import sharp from 'sharp'

// Reusa configuração do storage.ts (variáveis STORAGE_* / AWS_*)
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
  const cfg: any = {
    region,
    credentials: { accessKeyId, secretAccessKey },
  }
  if (endpoint) {
    cfg.endpoint = endpoint
    cfg.forcePathStyle = true
  }
  s3 = new S3Client(cfg)
}

async function getObjectBuffer(key: string): Promise<Buffer> {
  if (!s3) throw new Error('S3 client não configurado')
  const res = await s3.send(
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: key })
  )
  const stream: any = (res as any).Body
  if (!stream) throw new Error('Falha ao obter stream do objeto S3')
  const chunks: Buffer[] = []
  await new Promise<void>((resolve, reject) => {
    stream.on('data', (chunk: Buffer | Uint8Array) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })
    stream.once('end', () => resolve())
    stream.once('error', (err: unknown) => reject(err))
  })
  return Buffer.concat(chunks)
}

export async function POST(req: NextRequest) {
  try {
    const guard = guardAccess(req)
    if (guard) return guard
    const body = await req.json()
    const { orgId, clientId, originalKey, mimeType, size, title, description } =
      body || {}

    if (!orgId || !clientId || !originalKey || !mimeType) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos' },
        { status: 400 }
      )
    }
    if (!USE_S3 || !s3) {
      return NextResponse.json(
        { error: 'Storage S3/R2 não configurado' },
        { status: 500 }
      )
    }

    // Baixa original e gera derivativos para uso no app (otimizada + thumb)
    let optimizedUrl: string | undefined
    let thumbUrl: string | undefined
    const ext = path.extname(originalKey)
    const base = originalKey.slice(0, -ext.length)
    const optimizedKey = `${base}_optimized.webp`
    const thumbKey = `${base}_thumb.webp`

    if (mimeType.startsWith('image/') && !mimeType.includes('svg')) {
      const original = await getObjectBuffer(originalKey)
      const optimized = await sharp(original)
        .rotate()
        .resize({ width: 2048, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer()
      const thumb = await sharp(original)
        .rotate()
        .resize({ width: 640, withoutEnlargement: true })
        .webp({ quality: 70 })
        .toBuffer()

      await s3.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: optimizedKey,
          Body: optimized,
          ContentType: 'image/webp',
        })
      )
      await s3.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: thumbKey,
          Body: thumb,
          ContentType: 'image/webp',
        })
      )

      optimizedUrl = await getFileUrl(optimizedKey, 7 * 24 * 3600)
      thumbUrl = await getFileUrl(thumbKey, 7 * 24 * 3600)
    }

    // URL assinada para download do original (não salva permanente para evitar exposição)
    const originalDownloadUrl = await getFileUrl(originalKey, 7 * 24 * 3600)

    // Registrar via repositório (dual-write opcional)
    const media = await createMedia({
      orgId,
      clientId,
      title: title || 'Arquivo',
      description: description || null,
      type: mimeType.split('/')[0],
      mimeType,
      fileKey: originalKey,
      fileSize: typeof size === 'number' ? Math.round(size) : null,
      url: optimizedUrl || originalDownloadUrl,
      thumbUrl: thumbUrl || null,
      tags: [],
    })

    const res = NextResponse.json({
      success: true,
      media,
      downloadUrl: originalDownloadUrl,
      optimizedUrl: optimizedUrl || null,
      thumbUrl: thumbUrl || null,
    })
    return applySecurityHeaders(req, res)
  } catch (err) {
    const res = NextResponse.json({ error: String(err) }, { status: 500 })
    return applySecurityHeaders(req, res)
  }
}
