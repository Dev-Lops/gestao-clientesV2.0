import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { PaymentOrchestrator } from '@/services/payments/PaymentOrchestrator'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface ParsedTransaction {
  date: Date
  description: string
  amount: number
  type: 'income' | 'expense'
  category?: string
  payerTaxId?: string
  payerName?: string
}

/**
 * Parse CSV do Nubank
 * Formato: Data,Valor,Identificador,Descrição
 * Exemplo: 27/09/2025,1.00,68d80317-6177-4bd3-979a-6d8a8bb93739,Transferência recebida...
 */
function parseNubankCSV(csvContent: string): ParsedTransaction[] {
  const lines = csvContent.split('\n').filter((line) => line.trim())
  const transactions: ParsedTransaction[] = []

  // Pular cabeçalho
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Parse CSV melhorado - suporta vírgulas dentro de aspas
    const columns: string[] = []
    let current = ''
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        columns.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    columns.push(current.trim()) // Último campo

    if (columns.length < 4) continue

    const [dateStr, valueStr, identifier, description] = columns

    // Parse data (formato DD/MM/YYYY ou YYYY-MM-DD)
    let date: Date
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/')
      if (parts.length === 3) {
        const [day, month, year] = parts
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      } else {
        continue // Data inválida
      }
    } else {
      date = new Date(dateStr)
    }

    if (isNaN(date.getTime())) continue // Pular datas inválidas

    // Parse valor - Nubank já envia no formato correto (ponto decimal)
    // Exemplo: 1.00, -250.00, 600.00
    const parsedValue = parseFloat(valueStr.trim())
    if (isNaN(parsedValue)) continue // Pular valores inválidos

    const amount = Math.abs(parsedValue)

    // Determinar tipo pelo sinal: positivo = receita, negativo = despesa
    const type: 'income' | 'expense' = parsedValue >= 0 ? 'income' : 'expense'

    // Tentar extrair CPF/CNPJ da descrição
    const taxIdMatch = description.match(
      /\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/
    )
    const payerTaxId = taxIdMatch ? taxIdMatch[0].replace(/\D/g, '') : undefined

    transactions.push({
      date,
      description,
      amount,
      type,
      payerTaxId,
      payerName: description.split('-')[0]?.trim(),
    })
  }

  return transactions
}

/**
 * Buscar cliente pelo CPF/CNPJ ou descrição
 */
async function findClient(orgId: string, transaction: ParsedTransaction) {
  // Buscar por CPF/CNPJ exato
  if (transaction.payerTaxId) {
    const client = await prisma.client.findFirst({
      where: {
        orgId,
        OR: [{ cpf: transaction.payerTaxId }, { cnpj: transaction.payerTaxId }],
      },
    })
    if (client) return client
  }

  // Buscar por nome (fuzzy)
  if (transaction.payerName) {
    const client = await prisma.client.findFirst({
      where: {
        orgId,
        name: { contains: transaction.payerName, mode: 'insensitive' },
      },
    })
    if (client) return client
  }

  return null
}

/**
 * Categorizar despesa automaticamente baseado em palavras-chave
 */
function categorizarDespesa(
  description: string,
  originalCategory?: string
): string {
  const desc = description.toLowerCase()

  // Priorizar categoria original se existir
  if (originalCategory && originalCategory !== 'outros') {
    return originalCategory
  }

  // Categorias de infraestrutura e ferramentas
  if (
    desc.includes('aws') ||
    desc.includes('google cloud') ||
    desc.includes('azure') ||
    desc.includes('heroku') ||
    desc.includes('vercel') ||
    desc.includes('netlify')
  ) {
    return 'Infraestrutura/Cloud'
  }

  // Software e serviços
  if (
    desc.includes('github') ||
    desc.includes('notion') ||
    desc.includes('figma') ||
    desc.includes('adobe') ||
    desc.includes('microsoft') ||
    desc.includes('google workspace') ||
    desc.includes('slack')
  ) {
    return 'Software/Assinaturas'
  }

  // Marketing e publicidade
  if (
    desc.includes('facebook ads') ||
    desc.includes('google ads') ||
    desc.includes('instagram') ||
    desc.includes('publicidade') ||
    desc.includes('marketing')
  ) {
    return 'Marketing'
  }

  // Fornecedores e freelancers
  if (
    desc.includes('freelancer') ||
    desc.includes('prestador') ||
    desc.includes('fornecedor') ||
    desc.includes('serviço')
  ) {
    return 'Fornecedores'
  }

  // Taxas e impostos
  if (
    desc.includes('taxa') ||
    desc.includes('tarifa') ||
    desc.includes('imposto') ||
    desc.includes('tributo') ||
    desc.includes('inss') ||
    desc.includes('darf')
  ) {
    return 'Taxas/Impostos'
  }

  // Salários e folha
  if (
    desc.includes('salário') ||
    desc.includes('salario') ||
    desc.includes('folha') ||
    desc.includes('pró-labore') ||
    desc.includes('pro labore')
  ) {
    return 'Folha de Pagamento'
  }

  // Escritório e utilidades
  if (
    desc.includes('aluguel') ||
    desc.includes('energia') ||
    desc.includes('água') ||
    desc.includes('agua') ||
    desc.includes('internet') ||
    desc.includes('telefone')
  ) {
    return 'Escritório/Utilidades'
  }

  // Equipamentos
  if (
    desc.includes('equipamento') ||
    desc.includes('computador') ||
    desc.includes('notebook') ||
    desc.includes('mouse') ||
    desc.includes('teclado')
  ) {
    return 'Equipamentos'
  }

  return 'Outras Despesas'
}

