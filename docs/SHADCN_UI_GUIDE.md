# Guia de Uso — shadcn/ui

Este documento descreve o padrão de utilização dos componentes **shadcn/ui** no projeto.

## 🎨 Filosofia de Design

- **Consistência**: Todos os componentes seguem o design system shadcn/ui (variante "new-york")
- **Acessibilidade**: Componentes com suporte ARIA e navegação por teclado
- **Tema**: Sistema de cores baseado em CSS variables (zinc como cor base)
- **Responsividade**: Mobile-first com breakpoints Tailwind

---

## 📦 Componentes Disponíveis

### Button

```tsx
import { Button } from "@/components/ui/button"

// Variantes
<Button variant="default">Primário</Button>
<Button variant="destructive">Excluir</Button>
<Button variant="outline">Secundário</Button>
<Button variant="secondary">Alternativo</Button>
<Button variant="ghost">Sutil</Button>
<Button variant="link">Link</Button>

// Tamanhos
<Button size="default">Padrão</Button>
<Button size="sm">Pequeno</Button>
<Button size="lg">Grande</Button>
<Button size="icon">Ícone</Button>

// Com Link (Next.js)
<Button asChild>
  <Link href="/path">Navegar</Link>
</Button>
```

**Quando usar:**

- `variant="default"`: Ações primárias (salvar, confirmar, enviar)
- `variant="destructive"`: Ações destrutivas (excluir, remover)
- `variant="outline"`: Ações secundárias (cancelar, voltar)
- `variant="secondary"`: Ações alternativas (limpar, filtrar)
- `variant="ghost"`: Ações sutis em tabelas/cards
- `variant="link"`: Links de navegação inline

---

### Input

```tsx
import { Input } from "@/components/ui/input"

<Input placeholder="Digite algo..." />
<Input type="email" placeholder="E-mail" />
<Input type="number" step="0.01" />
<Input type="date" />

// Com Label
<div className="space-y-2">
  <Label htmlFor="name">Nome</Label>
  <Input id="name" name="name" />
</div>
```

**Quando usar:**

- Formulários de entrada de dados
- Campos de busca
- Inputs de texto, número, data, etc.

---

### Label

```tsx
import { Label } from "@/components/ui/label"

<Label htmlFor="field">Campo</Label>
<Input id="field" />
```

**Quando usar:**

- Sempre que houver um Input para melhorar acessibilidade
- Use `htmlFor` conectando ao `id` do input

---

### Dialog (Modal)

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function MyModal() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Abrir</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[525px]'>
        <DialogHeader>
          <DialogTitle>Título</DialogTitle>
          <DialogDescription>Descrição do modal</DialogDescription>
        </DialogHeader>

        {/* Conteúdo */}
        <div className='space-y-4'>...</div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type='submit'>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Quando usar:**

- Formulários de criação/edição
- Confirmações importantes
- Visualização de detalhes

---

### Card

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

;<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>Conteúdo do card</CardContent>
</Card>
```

**Quando usar:**

- Seções de conteúdo agrupado
- Dashboards e painéis
- Cards de informação

---

### Select

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

;<Select name='status'>
  <SelectTrigger>
    <SelectValue placeholder='Selecione...' />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value='option1'>Opção 1</SelectItem>
    <SelectItem value='option2'>Opção 2</SelectItem>
  </SelectContent>
</Select>
```

**Quando usar:**

- Dropdowns com poucas opções (< 20)
- Filtros e seletores
- Para muitas opções, considere usar typeahead/autocomplete

---

### Badge

```tsx
import { Badge } from "@/components/ui/badge"

<Badge>Padrão</Badge>
<Badge variant="destructive">Erro</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="secondary">Secundário</Badge>
```

**Quando usar:**

- Status labels (PAID, PENDING, OVERDUE)
- Tags e categorias
- Contadores

---

## 🎯 Padrões de Uso no Projeto

### Formulários

```tsx
<form className='space-y-4' onSubmit={handleSubmit}>
  <div className='space-y-2'>
    <Label htmlFor='field'>Campo</Label>
    <Input id='field' name='field' required />
  </div>

  <div className='flex gap-2 justify-end'>
    <Button variant='outline' type='button'>
      Cancelar
    </Button>
    <Button type='submit'>Salvar</Button>
  </div>
</form>
```

### Filtros em Páginas

