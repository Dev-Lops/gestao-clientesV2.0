import dotenv from 'dotenv'
import { prisma } from '../src/lib/prisma'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

async function addA2MInvoice(orgId: string) {
  console.log('Procurando ou criando cliente A2M...')

  // Buscar cliente A2M
  let client = await prisma.client.findFirst({
    where: {
      orgId,
      OR: [
        { name: 'A2M' },
        { name: { contains: 'A2M', mode: 'insensitive' } },
        { name: { contains: 'distribuidora', mode: 'insensitive' } },
      ],
    },
  })

  if (!client) {
    console.log('Cliente A2M não encontrado. Criando...')
    client = await prisma.client.create({
      data: {
        name: 'A2M',
        orgId,
        status: 'active',
        paymentDay: 10,
        isInstallment: false,
        contractValue: 50,
      },
    })
    console.log('✅ Cliente A2M criado:', client.id)
  } else {
    console.log('Cliente encontrado:', client.name)
  } // Verificar se já existe fatura de novembro
  const existing = await prisma.invoice.findFirst({
    where: {
      clientId: client.id,
      orgId,
      issueDate: {
        gte: new Date(2025, 10, 1),
        lt: new Date(2025, 11, 1),
      },
    },
  })

  if (existing) {
    console.log('Fatura de novembro já existe para A2M. Pulando...')
    return
  }

  const issueDate = new Date(2025, 10, 1)
  const dueDate = new Date(2025, 10, client.paymentDay || 10)
  const subtotal = 50
  const number = `INV-202511-${client.id.slice(0, 6)}`

  const invoice = await prisma.invoice.create({
    data: {
      orgId,
      clientId: client.id,
      number,
      status: 'OPEN',
      issueDate,
      dueDate,
      subtotal,
      discount: 0,
      tax: 0,
      total: subtotal,
      currency: 'BRL',
      notes: null,
      items: {
        create: [
          {
            description: 'Mensalidade 11/2025',
            quantity: 1,
            unitAmount: subtotal,
            total: subtotal,
          },
        ],
      },
    },
  })

  console.log(
    '✅ Fatura criada:',
    invoice.number,
    'para',
    client.name,
    '| Vencimento:',
    dueDate.toLocaleDateString('pt-BR'),
    '| Valor: R$',
    subtotal
  )
}

async function main() {
  const orgId = process.argv[2] || 'cmi3s1whv0002cmpwzddysc4j'
  await addA2MInvoice(orgId)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
