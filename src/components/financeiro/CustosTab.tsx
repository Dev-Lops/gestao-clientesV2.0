'use client'

import { CostDetailModal } from '@/components/financeiro/CostDetailModal'
import { CreateCostItemModal } from '@/components/financeiro/CreateCostItemModal'
import { CreateCostSubscriptionModal } from '@/components/financeiro/CreateCostSubscriptionModal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  AlertCircle,
  Calendar,
  DollarSign,
  Package,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
  Users
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface CostItem {
  id: string
  name: string
  description: string | null
  amount: number
  createdAt: string
}

interface ClientCostSubscription {
  id: string
  clientId: string
  client?: {
    id: string
    name: string
  }
  costItemId: string
  costItem?: {
    id: string
    name: string
    amount: number
    category: string | null
  }
  amount: number
  startDate: string
  endDate: string | null
  createdAt: string
}

export function CustosTab() {
  const [costItems, setCostItems] = useState<CostItem[]>([])
  const [subscriptions, setSubscriptions] = useState<ClientCostSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [materializing, setMaterializing] = useState(false)
  const [modalItemOpen, setModalItemOpen] = useState(false)
  const [modalSubscriptionOpen, setModalSubscriptionOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedCostId, setSelectedCostId] = useState<string | undefined>()
  const [selectedCostType, setSelectedCostType] = useState<'item' | 'subscription'>('item')

  const [searchTermItems, setSearchTermItems] = useState('')
  const [searchTermSubs, setSearchTermSubs] = useState('')
  const [pageCostItems, setPageCostItems] = useState(1)
  const [totalPagesCostItems, setTotalPagesCostItems] = useState(1)
  const [pageSubscriptions, setPageSubscriptions] = useState(1)
  const [totalPagesSubscriptions, setTotalPagesSubscriptions] = useState(1)

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCostItems, pageSubscriptions])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const itemsParams = new URLSearchParams({
        page: pageCostItems.toString(),
        limit: '20',
      })

      const subsParams = new URLSearchParams({
        page: pageSubscriptions.toString(),
        limit: '20',
      })

      const [itemsRes, subsRes] = await Promise.all([
        fetch(`/api/cost-items?${itemsParams}`),
        fetch(`/api/cost-subscriptions?${subsParams}`),
      ])

      if (!itemsRes.ok || !subsRes.ok) throw new Error('Erro ao carregar dados')

      const itemsData = await itemsRes.json()
      const subsData = await subsRes.json()

      setCostItems(itemsData.data || [])
      setTotalPagesCostItems(itemsData.totalPages || 1)
      setSubscriptions(subsData.data || [])
      setTotalPagesSubscriptions(subsData.totalPages || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handleMaterializeSubscriptions = async () => {
    if (!confirm('Deseja materializar custos de todas as assinaturas ativas?')) return

    try {
      setMaterializing(true)
      setError(null)

      const response = await fetch('/api/cost-subscriptions/materialize', { method: 'POST' })
      if (!response.ok) throw new Error('Erro ao materializar custos')

      const result = await response.json()
      alert(`✅ Custos materializados!\n\nCriadas: ${result.materialized.length} transações`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao materializar')
    } finally {
      setMaterializing(false)
    }
  }

  const handleDeleteCostItem = async (itemId: string) => {
    if (!confirm('Deseja realmente excluir este item de custo?')) return

    try {
      const response = await fetch(`/api/cost-items/${itemId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao excluir item')
      alert('✅ Item excluído!')
      fetchData()
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : 'Erro'}`)
    }
  }

  const handleDeleteSubscription = async (subId: string) => {
    if (!confirm('Deseja realmente excluir esta associação?')) return

    try {
      const response = await fetch(`/api/cost-subscriptions/${subId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao excluir associação')
      alert('✅ Associação excluída!')
      fetchData()
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : 'Erro'}`)
    }
  }

  const handleItemCreated = () => {
    setModalItemOpen(false)
    fetchData()
  }

  const handleSubscriptionCreated = () => {
    setModalSubscriptionOpen(false)
    fetchData()
  }

  const handleViewCostItem = (id: string) => {
    setSelectedCostId(id)
    setSelectedCostType('item')
    setDetailModalOpen(true)
  }

  const handleViewSubscription = (id: string) => {
    setSelectedCostId(id)
    setSelectedCostType('subscription')
    setDetailModalOpen(true)
  }

  const filteredCostItems = costItems.filter(item =>
    !searchTermItems || item.name.toLowerCase().includes(searchTermItems.toLowerCase())
  )

  const filteredSubscriptions = subscriptions.filter(sub =>
    !searchTermSubs ||
    sub.client?.name.toLowerCase().includes(searchTermSubs.toLowerCase()) ||
    sub.costItem?.name.toLowerCase().includes(searchTermSubs.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Cabeçalho Premium */}
      <Card size="md" className="border-0 shadow-lg bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-yellow-950/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">Custos por Cliente</h2>
              <p className="text-muted-foreground mt-1">Rastreamento de custos e margens</p>
            </div>
            <Button variant="outline" onClick={handleMaterializeSubscriptions} disabled={materializing} className="shadow-md">
              {materializing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4" />}
              Materializar Custos
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="items" className="space-y-6" onValueChange={(value) => {
        if (value === 'items') {
          setPageCostItems(1)
        } else {
          setPageSubscriptions(1)
        }
      }}>
        <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 rounded-xl shadow-md">
          <TabsTrigger value="items" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white py-3 rounded-lg transition-all">
            <Package className="h-4 w-4" />
            Itens de Custo
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white py-3 rounded-lg transition-all">
            <Users className="h-4 w-4" />
            Associações com Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Button onClick={() => setModalItemOpen(true)} className="shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Novo Item de Custo
            </Button>
          </div>

          <Card size="md" className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <Label htmlFor="search-items">Buscar</Label>
                <Input id="search-items" placeholder="Nome do item..." value={searchTermItems} onChange={(e) => setSearchTermItems(e.target.value)} className="h-11" />
              </div>
            </CardContent>
          </Card>

          <Card size="md" className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Itens de Custo Cadastrados</CardTitle>
              <CardDescription className="text-base">Mostrando {filteredCostItems.length} de {costItems.length} itens</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-between items-center gap-3 mb-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">
                  Página {pageCostItems} de {totalPagesCostItems}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageCostItems(p => Math.max(1, p - 1))}
                    disabled={pageCostItems === 1}
                  >
                    Anterior
                  </Button>
                  <select
                    value={pageCostItems}
                    onChange={(e) => setPageCostItems(Number(e.target.value))}
                    className="px-3 py-1.5 border rounded-md text-sm font-medium"
                    aria-label="Ir para página"
                  >
                    {Array.from({ length: totalPagesCostItems }, (_, i) => i + 1).map(p => (
                      <option key={p} value={p}>Página {p}</option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageCostItems(p => Math.min(totalPagesCostItems, p + 1))}
                    disabled={pageCostItems === totalPagesCostItems}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
              {error && <Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
              {loading ? <div className="text-center py-12 text-muted-foreground">Carregando...</div> : filteredCostItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">Nenhum item de custo encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCostItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-5 border rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-950/20 dark:hover:to-indigo-950/20 hover:shadow-md transition-all cursor-pointer group" onClick={() => handleViewCostItem(item.id)}>
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-2 rounded-full bg-purple-100">
                          <Package className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-purple-600">{formatCurrency(item.amount)}</div>
                          <div className="text-xs text-muted-foreground">por unidade</div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteCostItem(item.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Button onClick={() => setModalSubscriptionOpen(true)} className="shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Nova Associação
            </Button>
          </div>

          <Card size="md" className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <Label htmlFor="search-subs">Buscar</Label>
                <Input id="search-subs" placeholder="Cliente ou item..." value={searchTermSubs} onChange={(e) => setSearchTermSubs(e.target.value)} className="h-11" />
              </div>
            </CardContent>
          </Card>

          <Card size="md" className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Associações Cliente-Custo</CardTitle>
              <CardDescription className="text-base">Mostrando {filteredSubscriptions.length} de {subscriptions.length} associações</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-between items-center gap-3 mb-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground">
                  Página {pageSubscriptions} de {totalPagesSubscriptions}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageSubscriptions(p => Math.max(1, p - 1))}
                    disabled={pageSubscriptions === 1}
                  >
                    Anterior
                  </Button>
                  <select
                    value={pageSubscriptions}
                    onChange={(e) => setPageSubscriptions(Number(e.target.value))}
                    className="px-3 py-1.5 border rounded-md text-sm font-medium"
                    aria-label="Ir para página"
                  >
                    {Array.from({ length: totalPagesSubscriptions }, (_, i) => i + 1).map(p => (
                      <option key={p} value={p}>Página {p}</option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageSubscriptions(p => Math.min(totalPagesSubscriptions, p + 1))}
                    disabled={pageSubscriptions === totalPagesSubscriptions}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
              {error && <Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
              {loading ? <div className="text-center py-12 text-muted-foreground">Carregando...</div> : filteredSubscriptions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">Nenhuma associação encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSubscriptions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-5 border rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-950/20 dark:hover:to-cyan-950/20 hover:shadow-md transition-all cursor-pointer group" onClick={() => handleViewSubscription(sub.id)}>
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-2 rounded-full bg-indigo-100">
                          <TrendingUp className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{sub.client?.name || 'Cliente'}</p>
                            <Badge variant="outline">{sub.costItem?.name || 'Item'}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Início: {formatDate(sub.startDate)}</span>
                            {sub.endDate && <span className="flex items-center gap-1">Fim: {formatDate(sub.endDate)}</span>}
                            {!sub.endDate && <Badge className="bg-green-100 text-green-800">Ativo</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-indigo-600">{formatCurrency(sub.amount)}</div>
                          <div className="text-xs text-muted-foreground">custo mensal</div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteSubscription(sub.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateCostItemModal
        open={modalItemOpen}
        onOpenChange={setModalItemOpen}
        onSuccess={handleItemCreated}
      />

      <CreateCostSubscriptionModal
        open={modalSubscriptionOpen}
        onOpenChange={setModalSubscriptionOpen}
        onSuccess={handleSubscriptionCreated}
      />

      <CostDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        type={selectedCostType}
        costId={selectedCostId}
      />
    </div>
  )
}