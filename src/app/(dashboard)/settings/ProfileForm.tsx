"use client"

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { toast } from 'sonner'

export function ProfileForm({ initialName, initialImage }: { initialName: string | null; initialImage: string | null }) {
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
