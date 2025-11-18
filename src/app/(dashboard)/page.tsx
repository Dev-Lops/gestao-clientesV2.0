import { prisma } from '@/lib/prisma'
import { getDashboardData } from '@/modules/dashboard/actions/getDashboardData'
import { getSessionProfile } from '@/services/auth/session'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'

export const metadata: Metadata = {
  title: 'Painel de Gestão',
  description: 'Resumo operacional e financeiro da organização',
  alternates: { canonical: '/dashboard' },
}

function getCurrentMonthKey() {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${mm}`
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const session = await getSessionProfile();
  if (!session.user || !session.orgId) {
    redirect('/login');
  }
  // Se role CLIENT, redireciona para primeira associação como antes
  if (session.role === 'CLIENT') {
    const firstClient = await prisma.client.findFirst({ where: { clientUserId: session.user.id } });
    if (firstClient) redirect(`/clients/${firstClient.id}/info`);
  }
  const monthKey = params?.month || getCurrentMonthKey();
  const data = await getDashboardData(monthKey);
  return <DashboardClient initialData={data} initialMonthKey={monthKey} role={session.role} />;
}
