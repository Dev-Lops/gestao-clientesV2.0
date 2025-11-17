import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL da imagem não fornecida' },
        { status: 400 }
      )
    }

    // Fetch the image from the URL
    const imageResponse = await fetch(imageUrl)

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Falha ao buscar imagem' },
        { status: 400 }
      )
    }

    // Get image as buffer
    const arrayBuffer = await imageResponse.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract colors by analyzing the image
    const image = sharp(buffer).resize(50, 50, { fit: 'cover' })
    const { data } = await image.raw().toBuffer({ resolveWithObject: true })

    // Quantize colors
    const colorMap = new Map<string, number>()

    for (let i = 0; i < data.length; i += 3) {
      const r = Math.floor(data[i] / 32) * 32
      const g = Math.floor(data[i + 1] / 32) * 32
      const b = Math.floor(data[i + 2] / 32) * 32

      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
      colorMap.set(hex, (colorMap.get(hex) || 0) + 1)
    }

    // Sort by frequency and get top 6 unique colors
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([color]) => color)
      .filter((color, index, self) => self.indexOf(color) === index)
      .slice(0, 6)

    return NextResponse.json({ colors: sortedColors })
  } catch (error) {
    console.error('Erro ao extrair cores:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao processar imagem',
      },
      { status: 500 }
    )
  }
}
