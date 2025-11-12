import { FinanceManagerV2 } from '@/features/clients/components'

interface ClientFinancePageProps {
  params: Promise<{ id: string }>
}

export default async function ClientFinancePage({
  params
}: ClientFinancePageProps) {
  const { id } = await params

  return <FinanceManagerV2 clientId={id} />
}
