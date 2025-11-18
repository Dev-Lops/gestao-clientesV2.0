import fs from 'fs/promises'
import { NextResponse } from 'next/server'
import path from 'path'

const LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || './uploads'

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.gif':
      return 'image/gif'
    case '.webp':
      return 'image/webp'
    case '.svg':
      return 'image/svg+xml'
    case '.mp4':
      return 'video/mp4'
    case '.webm':
      return 'video/webm'
    case '.pdf':
      return 'application/pdf'
    case '.txt':
      return 'text/plain; charset=utf-8'
    case '.csv':
      return 'text/csv; charset=utf-8'
    default:
      return 'application/octet-stream'
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params
    if (!segments || segments.length === 0) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const unsafe = segments.join('/')
    const base = path.resolve(LOCAL_UPLOAD_DIR)
    const filePath = path.resolve(base, unsafe)

    // Evitar path traversal
    if (!filePath.startsWith(base + path.sep) && filePath !== base) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Lê o arquivo (buffer) e retorna com Content-Type adequado
    const data = await fs.readFile(filePath)
    const contentType = getContentType(filePath)

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cache curto em dev; ajuste conforme necessário
        'Cache-Control': 'public, max-age=60',
      },
    })
  } catch (e) {
    return new NextResponse('Not Found', { status: 404 })
  }
}
