import { InvoiceController } from '@/infrastructure/http/controllers/invoice.controller'
import { NextRequest } from 'next/server'

const controller = new InvoiceController()

/**
 * POST /api/invoices/v2/:id/pay - Marcar fatura como paga
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return controller.pay(request, params.id)
}
