import AppShell from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSessionProfile } from '@/services/auth/session'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default async function SettingsPage() {
  const { user } = await getSessionProfile()
  if (!user) redirect('/login')
  const { role } = await getSessionProfile()

  // Componente cliente para edição de perfil
  function ProfileForm({ initialName, initialImage }: { initialName: string | null; initialImage: string | null }) {
    'use client'
    const [name, setName] = useState(initialName ?? '')
    const [image, setImage] = useState(initialImage ?? '')
    const [loading, setLoading] = useState(false)

    const onSave = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, image }),
        })
        if (!res.ok) throw new Error('Falha ao salvar')
        toast.success('Perfil atualizado com sucesso')
      } catch {
        toast.error('Não foi possível atualizar o perfil')
      } finally {
        setLoading(false)
      }
    }

    return (
      <form onSubmit={(e) => { e.preventDefault(); onSave() }} className="space-y-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="image">URL da foto</Label>
            <Input id="image" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="rounded-full">
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </form>
    )
  }

  // Formulário de Organização (OWNER)
  function OrgForm() {
    'use client'
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
      name: '',
      cnpj: '',
      phone: '',
      website: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      description: '',
    })

    useEffect(() => {
      const run = async () => {
        try {
          const res = await fetch('/api/org')
          if (res.ok) {
            const o = await res.json()
            setForm((prev) => ({
              ...prev,
              name: o.name ?? '',
              cnpj: o.cnpj ?? '',
              phone: o.phone ?? '',
              website: o.website ?? '',
              addressLine1: o.addressLine1 ?? '',
              addressLine2: o.addressLine2 ?? '',
              city: o.city ?? '',
              state: o.state ?? '',
              postalCode: o.postalCode ?? '',
              country: o.country ?? '',
              description: o.description ?? '',
            }))
          }
        } catch { }
      }
      run()
    }, [])

    const onSave = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/org', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Falha ao salvar')
        toast.success('Organização atualizada com sucesso')
      } catch {
        toast.error('Não foi possível atualizar os dados da organização')
      } finally {
        setLoading(false)
      }
    }

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

    return (
      <form onSubmit={(e) => { e.preventDefault(); onSave() }} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="org_name">Nome da organização</Label>
            <Input id="org_name" value={form.name} onChange={set('name')} placeholder="Minha Empresa LTDA" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" value={form.cnpj} onChange={set('cnpj')} placeholder="00.000.000/0000-00" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" value={form.phone} onChange={set('phone')} placeholder="(11) 99999-9999" />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={form.website} onChange={set('website')} placeholder="https://minhaempresa.com" />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="address1">Endereço</Label>
            <Input id="address1" value={form.addressLine1} onChange={set('addressLine1')} placeholder="Rua, número" />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="address2">Complemento</Label>
            <Input id="address2" value={form.addressLine2} onChange={set('addressLine2')} placeholder="Sala, bloco (opcional)" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" value={form.city} onChange={set('city')} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="state">Estado</Label>
            <Input id="state" value={form.state} onChange={set('state')} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="postal">CEP</Label>
            <Input id="postal" value={form.postalCode} onChange={set('postalCode')} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="country">País</Label>
            <Input id="country" value={form.country} onChange={set('country')} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="rounded-full">
            {loading ? 'Salvando...' : 'Salvar organização'}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900 p-8">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8">
              <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Configurações</h1>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Edite suas informações de perfil e preferências da conta.</p>
              <ProfileForm initialName={user.name} initialImage={null} />
              {role === 'OWNER' && (
                <div className="max-w-3xl mx-auto mt-8">
                  <Card className="p-8">
                    <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Dados da Organização</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Atualize CNPJ, endereço e informações de contato da sua empresa.</p>
                    <OrgForm />
                  </Card>
                </div>
              )}
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