/**
 * POST /api/billing/import-csv
 * Importar extrato CSV do banco
 */
export async function POST(request: NextRequest) {
  try {
    const { orgId, role } = await getSessionProfile()
    if (!orgId || role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const csvContent = await file.text()
    const transactions = parseNubankCSV(csvContent)

    const results = {
      total: transactions.length,
      incomes: {
        reconciled: 0,
        imported: 0,
        skipped: 0,
      },
      expenses: {
        imported: 0,
        skipped: 0,
      },
      errors: [] as string[],
    }

    for (const transaction of transactions) {
      try {
        // PROCESSAR RECEITAS (ENTRADAS)
        if (transaction.type === 'income') {
          const client = await findClient(orgId, transaction)

          // Verificação de duplicata ROBUSTA para receitas
          // Considera: mesmo cliente (ou sem cliente), mesma data, mesmo valor
          const duplicateIncome = await prisma.finance.findFirst({
            where: {
              orgId,
              type: 'income',
              date: transaction.date,
              amount: transaction.amount,
              clientId: client?.id || null,
            },
          })

          if (duplicateIncome) {
            results.incomes.skipped++
            continue
          }

          if (client) {
            // Buscar fatura em aberto com valor compatível
            const tolerance = 0.01
            const invoice = await prisma.invoice.findFirst({
              where: {
                clientId: client.id,
                status: { in: ['OPEN', 'OVERDUE'] },
                total: {
                  gte: transaction.amount - tolerance,
                  lte: transaction.amount + tolerance,
                },
              },
              orderBy: { dueDate: 'asc' },
            })

            if (invoice) {
              // VERIFICAR SE FATURA JÁ FOI PAGA (evitar duplicar pagamento)
              const existingPayment = await prisma.payment.findFirst({
                where: {
                  invoiceId: invoice.id,
                  amount: transaction.amount,
                  paidAt: transaction.date,
                },
              })

              if (existingPayment) {
                // Fatura já paga com mesmo valor e data - duplicata
                results.incomes.skipped++
                continue
              }

              // Registrar pagamento via orchestrator
              await PaymentOrchestrator.recordInvoicePayment({
                orgId,
                clientId: client.id,
                invoiceId: invoice.id,
                amount: transaction.amount,
                method: 'pix',
                paidAt: transaction.date,
                description: transaction.description,
              })

              // Adicionar metadata ao finance criado
              const financeRecord = await prisma.finance.findFirst({
                where: {
                  orgId,
                  clientId: client.id,
                  invoiceId: invoice.id,
                  amount: transaction.amount,
                },
                orderBy: { createdAt: 'desc' },
              })

              if (financeRecord) {
                await prisma.finance.update({
                  where: { id: financeRecord.id },
                  data: {
                    metadata: {
                      source: 'csv_import',
                      originalDescription: transaction.description,
                      category: transaction.category,
                    },
                  },
                })
              }

              results.incomes.reconciled++
            } else {
              // Registrar como receita avulsa (sem fatura vinculada)
              await prisma.finance.create({
                data: {
                  orgId,
                  clientId: client.id,
                  type: 'income',
                  amount: transaction.amount,
                  description: transaction.description,
                  category: transaction.category || 'Pix - CSV Import',
                  date: transaction.date,
                  metadata: {
                    source: 'csv_import',
                    category: transaction.category,
                  },
                },
              })
              results.incomes.imported++
            }
          } else {
            // Cliente não identificado - registrar como receita genérica
            await prisma.finance.create({
              data: {
                orgId,
                type: 'income',
                amount: transaction.amount,
                description: transaction.description,
                category:
                  transaction.category || 'Não identificado - CSV Import',
                date: transaction.date,
                metadata: {
                  source: 'csv_import',
                  needsReview: true,
                },
              },
            })
            results.incomes.imported++
          }
        }
        // PROCESSAR DESPESAS (SAÍDAS)
        else {
          // Verificação de duplicata para despesas
          // Considera: mesma data, mesmo valor, mesma descrição (50 chars)
          const duplicateExpense = await prisma.finance.findFirst({
            where: {
              orgId,
              type: 'expense',
              date: transaction.date,
              amount: transaction.amount,
              description: {
                contains: transaction.description.substring(0, 50),
              },
            },
          })

          if (duplicateExpense) {
            results.expenses.skipped++
            continue
          }

          // Categorização automática baseada na descrição
          const category = categorizarDespesa(
            transaction.description,
            transaction.category
          )

          await prisma.finance.create({
            data: {
              orgId,
              type: 'expense',
              amount: transaction.amount,
              description: transaction.description,
              category,
              date: transaction.date,
              metadata: {
                source: 'csv_import',
                originalCategory: transaction.category,
              },
            },
          })
          results.expenses.imported++
        }
      } catch (error) {
        console.error('Error importing transaction:', error)
        results.errors.push(
          `${transaction.date.toISOString()}: ${transaction.description} - ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error importing CSV:', error)
    return NextResponse.json({ error: 'Failed to import CSV' }, { status: 500 })
  }
}
