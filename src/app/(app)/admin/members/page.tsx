'use client'

import { activateMemberAction, cancelInviteAction, deactivateMemberAction, deleteInviteAction, inviteStaffAction, resendInviteAction } from '@/app/(app)/admin/members/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DeleteMemberButton } from '@/features/admin/components/DeleteMemberButton'
import { UpdateRoleForm } from '@/features/admin/components/UpdateRoleForm'
import { Clock, Copy, Link as LinkIcon, Mail, RefreshCcw, Shield, Trash2, User, UserPlus, Users, XCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

// 🔹 Mapas de papéis
type Role = 'OWNER' | 'STAFF' | 'CLIENT'

const ROLE_LABEL: Record<Role, string> = {
  OWNER: 'Proprietário',
  STAFF: 'Equipe',
  CLIENT: 'Cliente',
}

const ROLE_DESCRIPTION: Record<Role, string> = {
  OWNER: 'Acesso total e gestão de permissões',
  STAFF: 'Pode gerenciar clientes e tarefas',
  CLIENT: 'Acesso restrito à própria área',
}

// 🔹 Fetcher para SWR
const fetcher = (url: string) => fetch(url).then((r) => r.json())
const invitesFetcher = (url: string) => fetch(url).then((r) => r.json())
const clientsFetcher = (url: string) => fetch(url).then((r) => r.json())

// 🔹 Tipagem do membro
type Member = {
  id: string
  user_id: string | null
  role: string | null
  status: string | null
  full_name?: string | null
  email?: string | null
  created_at: string | null
  org_id?: string | null
  last_active_at?: string | null
  online?: boolean
}

// 🔹 Utilitário de data
function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-BR')
}

