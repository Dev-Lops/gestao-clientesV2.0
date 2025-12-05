/**
 * Script para limpar e recriar faturas
 *
 * IMPORTANTE: Executar com: node scripts/recreate_invoices.js
 *
 * Este script:
 * 1. Busca os IDs dos clientes pelo nome
 * 2. Remove todas as faturas existentes
 * 3. Cria novas faturas conforme especificado
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Mapeamento de clientes (nome -> buscar do banco)
const clienteMaps = {
  'ZL Sushi': null, // hudson -> ZL Sushi
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
  { cliente: 'Isabel', valor: 1200.0, mes: 'Outubro/2024', data: '2024-10-31' },
  {
    cliente: 'alexandra',
    valor: 1200.0,
    mes: 'Outubro/2024',
    data: '2024-10-31',
  },
  { cliente: 'fabiana', valor: 600.0, mes: 'Outubro/2024', data: '2024-10-31' },
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
  { cliente: 'mané', valor: 750.0, mes: 'Outubro/2024', data: '2024-10-31' },

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
  { cliente: 'MANU', valor: 600.0, mes: 'Novembro/2024', data: '2024-11-30' },
  {
    cliente: 'UNIMARCAS',
    valor: 882.0,
    mes: 'Novembro/2024',
    data: '2024-11-30',
  },
  { cliente: 'FABI', valor: 1200.0, mes: 'Novembro/2024', data: '2024-11-30' },
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

async function main() {
  try {
    console.log('🔄 Iniciando recriação de faturas...\n')

    // PASSO 1: Buscar e mapear clientes
    console.log('📋 Buscando clientes...')
    const clientes = await prisma.client.findMany({
      where: {
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

    console.log('✅ Clientes mapeados:')
    Object.entries(clienteMaps).forEach(([nome, id]) => {
      if (id) {
        console.log(`   - ${nome}: ${id}`)
      } else {
        console.log(`   - ${nome}: ⚠️  NÃO ENCONTRADO`)
      }
    })

    const clientesNaoEncontrados = Object.entries(clienteMaps)
      .filter(([_, id]) => !id)
      .map(([nome]) => nome)

    if (clientesNaoEncontrados.length > 0) {
      console.error(
        '\n❌ ERRO: Clientes não encontrados:',
        clientesNaoEncontrados
      )
      console.error(
        'Por favor, crie os clientes antes de executar este script.'
      )
      process.exit(1)
    }

    // PASSO 2: Remover faturas antigas
    console.log('\n🗑️  Removendo faturas antigas...')
    const deletedInvoiceItems = await prisma.invoiceItem.deleteMany({
      where: {
        invoice: {
          deletedAt: null,
        },
      },
    })

    const deletedInvoices = await prisma.invoice.deleteMany({
      where: {
        deletedAt: null,
      },
    })

    console.log(`✅ Removidas ${deletedInvoices.count} faturas`)
    console.log(`✅ Removidos ${deletedInvoiceItems.count} itens de faturas`)

    // PASSO 3: Criar novas faturas
    console.log('\n📝 Criando novas faturas...\n')

    for (let i = 0; i < invoicesToCreate.length; i++) {
      const fatura = invoicesToCreate[i]
      const clienteId = clienteMaps[fatura.cliente]

      if (!clienteId) {
        console.log(`⚠️  Pulando ${fatura.cliente} - cliente não encontrado`)
        continue
      }

      // Gerar número único para a fatura
      const numeroFatura = `INV-${Date.now()}-${i}`
      const dataVencimento = new Date(fatura.data)
      dataVencimento.setDate(dataVencimento.getDate() + 7) // +7 dias de prazo

      await prisma.invoice.create({
        data: {
          number: numeroFatura,
          clientId: clienteId,
          orgId: (await prisma.org.findFirst())?.id, // Usar a primeira org
          issueDate: new Date(fatura.data),
          dueDate: dataVencimento,
          status: 'OPEN',
          items: {
            create: [
              {
                description: fatura.mes,
                quantity: 1,
                unitPrice: fatura.valor,
                amount: fatura.valor,
              },
            ],
          },
          total: fatura.valor,
          notes: `Fatura de ${fatura.mes}`,
        },
      })

      console.log(
        `✅ Fatura criada: ${fatura.cliente} - ${fatura.mes} - R$ ${fatura.valor.toFixed(2)}`
      )
    }

    console.log('\n🎉 Todas as faturas foram recriadas com sucesso!')
  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
