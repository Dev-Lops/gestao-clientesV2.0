'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { parseDateInput } from '@/lib/utils'
import { ClientStatus } from '@/types/client'
import { AppClient } from '@/types/tables'
import { Edit2, Save, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface ClientInfoDisplayProps {
  client: AppClient
  canEdit: boolean
}

export function ClientInfoDisplay({ client, canEdit }: ClientInfoDisplayProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: client.name,
    email: client.email || '',
    phone: client.phone || '',
    status: client.status,
    plan: client.plan || '',
    mainChannel: client.main_channel || '',
    contractStart: client.contract_start
      ? new Date(client.contract_start).toISOString().split('T')[0]
      : '',
    contractEnd: client.contract_end
      ? new Date(client.contract_end).toISOString().split('T')[0]
      : '',
    paymentDay: client.payment_day?.toString() || '',
    contractValue: client.contract_value?.toString() || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const contractStartToSave = formData.contractStart ? parseDateInput(formData.contractStart).toISOString() : null
      const contractEndToSave = formData.contractEnd ? parseDateInput(formData.contractEnd).toISOString() : null

      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          contractStart: contractStartToSave,
          contractEnd: contractEndToSave,
          paymentDay: formData.paymentDay ? parseInt(formData.paymentDay) : null,
          contractValue: formData.contractValue ? parseFloat(formData.contractValue) : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao atualizar cliente')
      }

      toast.success('Cliente atualizado com sucesso!')
      setIsEditing(false)
      window.location.reload() // Reload to show updated data
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar cliente')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form data
    setFormData({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      status: client.status,
      plan: client.plan || '',
      mainChannel: client.main_channel || '',
      contractStart: client.contract_start
        ? new Date(client.contract_start).toISOString().split('T')[0]
        : '',
      contractEnd: client.contract_end
        ? new Date(client.contract_end).toISOString().split('T')[0]
        : '',
      paymentDay: client.payment_day?.toString() || '',
      contractValue: client.contract_value?.toString() || '',
    })
  }

  if (!isEditing) {
    return (
      <div className="relative">
        <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20" />
        <Card className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl bg-linear-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                {client.name}
              </CardTitle>
              {canEdit && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-2 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Email
                </p>
                <p className="text-sm text-slate-900 dark:text-white">
                  {client.email || 'Não informado'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Telefone
                </p>
                <p className="text-sm text-slate-900 dark:text-white">
                  {client.phone || 'Não informado'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Plano
                </p>
                <p className="text-sm text-slate-900 dark:text-white">
                  {client.plan || 'Não definido'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Canal Principal
                </p>
                <p className="text-sm text-slate-900 dark:text-white">
                  {client.main_channel || 'Não definido'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20" />
      <Card className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-2xl">Editar Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">
                Informações Básicas
              </h3>
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={loading}
                  className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={loading}
                    className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={loading}
                    className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ClientStatus })}
                    disabled={loading}
                    className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                  >
                    <option value="new">Novo</option>
                    <option value="onboarding">Em Onboarding</option>
                    <option value="active">Ativo</option>
                    <option value="paused">Pausado</option>
                    <option value="closed">Encerrado</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan">Plano</Label>
                  <Select
                    id="plan"
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                    disabled={loading}
                    className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                  >
                    <option value="">Selecione</option>
                    <option value="GESTAO">Gestão</option>
                    <option value="ESTRUTURA">Estrutura</option>
                    <option value="FREELANCER">Freelancer</option>
                    <option value="PARCERIA">Parceria</option>
                    <option value="CONSULTORIA">Consultoria</option>
                    <option value="OUTRO">Outro</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mainChannel">Canal Principal</Label>
                  <Select
                    id="mainChannel"
                    value={formData.mainChannel}
                    onChange={(e) => setFormData({ ...formData, mainChannel: e.target.value })}
                    disabled={loading}
                    className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                  >
                    <option value="">Selecione</option>
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="FACEBOOK">Facebook</option>
                    <option value="TIKTOK">TikTok</option>
                    <option value="YOUTUBE">YouTube</option>
                    <option value="LINKEDIN">LinkedIn</option>
                    <option value="TWITTER">Twitter</option>
                    <option value="OUTRO">Outro</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contract Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">
                Informações de Contrato
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contractStart">Início do Contrato</Label>
                  <Input
                    id="contractStart"
                    type="date"
                    value={formData.contractStart}
                    onChange={(e) => setFormData({ ...formData, contractStart: e.target.value })}
                    disabled={loading}
                    className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractEnd">Término do Contrato</Label>
                  <Input
                    id="contractEnd"
                    type="date"
                    value={formData.contractEnd}
                    onChange={(e) => setFormData({ ...formData, contractEnd: e.target.value })}
                    disabled={loading}
                    className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Deixe vazio para indeterminado
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="paymentDay">Dia de Pagamento</Label>
                  <Input
                    id="paymentDay"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.paymentDay}
                    onChange={(e) => setFormData({ ...formData, paymentDay: e.target.value })}
                    placeholder="Ex: 5, 10, 15..."
                    disabled={loading}
                    className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Dia do mês (1-31)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractValue">Valor Mensal (R$)</Label>
                  <Input
                    id="contractValue"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.contractValue}
                    onChange={(e) => setFormData({ ...formData, contractValue: e.target.value })}
                    placeholder="Ex: 1500.00"
                    disabled={loading}
                    className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                type="submit"
                disabled={loading}
                className="rounded-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30 gap-2"
              >
                {loading ? (
                  'Salvando...'
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="rounded-full backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
