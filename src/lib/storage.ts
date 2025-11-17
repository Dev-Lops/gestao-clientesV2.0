import { logger } from '@/lib/logger'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

// Configuração S3 ou local
const USE_S3 = process.env.USE_S3 === 'true'
const LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || './uploads'

let s3Client: S3Client | null = null
if (USE_S3) {
  const config: {
    region: string
    credentials: { accessKeyId: string; secretAccessKey: string }
    endpoint?: string
    forcePathStyle?: boolean
  } = {
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  }

  // Suporte a Cloudflare R2, Backblaze B2, etc (endpoint customizado)
  if (process.env.AWS_ENDPOINT_URL) {
    config.endpoint = process.env.AWS_ENDPOINT_URL
    config.forcePathStyle = true // Necessário para compatibilidade
  }

  s3Client = new S3Client(config)
}
const S3_BUCKET = process.env.AWS_S3_BUCKET || ''

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
      }
    }

    if (USE_S3 && s3Client) {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: fileKey,
          Body: finalBuffer,
          ContentType: finalMimeType,
        })
      )

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
            .resize({ width: 640, withoutEnlargement: true })
            .webp({ quality: 75 })
            .toBuffer()
          const ext = path.extname(fileKey)
          const base = fileKey.slice(0, -ext.length)
          const thumbKey = `${base}_thumb.webp`
          await s3Client.send(
            new PutObjectCommand({
              Bucket: S3_BUCKET,
              Key: thumbKey,
              Body: thumbBuf,
              ContentType: 'image/webp',
            })
          )
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
 * Valida MIME type (whitelist)
 */
const ALLOWED_MIME_TYPES = [
  // Imagens
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  // Vídeos
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-flv',
  'video/webm',
  'video/x-matroska',
  // Documentos
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
]

export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType)
}

export function getMediaTypeFromMime(
  mimeType: string
): 'image' | 'video' | 'document' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  return 'document'
}
