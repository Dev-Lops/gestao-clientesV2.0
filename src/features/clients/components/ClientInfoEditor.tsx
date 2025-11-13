'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Select } from '@/components/ui/select'
import { AppClient } from '@/types/tables'
import { Edit, Save, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

interface ClientInfoEditorProps {
  client: AppClient
  canEdit: boolean
}

export function ClientInfoEditor({ client, canEdit }: ClientInfoEditorProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  function onlyDigits(v: string) {
    return v.replace(/\D+/g, '')
  }
  function formatPhoneBR(v: string) {
    const digits = onlyDigits(v).slice(0, 11)
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 14)
    }
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15)
  }
  const [formData, setFormData] = useState({
    name: client.name || '',
    email: client.email || '',
    phone: client.phone || '',
    status: client.status || 'new',
    plan: client.plan || '',
    main_channel: client.main_channel || '',
  })
  const [display, setDisplay] = useState({
    phone: formatPhoneBR(client.phone || ''),
  })

  function validateForm() {
    const errs: Record<string, string> = {}
    if (!formData.name.trim()) errs.name = 'Nome é obrigatório'
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Email inválido'
    }
    const phoneDigits = onlyDigits(display.phone)
    if (phoneDigits && phoneDigits.length < 10) errs.phone = 'Telefone incompleto'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFieldErrors({})

    try {
      if (!validateForm()) {
        setLoading(false)
        return
      }
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phone: formData.phone, // already digits-only while typing
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao atualizar cliente')
      }

      toast.success('Cliente atualizado com sucesso!')
      setIsEditing(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar cliente')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      status: client.status || 'new',
      plan: client.plan || '',
      main_channel: client.main_channel || '',
    })
    setDisplay({ phone: formatPhoneBR(client.phone || '') })
    setIsEditing(false)
  }

  return (
    <Card className="relative overflow-hidden border-2 border-slate-200/60 shadow-xl shadow-slate-200/50">
      {/* Gradient background effect */}
      <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-blue-600 via-purple-600 to-blue-600 bg-size-[200%_100%] animate-gradient" />

      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold bg-linear-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Informações Básicas
          </CardTitle>
          {canEdit && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  required
                  aria-invalid={!!fieldErrors.name}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do cliente"
                  disabled={loading}
                  className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${fieldErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-red-600">{fieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  aria-invalid={!!fieldErrors.email}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  disabled={loading}
                  className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                  Telefone
                </Label>
                <Input
                  id="phone"
                  type="text"
                  aria-invalid={!!fieldErrors.phone}
                  value={display.phone}
                  onChange={(e) => {
                    const masked = formatPhoneBR(e.target.value)
                    setDisplay((d) => ({ ...d, phone: masked }))
                    setFormData((f) => ({ ...f, phone: onlyDigits(masked) }))
                  }}
                  placeholder="(11) 99999-9999"
                  disabled={loading}
                  className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${fieldErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {fieldErrors.phone && (
                  <p className="text-xs text-red-600">{fieldErrors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-slate-700">
                  Status
                </Label>
                <Select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'new' | 'onboarding' | 'active' | 'paused' | 'closed' })}
                  disabled={loading}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="new">Novo</option>
                  <option value="onboarding">Em Onboarding</option>
                  <option value="active">Ativo</option>
                  <option value="paused">Pausado</option>
                  <option value="closed">Encerrado</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan" className="text-sm font-medium text-slate-700">
                  Plano
                </Label>
                <Input
                  id="plan"
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  placeholder="Ex: Starter, Pro, Premium"
                  disabled={loading}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="main_channel" className="text-sm font-medium text-slate-700">
                  Canal Principal
                </Label>
                <Input
                  id="main_channel"
                  value={formData.main_channel}
                  onChange={(e) => setFormData({ ...formData, main_channel: e.target.value })}
                  placeholder="Ex: Instagram, TikTok, YouTube"
                  disabled={loading}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={loading}
                className="gap-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30"
              >
                {loading && <LoadingSpinner size="sm" />}
                <Save className="h-4 w-4" />
                Salvar Alterações
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="gap-2 border-slate-300 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nome</p>
              <p className="text-base font-semibold text-slate-900">{client.name || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email</p>
              <p className="text-base text-slate-700">{client.email || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Telefone</p>
              <p className="text-base text-slate-700">{client.phone || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</p>
              <p className="text-base text-slate-700 capitalize">{client.status || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Plano</p>
              <p className="text-base text-slate-700">{client.plan || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Canal Principal</p>
              <p className="text-base text-slate-700">{client.main_channel || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Criado em</p>
              <p className="text-base text-slate-700">
                {new Date(client.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
