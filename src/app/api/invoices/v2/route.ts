import { InvoiceController } from '@/infrastructure/http/controllers/invoice.controller'
import { NextRequest } from 'next/server'

const controller = new InvoiceController()

/**
 * POST /api/invoices/v2 - Criar nova fatura
 */
export async function POST(request: NextRequest) {
  return controller.create(request)
}

/**
 * GET /api/invoices/v2 - Listar faturas
 */
export async function GET(request: NextRequest) {
  return controller.list(request)
}
