import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/clients/v2/:id - Buscar cliente específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return NextResponse.json(
    { error: `Endpoint ainda não implementado para o cliente ${id}` },
    { status: 501 }
  )
}

/**
 * PUT /api/clients/v2/:id - Atualizar cliente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return NextResponse.json(
    { error: `Endpoint ainda não implementado para o cliente ${id}` },
    { status: 501 }
  )
}

/**
 * DELETE /api/clients/v2/:id - Deletar cliente
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return NextResponse.json(
    { error: `Endpoint ainda não implementado para o cliente ${id}` },
    { status: 501 }
  )
}
