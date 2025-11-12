'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Select } from '@/components/ui/select'
import { parseDateInput } from '@/lib/utils'
import { ArrowLeft, Save, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'new',
    plan: '',
    mainChannel: '',
    contractStart: '',
    contractEnd: '',
    paymentDay: '',
    contractValue: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const contractStartToSave = formData.contractStart ? parseDateInput(formData.contractStart).toISOString() : null
      const contractEndToSave = formData.contractEnd ? parseDateInput(formData.contractEnd).toISOString() : null

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          contractStart: contractStartToSave,
          contractEnd: contractEndToSave,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao criar cliente')
      }

      router.push('/clients')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
      </div>

      <div className="relative max-w-3xl mx-auto space-y-8 p-8">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="outline" size="sm" className="rounded-full gap-2 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-tr from-blue-600 to-purple-600 rounded-xl blur-md opacity-50" />
                <div className="relative w-10 h-10 bg-linear-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-linear-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Novo Cliente
                </h1>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Cadastre um novo cliente na sua organização
            </p>
          </div>
        </div>

        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20" />

          <Card className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-2xl">Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nome <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo ou empresa"
                    disabled={loading}
                    className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="cliente@exemplo.com"
                      disabled={loading}
                      className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Telefone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      disabled={loading}
                      className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium">
                      Status
                    </Label>
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                    <Label htmlFor="plan" className="text-sm font-medium">
                      Plano
                    </Label>
                    <Select
                      id="plan"
                      value={formData.plan}
                      onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                      disabled={loading}
                      className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                    >
                      <option value="">Selecione um plano</option>
                      <option value="GESTAO">Gestão</option>
                      <option value="ESTRUTURA">Estrutura</option>
                      <option value="FREELANCER">Freelancer</option>
                      <option value="PARCERIA">Parceria</option>
                      <option value="CONSULTORIA">Consultoria</option>
                      <option value="OUTRO">Outro</option>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mainChannel" className="text-sm font-medium">
                    Canal Principal
                  </Label>
                  <Select
                    id="mainChannel"
                    value={formData.mainChannel}
                    onChange={(e) => setFormData({ ...formData, mainChannel: e.target.value })}
                    disabled={loading}
                    className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                  >
                    <option value="">Selecione um canal</option>
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="FACEBOOK">Facebook</option>
                    <option value="TIKTOK">TikTok</option>
                    <option value="YOUTUBE">YouTube</option>
                    <option value="LINKEDIN">LinkedIn</option>
                    <option value="TWITTER">Twitter</option>
                    <option value="OUTRO">Outro</option>
                  </Select>
                </div>

                {/* Contract Section */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold mb-4 bg-linear-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    Informações de Contrato
                  </h3>

                  <div className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contractStart" className="text-sm font-medium">
                          Início do Contrato
                        </Label>
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
                        <Label htmlFor="contractEnd" className="text-sm font-medium">
                          Término do Contrato
                        </Label>
                        <Input
                          id="contractEnd"
                          type="date"
                          value={formData.contractEnd}
                          onChange={(e) => setFormData({ ...formData, contractEnd: e.target.value })}
                          disabled={loading}
                          className="border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-slate-800"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Deixe vazio para contrato indeterminado
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="paymentDay" className="text-sm font-medium">
                          Dia de Pagamento
                        </Label>
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
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Dia do mês (1-31)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contractValue" className="text-sm font-medium">
                          Valor Mensal (R$)
                        </Label>
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
                </div>

                {error && (
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="rounded-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30 gap-2"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" className="text-white" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Criar Cliente
                      </>
                    )}
                  </Button>
                  <Link href="/clients">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={loading}
                      className="rounded-full backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700"
                    >
                      Cancelar
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
