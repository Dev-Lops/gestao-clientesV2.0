import { authenticateStaff } from '@/infrastructure/http/middlewares/auth.middleware'
import { ApiResponseHandler } from '@/infrastructure/http/response'
import {
  createPresignedPutUrl,
  generateFileKey,
  isAllowedMimeType,
} from '@/lib/storage'
import { applySecurityHeaders } from '@/proxy'
import { NextRequest } from 'next/server'
import { z } from 'zod'

const presignSchema = z.object({
  clientId: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().positive().optional(),
})

export async function POST(req: NextRequest) {
  try {
    // Autenticação e rate limiting
    const authResult = await authenticateStaff(req)
    if ('error' in authResult) {
      return applySecurityHeaders(req, authResult.error)
    }

    // Validação do body
    const body = await req.json()
    const validation = presignSchema.safeParse(body)

    if (!validation.success) {
      return applySecurityHeaders(
        req,
        ApiResponseHandler.validationError(
          'Parâmetros inválidos',
          validation.error.format()
        )
      )
    }

    const { clientId, filename, mimeType, size } = validation.data

    // Verificar MIME type permitido
    if (!isAllowedMimeType(mimeType)) {
      return applySecurityHeaders(
        req,
        ApiResponseHandler.validationError('MIME type não permitido')
      )
    }

    // Tamanho máximo configurável (GB) para upload direto do cliente; padrão 2GB
    const maxGb = Number(process.env.NEXT_PUBLIC_MAX_DIRECT_UPLOAD_GB || '2')
    const maxBytes = maxGb * 1024 * 1024 * 1024
    if (size && size > maxBytes) {
      return applySecurityHeaders(
        req,
        ApiResponseHandler.validationError(
          `Arquivo muito grande. Máximo permitido: ${maxGb}GB`
        )
      )
    }

    // Estrutura: clients/<clientId>/<uuid>_original/<filename>
    const fileKey = generateFileKey(clientId, filename)
    const originalKey = fileKey.replace(/(\.[^./]+)$/i, '_original$1')

    const uploadUrl = await createPresignedPutUrl(originalKey, mimeType, 900)
    if (!uploadUrl) {
      return applySecurityHeaders(
        req,
        ApiResponseHandler.internalError(
          'Storage S3/R2 não configurado para presigned uploads',
          'uploads:presign:storage-config'
        )
      )
    }

    const response = ApiResponseHandler.success({
      originalKey,
      uploadUrl,
      willGenerateOptimized: mimeType.startsWith('image/'),
    })

    return applySecurityHeaders(req, response)
  } catch (err) {
    return applySecurityHeaders(
      req,
      ApiResponseHandler.internalError(err, 'uploads:presign')
    )
  }
}
