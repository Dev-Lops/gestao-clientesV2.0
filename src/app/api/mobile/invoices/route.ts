import { auth } from '@/lib/auth'
import {
  buildPaginatedResponse,
  getPrismaSkipTake,
  normalizePaginationParams,
  toMobileInvoice,
} from '@/lib/mobile/optimization'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/mobile/invoices
 *
 * Lightweight invoices endpoint for mobile apps
 * Response ~35% smaller than full invoice response
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - status: string (optional, e.g., 'pending', 'paid')
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get pagination params
    const searchParams = request.nextUrl.searchParams
    const page = searchParams.get('page')
      ? parseInt(searchParams.get('page') || '1')
      : 1
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit') || '20')
      : 20
    const status = searchParams.get('status') || ''

    const { page: normalizedPage, limit: normalizedLimit } =
      normalizePaginationParams(page, limit)

    // Build where clause
    const where = {
      organizationId: session.user.organizationId,
      ...(status && { status }),
    }

    // Get total count
    const total = await prisma.invoice.count({ where })

    // Get paginated data
    const { skip, take } = getPrismaSkipTake(normalizedPage, normalizedLimit)
    const invoices = await prisma.invoice.findMany({
      where,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        totalAmount: true,
        dueDate: true,
        clientId: true,
        client: {
          select: { name: true },
        },
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' as const },
    })

    // Transform to mobile format
    const mobileInvoices = invoices.map(toMobileInvoice)

    // Build response with metadata
    const response = buildPaginatedResponse(
      mobileInvoices,
      total,
      normalizedPage,
      normalizedLimit
    )

    // Set cache headers
    const headers = new Headers()
    headers.set('Cache-Control', 'public, max-age=180') // 3 minutes
    headers.set('Content-Type', 'application/json')

    return NextResponse.json(response, { headers })
  } catch (error) {
    console.error('[Mobile Invoices API]', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}
