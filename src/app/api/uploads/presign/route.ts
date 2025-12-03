import {
  createPresignedPutUrl,
  generateFileKey,
  isAllowedMimeType,
} from '@/lib/storage'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { clientId, filename, mimeType, size } = await req.json()
    if (!clientId || !filename || !mimeType) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos' },
        { status: 400 }
      )
    }
    if (!isAllowedMimeType(mimeType)) {
      return NextResponse.json(
        { error: 'MIME type não permitido' },
        { status: 415 }
      )
    }
    // Tamanho máximo configurável (GB) para upload direto do cliente; padrão 2GB
    const maxGb = Number(process.env.NEXT_PUBLIC_MAX_DIRECT_UPLOAD_GB || '2')
    const maxBytes = maxGb * 1024 * 1024 * 1024
    if (typeof size === 'number' && size > maxBytes) {
      return NextResponse.json(
        { error: 'Arquivo muito grande' },
        { status: 413 }
      )
    }

    // Estrutura: clients/<clientId>/<uuid>_original/<filename>
    const fileKey = generateFileKey(clientId, filename)
    const originalKey = fileKey.replace(/(\.[^./]+)$/i, '_original$1')

    const uploadUrl = await createPresignedPutUrl(originalKey, mimeType, 900)
    if (!uploadUrl) {
      return NextResponse.json(
        { error: 'Storage S3/R2 não configurado para presigned uploads' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      originalKey,
      uploadUrl,
      // dica para front renderizar preview após finalize
      willGenerateOptimized: mimeType.startsWith('image/'),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
