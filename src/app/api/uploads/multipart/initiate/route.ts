import { generateFileKey } from '@/lib/storage'
import { CreateMultipartUploadCommand, S3Client } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'

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
    if (!s3)
      return NextResponse.json({ error: 'S3 não configurado' }, { status: 500 })
    const { clientId, filename, mimeType } = await req.json()
    if (!clientId || !filename || !mimeType)
      return NextResponse.json(
        { error: 'Parâmetros inválidos' },
        { status: 400 }
      )

    const key = generateFileKey(clientId, filename).replace(
      /(\.[^./]+)$/i,
      '_original$1'
    )
    const cmd = new CreateMultipartUploadCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: mimeType,
    })
    const out = await s3.send(cmd)
    if (!out.UploadId) throw new Error('Falha ao iniciar multipart upload')
    return NextResponse.json({ uploadId: out.UploadId, originalKey: key })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
