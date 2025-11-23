import { logger, type LogContext } from '@/lib/logger'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'
// moved crypto import up (deduplicated)
import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

// Configuração S3 ou local
const USE_S3 = process.env.USE_S3 === 'true' || process.env.USE_S3 === '1'
const LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || './uploads'

// Prioriza STORAGE_* (Cloudflare R2) sobre AWS_* para evitar conflitos
const S3_BUCKET = process.env.STORAGE_BUCKET || process.env.AWS_S3_BUCKET || ''
let s3Client: S3Client | null = null
if (USE_S3) {
  const accessKeyId =
    process.env.STORAGE_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || ''
  const secretAccessKey =
    process.env.STORAGE_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    ''
  const endpoint = process.env.STORAGE_ENDPOINT || process.env.AWS_ENDPOINT_URL
  const regionEnv = process.env.STORAGE_REGION || process.env.AWS_REGION
  const region = endpoint ? regionEnv || 'auto' : regionEnv || 'us-east-1'

  const canUseS3 = !!(accessKeyId && secretAccessKey && S3_BUCKET)
  if (!canUseS3) {
    console.warn(
      '[storage] USE_S3=true mas credenciais/bucket ausentes. Fallback para armazenamento local.'
    )
  } else {
    // Log para debug de credenciais (sem expor valores sensíveis)
    console.log('[storage] Inicializando S3 Client:', {
      bucket: S3_BUCKET,
      endpoint: endpoint || 'default',
      region,
      accessKeyIdLength: accessKeyId.length,
      hasSecretKey: !!secretAccessKey,
    })

    const config: {
      region: string
      credentials: { accessKeyId: string; secretAccessKey: string }
      endpoint?: string
      forcePathStyle?: boolean
    } = {
      region,
      credentials: { accessKeyId, secretAccessKey },
    }
    if (endpoint) {
      config.endpoint = endpoint
      config.forcePathStyle = true // Necessário para compatibilidade com R2
    }
    s3Client = new S3Client(config)
  }
}

/**
 * Gera um nome de arquivo único e seguro
 */
export function generateFileKey(
  clientId: string,
  originalName: string
): string {
  const ext = path.extname(originalName)
  const hash = crypto.randomBytes(16).toString('hex')
  const sanitized = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
  return `clients/${clientId}/${Date.now()}_${hash}_${sanitized}${ext}`
}

/**
 * Upload de arquivo para S3 ou local
 */
export async function uploadFile(
  fileKey: string,
  buffer: Buffer,
  mimeType: string
): Promise<{
  success: boolean
  url?: string
  thumbUrl?: string
  error?: string
}> {
  try {
    let finalBuffer = buffer
    let finalMimeType = mimeType

    // Compressão automática para imagens grandes
    if (mimeType.startsWith('image/') && !mimeType.includes('svg')) {
      const sizeMB = buffer.length / (1024 * 1024)

      // Se imagem maior que 2MB, comprimir
      if (sizeMB > 2) {
        try {
          const compressed = await sharp(buffer)
            .rotate() // Auto-rotate baseado em EXIF
            .resize({ width: 2048, withoutEnlargement: true })
            .jpeg({ quality: 85, progressive: true })
            .toBuffer()

          // Só usa comprimido se realmente reduziu o tamanho
          if (compressed.length < buffer.length) {
            finalBuffer = compressed
            finalMimeType = 'image/jpeg'
            logger.debug('Imagem comprimida', {
              originalSizeMB: sizeMB.toFixed(2),
              compressedSizeMB: (compressed.length / (1024 * 1024)).toFixed(2),
            })
          }
        } catch (err) {
          logger.error('Falha na compressão de imagem, usando original', err)
        }
      } else {
        // Mesmo sem compressão, corrigir orientação EXIF
        try {
          const rotated = await sharp(buffer)
            .rotate() // Auto-rotate baseado em EXIF
            .toBuffer()
          finalBuffer = rotated
        } catch (err) {
          logger.debug(
            'Falha ao rotacionar imagem, usando original',
            err as LogContext
          )
        }
      }
    }

    if (USE_S3 && s3Client) {
      const opId = crypto.randomUUID()
      const t0 = Date.now()
      console.log('[storage:put:start]', {
        opId,
        fileKey,
        bucket: S3_BUCKET,
        mimeType: finalMimeType,
        size: finalBuffer.length,
      })
      try {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: fileKey,
            Body: finalBuffer,
            ContentType: finalMimeType,
          })
        )
      } catch (err) {
        console.error('[storage:put:error]', { opId, fileKey, error: err })
        return { success: false, error: String(err) }
      }
      console.log('[storage:put:done]', {
        opId,
        fileKey,
        durationMs: Date.now() - t0,
      })

      // Generate public URL (R2, S3, etc.)
      let url: string
      if (process.env.AWS_ENDPOINT_URL) {
        // Cloudflare R2 or custom endpoint: use signed URL helper
        url = await getFileUrl(fileKey, 604800)
      } else {
        url = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileKey}`
      }

      // If image, generate thumbnail and upload it
      let thumbUrl: string | undefined = undefined
      if (mimeType.startsWith('image/')) {
        try {
          const thumbBuf = await sharp(finalBuffer)
            .rotate() // Auto-rotate baseado em EXIF
            .resize({ width: 640, withoutEnlargement: true })
            .webp({ quality: 75 })
            .toBuffer()
          const ext = path.extname(fileKey)
          const base = fileKey.slice(0, -ext.length)
          const thumbKey = `${base}_thumb.webp`
          try {
            await s3Client.send(
              new PutObjectCommand({
                Bucket: S3_BUCKET,
                Key: thumbKey,
                Body: thumbBuf,
                ContentType: 'image/webp',
              })
            )
          } catch (err) {
            console.error('[storage:thumb:error]', { fileKey, error: err })
          }
          if (process.env.AWS_ENDPOINT_URL) {
            thumbUrl = await getFileUrl(thumbKey, 604800)
          } else {
            thumbUrl = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${thumbKey}`
          }
        } catch (err) {
          console.error('Thumbnail generation/upload failed:', err)
        }
      }

      return { success: true, url, thumbUrl }
    } else {
      // Local storage
      const fullPath = path.join(LOCAL_UPLOAD_DIR, fileKey)
      await fs.mkdir(path.dirname(fullPath), { recursive: true })
      await fs.writeFile(fullPath, finalBuffer)
      const url = `/uploads/${fileKey}`

      // If image, generate local thumbnail
      let thumbUrl: string | undefined = undefined
      if (mimeType.startsWith('image/')) {
        try {
          const thumbBuf = await sharp(finalBuffer)
            .rotate() // Auto-rotate baseado em EXIF
            .resize({ width: 640, withoutEnlargement: true })
            .webp({ quality: 75 })
            .toBuffer()
          const ext = path.extname(fileKey)
          const base = fileKey.slice(0, -ext.length)
          const thumbKey = `${base}_thumb.webp`
          const thumbFullPath = path.join(LOCAL_UPLOAD_DIR, thumbKey)
          await fs.writeFile(thumbFullPath, thumbBuf)
          thumbUrl = `/uploads/${thumbKey}`
        } catch (err) {
          console.error('Local thumbnail generation failed:', err)
        }
      }
      return { success: true, url, thumbUrl }
    }
  } catch (err) {
    console.error('Upload error:', err)
    return { success: false, error: String(err) }
  }
}