export default function MembersAdminPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/members', fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  })
  const { data: invitesData, mutate: mutateInvites } = useSWR('/api/invites', invitesFetcher)
  const { data: clientsData } = useSWR('/api/clients?lite=1', clientsFetcher)
  const [selectedRole, setSelectedRole] = useState<Role>('STAFF')
  const [selectedClient, setSelectedClient] = useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)

  // 🕒 Carregamento elegante
  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500">
        <Clock className="h-6 w-6 mb-3 animate-spin" />
        Carregando informações...
      </div>
    )

  // 🧨 Erro de carregamento
  if (error || !data?.data)
    return (
      <div className="p-10 text-center text-red-600 font-medium">
        Erro ao carregar membros.
      </div>
    )

  const members: Member[] = data.data
  const totalByRole = members.reduce<Record<Role, number>>(
    (acc, member) => {
      const role = (member.role as Role) || 'CLIENT'
      acc[role] = (acc[role] || 0) + 1
      return acc
    },
    { OWNER: 0, STAFF: 0, CLIENT: 0 }
  )

  // 🔹 Envio de convites
  async function handleInvite(formData: FormData) {
    setSubmitting(true)
    try {
      const result = (await inviteStaffAction(formData)) as
        | { ok: true; reusedToken: boolean; emailSent: boolean }
        | undefined

      if (result && 'ok' in result) {
        if (result.reusedToken) {
          toast.success(
            result.emailSent
              ? 'Convite pendente encontrado: e-mail reenviado!'
              : 'Convite pendente encontrado: não foi possível reenviar e-mail'
          )
        } else {
          toast.success(
            result.emailSent
              ? 'Convite criado e e-mail enviado!'
              : 'Convite criado, mas não foi possível enviar e-mail'
          )
        }
      } else {
        toast.success('Convite processado.')
      }
      mutateInvites()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar convite.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancelInvite(inviteId: string) {
    try {
      if (!window.confirm('Cancelar este convite?')) return
      const fd = new FormData()
      fd.append('invite_id', inviteId)
      await cancelInviteAction(fd)
      toast.success('Convite cancelado')
      mutateInvites()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao cancelar convite')
    }
  }

  async function handleDeleteInvite(inviteId: string) {
    try {
      if (!window.confirm('Excluir este convite permanentemente?')) return
      const fd = new FormData()
      fd.append('invite_id', inviteId)
      await deleteInviteAction(fd)
      toast.success('Convite excluído')
      mutateInvites()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir convite')
    }
  }

  async function handleResendInvite(inviteId: string) {
    try {
      setResendingId(inviteId)
      const fd = new FormData()
      fd.append('invite_id', inviteId)
      await resendInviteAction(fd)
      toast.success('Convite reenviado')
      mutateInvites()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao reenviar convite')
    } finally {
      setResendingId(null)
    }
  }

  async function toggleMemberActive(memberId: string, currentStatus: string | null) {
    try {
      const fd = new FormData()
      fd.append('member_id', memberId)
      if (currentStatus === 'inactive') {
        await activateMemberAction(fd)
        toast.success('Membro ativado')
      } else {
        if (!window.confirm('Desativar este membro? Ele perderá o acesso.')) return
        await deactivateMemberAction(fd)
        toast.success('Membro desativado')
      }
      mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao atualizar status')
    }
  }

  function RoleBadge({ role }: { role: Role }) {
    const styles =
      role === 'OWNER'
        ? 'bg-violet-50 text-violet-700 border-violet-200'
        : role === 'STAFF'
          ? 'bg-sky-50 text-sky-700 border-sky-200'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${styles}`}>
        {ROLE_LABEL[role]}
      </span>
    )
  }

  function MemberStatusBadge({ status }: { status: string | null }) {
    const active = status !== 'inactive'
    const styles = active
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-slate-100 text-slate-600 border-slate-200'
    return (
      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles}`}>
        {active ? 'Ativo' : 'Inativo'}
      </span>
    )
  }

  function OnlineIndicator({ online, lastActive }: { online?: boolean; lastActive?: string | null }) {
    const ts = lastActive ? new Date(lastActive) : null
    const rel = ts ? new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' }) : null
    let label = ''
    if (online) {
      label = 'Online'
    } else if (ts) {
      const diffMs = Date.now() - ts.getTime()
      const diffMin = Math.round(diffMs / 60000)
      if (diffMin < 60) label = `Visto há ${diffMin} min`
      else {
        const diffHr = Math.round(diffMin / 60)
        label = `Visto há ${diffHr} h`
      }
    } else {
      label = 'Nunca visto'
    }
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${online ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${online ? 'bg-green-500' : 'bg-slate-400'}`} />
        {label}
      </span>
    )
  }

  function InviteStatusBadge({ status }: { status: string }) {
    const styles =
      status === 'PENDING'
        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
        : status === 'ACCEPTED'
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : status === 'CANCELED'
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-rose-50 text-rose-700 border-rose-200'
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium ${styles}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 🎯 Cabeçalho com Título e Descrição */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-linear-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent">
                Gerenciar Membros
              </h1>
              <p className="text-slate-600">
                Convide e gerencie membros da sua organização com controle total de permissões
              </p>
            </div>
            <Users className="h-12 w-12 text-indigo-200" />
          </div>
        </div>

        {/* 📊 RESUMO DE ROLES - Grid Responsivo */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(['OWNER', 'STAFF', 'CLIENT'] as Role[]).map((roleKey) => {
            const Icon =
              roleKey === 'OWNER' ? Shield : roleKey === 'STAFF' ? Users : User
            const count = totalByRole[roleKey]
            const colors = {
              OWNER: 'from-violet-500 to-purple-600',
              STAFF: 'from-sky-500 to-blue-600',
              CLIENT: 'from-emerald-500 to-green-600',
            }
            const bgColors = {
              OWNER: 'bg-linear-to-br from-violet-50 to-purple-50',
              STAFF: 'bg-linear-to-br from-sky-50 to-blue-50',
              CLIENT: 'bg-linear-to-br from-emerald-50 to-green-50',
            }
            return (
              <Card
                key={roleKey}
                className={`rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group ${bgColors[roleKey]}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-linear-to-r ${colors[roleKey]} shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-white/80 px-3 py-1 rounded-full">
                      {ROLE_LABEL[roleKey]}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-4xl font-bold text-slate-900">
                      {count}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {ROLE_DESCRIPTION[roleKey]}
                    </p>
                  </div>
                </div>
                <div className={`h-1 w-full bg-linear-to-r ${colors[roleKey]} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
              </Card>
            )
          })}
        </div>

        {/* 📨 CONVITE - Card Melhorado */}
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="border-b border-slate-100 px-8 py-6 bg-linear-to-r from-indigo-50 via-purple-50 to-pink-50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-indigo-600">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Convidar novo membro
              </h2>
            </div>
            <p className="text-sm text-slate-600 ml-12">
              Envie um convite por e-mail para liberar acesso como cliente ou membro da equipe.
            </p>
          </div>

          <form action={handleInvite} className="p-8">
            <input type="hidden" name="allow_resend_existing" value="true" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
              <div className="space-y-2">
                <Label htmlFor="invite-email" className="text-sm font-medium text-slate-700">
                  E-mail do convidado
                </Label>
                <Input
                  id="invite-email"
                  name="email"
                  type="email"
                  required
                  placeholder="pessoa@empresa.com"
                  autoComplete="email"
                  inputMode="email"
                  pattern="[^\s@]+@[^\s@]+\.[^\s@]{2,}"
                  className="h-11 border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-role" className="text-sm font-medium text-slate-700">
                  Papel na organização
                </Label>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => {
                    setSelectedRole(value as Role)
                    setSelectedClient(undefined)
                  }}
                  defaultValue="STAFF"
                >
                  <SelectTrigger className="h-11 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STAFF">Equipe</SelectItem>
                    <SelectItem value="CLIENT">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedRole === 'CLIENT' && (
                <div className="space-y-2">
                  <Label htmlFor="invite-client" className="text-sm font-medium text-slate-700">
                    Vincular a cliente
                  </Label>
                  <Select
                    value={selectedClient ?? '__AUTO__'}
                    onValueChange={(value) => setSelectedClient(value === '__AUTO__' ? undefined : value)}
                  >
                    <SelectTrigger className="h-11 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__AUTO__">Criar novo cliente automaticamente</SelectItem>
                      {clientsData?.data?.map((client: { id: string; name: string }) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8 h-11 gap-2 shadow-lg"
                aria-busy={submitting}
                aria-disabled={submitting}
              >
                {submitting ? (
                  <>
                    <RefreshCcw className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Enviar convite
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
        {/* 👥 LISTA DE MEMBROS - Grid Melhorado */}
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6 bg-linear-to-r from-blue-50 via-cyan-50 to-teal-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Membros da organização
              </h2>
            </div>
            <Badge
              variant="secondary"
              className="rounded-full px-4 py-1.5 text-sm font-semibold bg-blue-100 text-blue-700"
            >
              {members.length} membro(s)
            </Badge>
          </div>

          {members.length === 0 ? (
            <div className="px-8 py-16 text-center">
              <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Nenhum membro cadastrado até o momento.</p>
              <p className="text-sm text-slate-400 mt-2">Envie convites usando o formulário acima</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-8 py-6 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-base font-semibold text-slate-900">
                        {m.full_name || m.email?.split('@')[0] || 'Usuário'}
                      </p>
                      <RoleBadge role={(m.role as Role) || 'CLIENT'} />
                      <MemberStatusBadge status={m.status} />
                      <OnlineIndicator online={m.online} lastActive={m.last_active_at} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{m.email || '—'}</span>
                      <span className="text-slate-300">•</span>
                      <Clock className="h-3.5 w-3.5" />
                      <span>Desde {formatDate(m.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <UpdateRoleForm
                      memberId={m.id}
                      currentRole={m.role || 'CLIENT'}
                      onSuccess={() => mutate()}
                    />

                    <Button
                      size="sm"
                      variant={m.status === 'inactive' ? 'default' : 'outline'}
                      onClick={() => toggleMemberActive(m.id, m.status)}
                      className={`rounded-lg ${m.status === 'inactive' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    >
                      {m.status === 'inactive' ? 'Ativar' : 'Desativar'}
                    </Button>

                    {m.role !== 'OWNER' && (
                      <DeleteMemberButton
                        memberId={m.id}
                        displayName={m.full_name || m.email || 'Usuário'}
                        onSuccess={() => mutate()}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ✉️ CONVITES PENDENTES - Grid Melhorado */}
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6 bg-linear-to-r from-amber-50 via-orange-50 to-yellow-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-600">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Convites pendentes
              </h2>
            </div>
            <Badge
              variant="secondary"
              className="rounded-full px-4 py-1.5 text-sm font-semibold bg-amber-100 text-amber-700"
            >
              {invitesData?.data?.length || 0}
            </Badge>
          </div>

          {!invitesData?.data?.length ? (
            <div className="px-8 py-16 text-center">
              <Mail className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Nenhum convite pendente.</p>
              <p className="text-sm text-slate-400 mt-2">Todos os convites foram aceitos ou expirados</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {invitesData.data.map((invite: { id: string; email: string; roleRequested: string; status: string; expiresAt: string; token: string }) => (
                <div
                  key={invite.id}
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-8 py-6 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-base font-semibold text-slate-900">{invite.email}</p>
                      <RoleBadge role={(invite.roleRequested as Role) || 'CLIENT'} />
                      <InviteStatusBadge status={invite.status} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Expira em {formatDate(invite.expiresAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {invite.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendInvite(invite.id)}
                          disabled={resendingId === invite.id}
                          className="rounded-lg"
                        >
                          {resendingId === invite.id ? (
                            <>
                              <RefreshCcw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                              Reenviando...
                            </>
                          ) : (
                            <>
                              <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
                              Reenviar
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelInvite(invite.id)}
                          className="rounded-lg gap-1.5"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Cancelar
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteInvite(invite.id)}
                      className="rounded-lg gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </Button>
                    <a
                      href={`/invite/${invite.token}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      Abrir link
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const url = `${window.location.origin}/invite/${invite.token}`
                          await navigator.clipboard.writeText(url)
                          toast.success('Link copiado')
                        } catch {
                          toast.error('Não foi possível copiar o link')
                        }
                      }}
                      className="rounded-lg gap-1.5"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copiar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
