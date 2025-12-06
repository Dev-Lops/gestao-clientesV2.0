import { prisma } from '@/lib/prisma'
import { clientSchema } from '@/lib/validations'
import { getSessionProfile } from '@/services/auth/session'
import { ClientStatus } from '@/types/enums'
import type { ClientPlan, SocialChannel } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, orgId, role } = await getSessionProfile()

    if (!user || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Only OWNER can update clients
    if (role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Sem permissão para editar clientes' },
        { status: 403 }
      )
    }

    const { id: clientId } = await params

    // Verify client belongs to org
    const existingClient = await prisma.client.findFirst({
      where: { id: clientId, orgId },
    })

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    const body = await req.json()

    // Validate with Zod (partial schema for updates)
    const validated = clientSchema.partial().parse(body)

    // Verificar se mudou para modo parcelado ou se atualizou info de parcelas
    const changedToInstallment =
      validated.isInstallment === true && !existingClient.isInstallment
    const updatedInstallmentInfo =
      existingClient.isInstallment &&
      (validated.installmentCount !== undefined ||
        validated.installmentValue !== undefined ||
        validated.installmentPaymentDays !== undefined)

    // Update client
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        name: validated.name,
        email: validated.email ?? undefined,
        phone: validated.phone ?? null,
        status: validated.status as ClientStatus | undefined,
        plan: validated.plan ? (validated.plan as ClientPlan) : null,
        mainChannel: validated.mainChannel
          ? (validated.mainChannel as SocialChannel)
          : null,
        contractStart: validated.contractStart ?? undefined,
        contractEnd: validated.contractEnd ?? undefined,
        paymentDay: validated.paymentDay ?? undefined,
        contractValue: validated.contractValue ?? undefined,
        isInstallment: validated.isInstallment ?? undefined,
        installmentCount: validated.installmentCount ?? undefined,
        installmentValue: validated.installmentValue ?? undefined,
        installmentPaymentDays: validated.installmentPaymentDays ?? undefined,
      },
    })

    // Recriar parcelas se mudou para parcelado ou atualizou info de parcelas
    if (
      (changedToInstallment || updatedInstallmentInfo) &&
      updatedClient.isInstallment
    ) {
      const installmentCount =
        validated.installmentCount ?? updatedClient.installmentCount
      const contractValue =
        validated.contractValue ?? updatedClient.contractValue
      const contractStart =
        validated.contractStart ?? updatedClient.contractStart
      const installmentValue =
        validated.installmentValue ?? updatedClient.installmentValue

      if (installmentCount && contractValue && contractStart) {
        // Deletar parcelas antigas
        await prisma.installment.deleteMany({
          where: { clientId: updatedClient.id },
        })

        // Calcular valor de cada parcela
        const amount = installmentValue || contractValue / installmentCount
        const startDate = new Date(contractStart)
        const installmentPaymentDays =
          validated.installmentPaymentDays ??
          updatedClient.installmentPaymentDays ??
          []

        // Se não há dias específicos, usar o paymentDay padrão ou dia do contrato
        const daysToUse =
          installmentPaymentDays.length > 0
            ? installmentPaymentDays
            : [updatedClient.paymentDay || startDate.getDate()]

        type InstallmentData = {
          clientId: string
          number: number
          amount: number
          dueDate: Date
          status: 'PENDING'
        }
        const installmentsToCreate: InstallmentData[] = []
        let installmentNumber = 1
        const currentDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          1,
          12
        )

        while (installmentNumber <= installmentCount) {
          for (const day of daysToUse) {
            if (installmentNumber > installmentCount) break

            const year = currentDate.getFullYear()
            const monthIndex = currentDate.getMonth()
            // Último dia do mês
            const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate()
            const safeDay = Math.min(day, lastDayOfMonth)
            const dueDate = new Date(year, monthIndex, safeDay, 12)

            // Primeira parcela: se anterior ao contractStart, pula
            if (installmentNumber === 1 && dueDate < startDate) {
              continue
            }

            installmentsToCreate.push({
              clientId: updatedClient.id,
              number: installmentNumber,
              amount: amount,
              dueDate: dueDate,
              status: 'PENDING' as const,
            })

            installmentNumber++
          }

          // Avançar para o próximo mês
          currentDate.setMonth(currentDate.getMonth() + 1)
        }

        // Criar todas as parcelas no banco de dados
        if (installmentsToCreate.length > 0) {
          await prisma.installment.createMany({
            data: installmentsToCreate,
          })
        }
      }
    }

    return NextResponse.json(updatedClient)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Erro ao atualizar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar cliente' },
      { status: 500 }
    )
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, orgId } = await getSessionProfile()

    if (!user || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: clientId } = await params

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        orgId,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar cliente' },
      { status: 500 }
    )
  }
}
