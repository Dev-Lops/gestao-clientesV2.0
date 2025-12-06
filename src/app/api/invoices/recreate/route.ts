import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const profile = await getSessionProfile()
    if (!profile || profile.role !== 'OWNER' || !profile.orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Mapeamento de clientes
    const clienteMaps: Record<string, string | null> = {
      'ZL Sushi': null,
      Isabel: null,
      alexandra: null,
      fabiana: null,
      infinix: null,
      MANU: null,
      mané: null,
      'ADV ARIANE': null,
      'MANE MINEIRA': null,
      UNIMARCAS: null,
      FABI: null,
      DISTRIBUIDORA: null,
    }

    // Dados das faturas a criar
    const invoicesToCreate = [
      // OUTUBRO
      {
        cliente: 'ZL Sushi',
        valor: 700.0,
        mes: 'Outubro/2024',
        data: '2024-10-31',
      },
      {
        cliente: 'Isabel',
        valor: 1200.0,
        mes: 'Outubro/2024',
        data: '2024-10-31',
      },
      {
        cliente: 'alexandra',
        valor: 1200.0,
        mes: 'Outubro/2024',
        data: '2024-10-31',
      },
      {
        cliente: 'fabiana',
        valor: 600.0,
        mes: 'Outubro/2024',
        data: '2024-10-31',
      },
      {
        cliente: 'infinix',
        valor: 1200.0,
        mes: 'Outubro/2024',
        data: '2024-10-31',
      },
      {
        cliente: 'MANU',
        valor: 775.0,
        mes: 'Outubro/2024 - Designer',
        data: '2024-10-31',
      },
      {
        cliente: 'mané',
        valor: 750.0,
        mes: 'Outubro/2024',
        data: '2024-10-31',
      },

      // NOVEMBRO
      {
        cliente: 'ZL Sushi',
        valor: 700.0,
        mes: 'Novembro/2024',
        data: '2024-11-30',
      },
      {
        cliente: 'Isabel',
        valor: 1200.0,
        mes: 'Novembro/2024',
        data: '2024-11-30',
      },
      {
        cliente: 'infinix',
        valor: 1200.0,
        mes: 'Novembro/2024',
        data: '2024-11-30',
      },
      {
        cliente: 'alexandra',
        valor: 1200.0,
        mes: 'Novembro/2024',
        data: '2024-11-30',
      },
      {
        cliente: 'ADV ARIANE',
        valor: 800.0,
        mes: 'Novembro/2024',
        data: '2024-11-30',
      },
      {
        cliente: 'MANU',
        valor: 600.0,
        mes: 'Novembro/2024',
        data: '2024-11-30',
      },
      {
        cliente: 'UNIMARCAS',
        valor: 882.0,
        mes: 'Novembro/2024',
        data: '2024-11-30',
      },
      {
        cliente: 'FABI',
        valor: 1200.0,
        mes: 'Novembro/2024',
        data: '2024-11-30',
      },
      {
        cliente: 'DISTRIBUIDORA',
        valor: 50.0,
        mes: 'Novembro/2024',
        data: '2024-11-30',
      },

      // DEZEMBRO
      {
        cliente: 'alexandra',
        valor: 600.0,
        mes: 'Dezembro/2024',
        data: '2024-12-31',
      },
      {
        cliente: 'MANE MINEIRA',
        valor: 750.0,
        mes: 'Dezembro/2024',
        data: '2024-12-31',
      },
    ]

    // PASSO 1: Buscar e mapear clientes
    const clientes = await prisma.client.findMany({
      where: {
        orgId: profile.orgId,
        name: {
          in: Object.keys(clienteMaps),
        },
      },
    })

    clientes.forEach((cliente) => {
      if (clienteMaps.hasOwnProperty(cliente.name)) {
        clienteMaps[cliente.name] = cliente.id
      }
    })

    const clientesNaoEncontrados = Object.entries(clienteMaps)
      .filter(([, id]) => !id)
      .map(([nome]) => nome)

    if (clientesNaoEncontrados.length > 0) {
      return NextResponse.json(
        {
          error: 'Clientes não encontrados',
          notFound: clientesNaoEncontrados,
        },
        { status: 400 }
      )
    }

    // PASSO 2: Remover faturas antigas
    await prisma.invoiceItem.deleteMany({
      where: {
        invoice: {
          orgId: profile.orgId,
        },
      },
    })

    const deletedInvoices = await prisma.invoice.deleteMany({
      where: {
        orgId: profile.orgId,
      },
    })

    // PASSO 3: Criar novas faturas
    const createdInvoices: Array<{
      cliente: string
      mes: string
      valor: number
    }> = []
    for (let i = 0; i < invoicesToCreate.length; i++) {
      const fatura = invoicesToCreate[i]
      const clienteId = clienteMaps[fatura.cliente]

      if (!clienteId) continue

      const numeroFatura = `INV-${Date.now()}-${i}`
      const dataVencimento = new Date(fatura.data)
      dataVencimento.setDate(dataVencimento.getDate() + 7)

      await prisma.invoice.create({
        data: {
          number: numeroFatura,
          clientId: clienteId,
          orgId: profile.orgId,
          issueDate: new Date(fatura.data),
          dueDate: dataVencimento,
          status: 'OPEN',
          subtotal: fatura.valor,
          discount: 0,
          tax: 0,
          total: fatura.valor,
          items: {
            create: [
              {
                description: fatura.mes,
                quantity: 1,
                unitAmount: fatura.valor,
                total: fatura.valor,
              },
            ],
          },
          notes: `Fatura de ${fatura.mes}`,
        },
      })

      createdInvoices.push({
        cliente: fatura.cliente,
        mes: fatura.mes,
        valor: fatura.valor,
      })
    }

    return NextResponse.json({
      success: true,
      deletedInvoices: deletedInvoices,
      createdInvoices: createdInvoices,
      total: createdInvoices.length,
    })
  } catch (error) {
    console.error('Erro ao recriar faturas:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao recriar faturas',
      },
      { status: 500 }
    )
  }
}
