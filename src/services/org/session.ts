import { prisma } from '@/lib/prisma'
import { getSessionProfile } from '@/services/auth/session'

// Busca os dados da organização vinculada ao usuário logado
export async function getSessionOrg() {
  const { orgId } = await getSessionProfile()
  if (!orgId) return null

  // Busca a organização pelo orgId
  const org = await prisma.org.findUnique({
    where: { id: orgId },
    select: {
      name: true,
      cnpj: true,
      phone: true,
      website: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
      description: true,
    },
  })
  return org
}