```tsx
<form className='flex items-center gap-2' method='get'>
  <select
    aria-label='Filtro'
    name='filter'
    className='h-8 text-xs border rounded-md px-2 bg-background'
  >
    <option value=''>Todos</option>
    <option value='active'>Ativos</option>
  </select>
  <Input name='q' placeholder='Buscar' className='h-8 text-xs w-40' />
  <Button type='submit' size='sm'>
    Filtrar
  </Button>
</form>
```

### Paginação

```tsx
<div className='flex items-center justify-between text-xs'>
  <div>
    Página {page} de {totalPages}
  </div>
  <div className='flex gap-2'>
    {page > 1 && (
      <Button variant='outline' size='sm' asChild>
        <Link href={`?page=${page - 1}`}>Anterior</Link>
      </Button>
    )}
    {page < totalPages && (
      <Button variant='outline' size='sm' asChild>
        <Link href={`?page=${page + 1}`}>Próxima</Link>
      </Button>
    )}
  </div>
</div>
```

### Tabelas com Ações

```tsx
<table className='min-w-full text-sm'>
  <tbody>
    {items.map((item) => (
      <tr key={item.id} className='border-t'>
        <td className='py-2'>{item.name}</td>
        <td className='py-2 flex gap-2'>
          <Button variant='ghost' size='sm' asChild>
            <Link href={`/items/${item.id}`}>Ver</Link>
          </Button>
          <Button variant='secondary' size='sm'>
            Editar
          </Button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

---

## 🚫 Evite

❌ **Não usar classes inline para botões:**

```tsx
// ❌ Errado
<button className="px-3 py-2 rounded bg-blue-600 text-white">
  Salvar
</button>

// ✅ Correto
<Button variant="default">Salvar</Button>
```

❌ **Não criar inputs sem labels:**

```tsx
// ❌ Errado
<input placeholder="Nome" />

// ✅ Correto
<Label htmlFor="name">Nome</Label>
<Input id="name" placeholder="Nome" />
```

❌ **Não usar modais DIY:**

```tsx
// ❌ Errado
{
  open && <div className='fixed inset-0 z-50...'>...</div>
}

// ✅ Correto
;<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>...</DialogContent>
</Dialog>
```

---

## 📚 Componentes Customizados

### ClientTypeahead

Typeahead com busca incremental para seleção de clientes:

```tsx
import { ClientTypeahead } from '@/features/clients/components/ClientTypeahead'

;<ClientTypeahead name='clientId' placeholder='Buscar cliente...' />
```

### FinanceCreateModal

Modal para criar lançamentos financeiros:

```tsx
import { FinanceCreateModal } from '@/features/finance/components/FinanceCreateModal'

;<FinanceCreateModal />
```

### FinanceEditModal

Modal para editar lançamentos existentes:

```tsx
import { FinanceEditModal } from '@/features/finance/components/FinanceEditModal'

;<FinanceEditModal row={financeRow} />
```

---

## 🔧 Configuração

O projeto usa:

- **Estilo**: new-york
- **Cor base**: zinc
- **CSS Variables**: sim
- **RSC**: sim (React Server Components)
- **Ícones**: lucide-react

Configuração em `components.json`:

```json
{
  "style": "new-york",
  "tailwind": {
    "baseColor": "zinc",
    "cssVariables": true
  }
}
```

---

## 🎨 Cores do Sistema

Utilize as cores do tema via CSS variables:

```tsx
// Cores de estado
<div className="text-emerald-600">Sucesso</div>
<div className="text-red-600">Erro</div>
<div className="text-amber-600">Alerta</div>
<div className="text-blue-600">Info</div>

// Cores do tema
<div className="text-primary">Primária</div>
<div className="text-muted-foreground">Secundária</div>
<div className="bg-background">Background</div>
<div className="border-input">Borda</div>
```

---

## 📝 Checklist de Migração

Ao criar um novo componente ou página:

- [ ] Usar `Button` ao invés de `<button>` custom
- [ ] Usar `Input` com `Label` para formulários
- [ ] Usar `Dialog` para modais
- [ ] Usar `Card` para seções agrupadas
- [ ] Usar `Badge` para status/tags
- [ ] Adicionar `aria-label` em selects nativos
- [ ] Usar `variant` e `size` props adequadamente
- [ ] Testar acessibilidade (navegação por teclado)
- [ ] Verificar responsividade mobile

---

## 🆘 Suporte

- **Documentação oficial**: https://ui.shadcn.com
- **Componentes**: `src/components/ui/`
- **Exemplos no projeto**: `src/app/(dashboard)/billing/page.tsx`