/**
 * Deleta arquivo do S3 ou local
 */
export async function deleteFile(
  fileKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (USE_S3 && s3Client) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: S3_BUCKET,
          Key: fileKey,
        })
      )
      return { success: true }
    } else {
      const fullPath = path.join(LOCAL_UPLOAD_DIR, fileKey)
      await fs.unlink(fullPath).catch(() => {}) // ignora se não existir
      return { success: true }
    }
  } catch (err) {
    console.error('Delete error:', err)
    return { success: false, error: String(err) }
  }
}

/**
 * Gera URL assinada temporária (para S3) ou retorna URL local
 */
export async function getFileUrl(
  fileKey: string,
  expiresIn = 3600
): Promise<string> {
  if (USE_S3 && s3Client) {
    const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: fileKey })
    return await getSignedUrl(s3Client, command, { expiresIn })
  } else {
    return `/uploads/${fileKey}`
  }
}

/**
 * Gera uma URL presignada para upload (PUT) para S3/R2.
 * Retorna null se S3 não estiver configurado.
 */
export async function createPresignedPutUrl(
  fileKey: string,
  mimeType: string,
  expiresIn = 900
): Promise<string | null> {
  if (!USE_S3 || !s3Client) return null
  const cmd = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: fileKey,
    ContentType: mimeType,
  })
  return await getSignedUrl(s3Client, cmd, { expiresIn })
}

/**
 * Valida MIME type (whitelist)
 */
// Aceitação ampla de mídia (imagens, vídeos, áudio, documentos comuns)
// Mantém pequena lista de tipos potencialmente perigosos para bloquear.
const BLOCKED_MIME_PREFIXES = [
  'application/x-msdownload', // executáveis Windows
  'application/x-sh',
  'application/x-csh',
  'application/x-executable',
  'application/x-dosexec',
]

const EXTRA_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/json',
]

export function isAllowedMimeType(mimeType: string): boolean {
  if (!mimeType) return false
  if (BLOCKED_MIME_PREFIXES.some((p) => mimeType.startsWith(p))) return false
  if (mimeType.startsWith('image/')) return true // inclui heic, heif, avif, etc.
  if (mimeType.startsWith('video/')) return true
  if (mimeType.startsWith('audio/')) return true
  if (mimeType.startsWith('text/')) return true
  if (EXTRA_DOCUMENT_TYPES.includes(mimeType)) return true
  // Permitir binário genérico para alguns formatos não detectados
  if (mimeType === 'application/octet-stream') return true
  // Outros application/* são bloqueados por segurança
  return false
}

export function mimeRejectionReason(
  mimeType: string
): 'blocked' | 'unsupported' | null {
  if (!mimeType) return 'unsupported'
  if (isAllowedMimeType(mimeType)) return null
  if (BLOCKED_MIME_PREFIXES.some((p) => mimeType.startsWith(p)))
    return 'blocked'
  return 'unsupported'
}

export function getMediaTypeFromMime(
  mimeType: string
): 'image' | 'video' | 'document' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  return 'document'
}
