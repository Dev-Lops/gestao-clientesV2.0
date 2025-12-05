# 🔄 Refatoração Completa do Projeto - Gestão de Clientes

## 📋 Visão Geral

Este documento define a **refatoração completa** do projeto, reorganizando toda a estrutura de código mantendo a mesma lógica de negócio, mas de forma **profissional, escalável e organizada**.

---

## 🎯 Objetivos

1. **Arquitetura em Camadas** (Domain-Driven Design)
2. **Separação de Responsabilidades** (Services, Repositories, Use Cases)
3. **Componentização Atômica** (Atomic Design)
4. **Tipagem Forte** (TypeScript estrito + Zod)
5. **Testabilidade** (Unit, Integration, E2E)
6. **Performance** (Code splitting, lazy loading, otimizações)
7. **Manutenibilidade** (Código limpo, documentado, padronizado)

---

## 🏗️ Nova Estrutura de Pastas

```
gestao-clientes/
├── src/
│   ├── app/                          # Next.js App Router (páginas e rotas)
│   │   ├── (public)/                 # Rotas públicas (login, convite)
│   │   ├── (dashboard)/              # Rotas autenticadas
│   │   │   ├── clientes/
│   │   │   ├── financeiro/
│   │   │   ├── tarefas/
│   │   │   └── configuracoes/
│   │   └── api/                      # API Routes
│   │       ├── auth/
│   │       ├── clients/
│   │       ├── invoices/
│   │       ├── tasks/
│   │       └── reports/
│   │
│   ├── core/                         # 🎯 DOMÍNIO (business logic)
│   │   ├── domain/                   # Entidades e regras de negócio
│   │   │   ├── client/
│   │   │   │   ├── entities/         # Client, Contract
│   │   │   │   ├── value-objects/    # Email, CNPJ, CPF
│   │   │   │   ├── rules/            # Regras de validação
│   │   │   │   └── events/           # Domain events
│   │   │   ├── finance/
│   │   │   │   ├── entities/         # Invoice, Transaction
│   │   │   │   ├── value-objects/    # Money, PaymentStatus
│   │   │   │   └── rules/
│   │   │   ├── task/
│   │   │   └── shared/               # Regras compartilhadas
│   │   │
│   │   ├── use-cases/                # 🎯 CASOS DE USO (application logic)
│   │   │   ├── client/
│   │   │   │   ├── create-client.use-case.ts
│   │   │   │   ├── update-client.use-case.ts
│   │   │   │   ├── list-clients.use-case.ts
│   │   │   │   └── get-client-dashboard.use-case.ts
│   │   │   ├── finance/
│   │   │   │   ├── generate-invoice.use-case.ts
│   │   │   │   ├── process-payment.use-case.ts
│   │   │   │   └── calculate-dashboard.use-case.ts
│   │   │   └── task/
│   │   │
│   │   └── ports/                    # Interfaces (Dependency Inversion)
│   │       ├── repositories/
│   │       │   ├── client.repository.interface.ts
│   │       │   ├── invoice.repository.interface.ts
│   │       │   └── task.repository.interface.ts
│   │       └── services/
│   │           ├── email.service.interface.ts
│   │           ├── storage.service.interface.ts
│   │           └── whatsapp.service.interface.ts
│   │
│   ├── infrastructure/               # 🔧 INFRAESTRUTURA (implementações)
│   │   ├── database/
│   │   │   ├── prisma/
│   │   │   │   ├── schema.prisma
│   │   │   │   ├── migrations/
│   │   │   │   └── client.ts
│   │   │   └── repositories/        # Implementações dos repositories
│   │   │       ├── prisma-client.repository.ts
│   │   │       ├── prisma-invoice.repository.ts
│   │   │       └── prisma-task.repository.ts
│   │   │
│   │   ├── services/                 # Implementações de serviços externos
│   │   │   ├── email/
│   │   │   │   ├── resend-email.service.ts
│   │   │   │   └── templates/
│   │   │   ├── storage/
│   │   │   │   ├── r2-storage.service.ts
│   │   │   │   └── s3-storage.service.ts
│   │   │   ├── whatsapp/
│   │   │   │   ├── meta-whatsapp.service.ts
│   │   │   │   └── twilio-whatsapp.service.ts
│   │   │   └── auth/
│   │   │       └── firebase-auth.service.ts
│   │   │
│   │   ├── http/                     # Controllers (API handlers)
│   │   │   ├── controllers/
│   │   │   │   ├── client.controller.ts
│   │   │   │   ├── invoice.controller.ts
│   │   │   │   └── task.controller.ts
│   │   │   ├── middlewares/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── error.middleware.ts
│   │   │   │   └── rate-limit.middleware.ts
│   │   │   └── validators/
│   │   │       └── zod-validator.ts
│   │   │
│   │   └── cache/
│   │       ├── redis.client.ts
│   │       └── cache.service.ts
│   │
│   ├── presentation/                 # 🎨 APRESENTAÇÃO (UI)
│   │   ├── components/
│   │   │   ├── atoms/                # Componentes básicos
│   │   │   │   ├── Button/
│   │   │   │   ├── Input/
│   │   │   │   ├── Badge/
│   │   │   │   ├── Icon/
│   │   │   │   └── Spinner/
│   │   │   │
│   │   │   ├── molecules/            # Combinações de atoms
│   │   │   │   ├── FormField/
│   │   │   │   ├── SearchBar/
│   │   │   │   ├── DatePicker/
│   │   │   │   └── StatusBadge/
│   │   │   │
│   │   │   ├── organisms/            # Componentes complexos
│   │   │   │   ├── DataTable/
│   │   │   │   ├── KpiCard/
│   │   │   │   ├── FilterBar/
│   │   │   │   └── Navbar/
│   │   │   │
│   │   │   ├── templates/            # Layouts de página
│   │   │   │   ├── DashboardLayout/
│   │   │   │   ├── AuthLayout/
│   │   │   │   └── SettingsLayout/
│   │   │   │
│   │   │   └── features/             # Componentes de domínio
│   │   │       ├── client/
│   │   │       │   ├── ClientList/
│   │   │       │   ├── ClientForm/
│   │   │       │   ├── ClientCard/
│   │   │       │   └── ClientDashboard/
│   │   │       ├── finance/
│   │   │       │   ├── InvoiceList/
│   │   │       │   ├── InvoiceForm/
│   │   │       │   ├── FinanceDashboard/
│   │   │       │   └── PaymentStatus/
│   │   │       └── task/
│   │   │           ├── TaskBoard/
│   │   │           ├── TaskCard/
│   │   │           └── TaskForm/
│   │   │
│   │   ├── hooks/                    # Custom hooks
│   │   │   ├── use-client.hook.ts
│   │   │   ├── use-invoice.hook.ts
│   │   │   ├── use-task.hook.ts
│   │   │   ├── use-auth.hook.ts
│   │   │   ├── use-debounce.hook.ts
│   │   │   └── use-media-query.hook.ts
│   │   │
│   │   ├── contexts/                 # React contexts
│   │   │   ├── AuthContext/
│   │   │   ├── ThemeContext/
│   │   │   └── NotificationContext/
│   │   │
│   │   └── providers/                # Providers globais
│   │       ├── ReactQueryProvider.tsx
│   │       ├── AuthProvider.tsx
│   │       └── ThemeProvider.tsx
│   │
│   ├── shared/                       # 🛠️ COMPARTILHADO
│   │   ├── types/                    # Tipos TypeScript
│   │   │   ├── models/               # Tipos de dados
│   │   │   ├── enums/                # Enumerações
│   │   │   ├── api/                  # Request/Response types
│   │   │   └── utils/                # Utility types
│   │   │
│   │   ├── schemas/                  # Validação Zod
│   │   │   ├── client.schema.ts
│   │   │   ├── invoice.schema.ts
│   │   │   └── task.schema.ts
│   │   │
│   │   ├── constants/                # Constantes
│   │   │   ├── routes.ts
│   │   │   ├── status.ts
│   │   │   └── permissions.ts
│   │   │
│   │   ├── utils/                    # Utilitários
│   │   │   ├── date.util.ts
│   │   │   ├── format.util.ts
│   │   │   ├── validation.util.ts
│   │   │   └── currency.util.ts
│   │   │
│   │   └── config/                   # Configurações
│   │       ├── app.config.ts
│   │       ├── env.config.ts
│   │       └── feature-flags.config.ts
│   │
│   └── styles/                       # 🎨 ESTILOS
│       ├── globals.css
│       ├── tokens.css                # Design tokens
│       └── themes/
│           ├── light.css
│           └── dark.css
│
├── tests/                            # 🧪 TESTES
│   ├── unit/                         # Testes unitários
│   │   ├── core/
│   │   │   ├── domain/
│   │   │   └── use-cases/
│   │   └── shared/
│   │       └── utils/
│   │
│   ├── integration/                  # Testes de integração
│   │   ├── api/
│   │   └── repositories/
│   │
│   └── e2e/                          # Testes end-to-end
│       ├── auth.spec.ts
│       ├── clients.spec.ts
│       └── finance.spec.ts
│
├── scripts/                          # Scripts utilitários
│   ├── db/
│   │   ├── seed.ts
│   │   └── migrate.ts
│   └── utils/
│
├── docs/                             # Documentação
│   ├── architecture/
│   ├── api/
│   └── guides/
│
└── config files...                   # Configurações raiz
```

---

## 📐 Princípios da Arquitetura

### 1. **Clean Architecture / Hexagonal Architecture**

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│    (UI Components, Pages, Hooks)        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        Application Layer                │
│         (Use Cases)                     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│          Domain Layer                   │
│   (Entities, Value Objects, Rules)      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Infrastructure Layer               │
│ (Database, APIs, External Services)     │
└─────────────────────────────────────────┘
```

### 2. **Dependency Rule**

- **Presentation** depende de **Application**
- **Application** depende de **Domain**
- **Domain** NÃO depende de nada
- **Infrastructure** implementa interfaces do **Domain**

### 3. **SOLID Principles**

- **S**ingle Responsibility
- **O**pen/Closed
- **L**iskov Substitution
- **I**nterface Segregation
- **D**ependency Inversion

---

## 🔄 Plano de Migração (Faseado)

### **Fase 1: Preparação e Setup** (1-2 dias)

- ✅ Criar nova estrutura de pastas
- ✅ Configurar path aliases no TypeScript
- ✅ Documentar padrões e convenções
- ✅ Setup de ferramentas (linting, formatting)

### **Fase 2: Camada de Domínio** (3-5 dias)

- Migrar entidades e value objects
- Criar regras de negócio isoladas
- Definir interfaces dos repositories
- Implementar domain events

### **Fase 3: Camada de Aplicação** (5-7 dias)

- Criar use cases para cada operação
- Migrar lógica de serviços para use cases
- Implementar validações com Zod
- Setup de dependency injection

### **Fase 4: Camada de Infraestrutura** (5-7 dias)

- Implementar repositories com Prisma
- Migrar serviços externos (email, storage, WhatsApp)
- Criar controllers para API routes
- Setup de cache e otimizações

### **Fase 5: Camada de Apresentação** (7-10 dias)

- Reorganizar componentes (Atomic Design)
- Criar hooks customizados
- Migrar páginas para nova estrutura
- Implementar lazy loading e code splitting

### **Fase 6: Testes** (5-7 dias)

- Criar testes unitários para domain e use cases
- Implementar testes de integração
- Setup de testes E2E
- Code coverage > 80%

### **Fase 7: Documentação e Deploy** (2-3 dias)

- Documentar arquitetura e fluxos
- Criar guias de desenvolvimento
- Validação final e deploy

---

## 🎯 Exemplo Prático: Cliente

### **Domain Layer**

```typescript
// core/domain/client/entities/client.entity.ts
export class Client {
  constructor(
    public readonly id: string,
    public name: string,
    public email: Email,
    public cnpj: CNPJ | null,
    public contract: Contract | null,
    public status: ClientStatus
  ) {}

  updateContract(contract: Contract): void {
    // Validações de negócio
    if (!this.canUpdateContract()) {
      throw new Error('Cliente não pode ter contrato atualizado')
    }
    this.contract = contract
  }

  private canUpdateContract(): boolean {
    return this.status !== ClientStatus.DELETED
  }
}
```

### **Use Case Layer**

```typescript
// core/use-cases/client/create-client.use-case.ts
export class CreateClientUseCase {
  constructor(
    private clientRepository: IClientRepository,
    private eventBus: IEventBus
  ) {}

  async execute(input: CreateClientInput): Promise<CreateClientOutput> {
    // 1. Validar input
    const validatedInput = CreateClientSchema.parse(input)

    // 2. Criar entidade
    const client = new Client(
      generateId(),
      validatedInput.name,
      new Email(validatedInput.email),
      validatedInput.cnpj ? new CNPJ(validatedInput.cnpj) : null,
      null,
      ClientStatus.ACTIVE
    )

    // 3. Persistir
    await this.clientRepository.save(client)

    // 4. Emitir evento
    await this.eventBus.publish(new ClientCreatedEvent(client))

    // 5. Retornar
    return { clientId: client.id }
  }
}
```

### **Infrastructure Layer**

```typescript
// infrastructure/database/repositories/prisma-client.repository.ts
export class PrismaClientRepository implements IClientRepository {
  constructor(private prisma: PrismaClient) {}

  async save(client: Client): Promise<void> {
    await this.prisma.client.create({
      data: {
        id: client.id,
        name: client.name,
        email: client.email.value,
        cnpj: client.cnpj?.value,
        status: client.status,
      },
    })
  }

  async findById(id: string): Promise<Client | null> {
    const data = await this.prisma.client.findUnique({ where: { id } })
    if (!data) return null
    return this.toDomain(data)
  }

  private toDomain(data: any): Client {
    return new Client(
      data.id,
      data.name,
      new Email(data.email),
      data.cnpj ? new CNPJ(data.cnpj) : null,
      null,
      data.status as ClientStatus
    )
  }
}
```

### **API Route**

```typescript
// app/api/clients/route.ts
import { createClientUseCase } from '@/infrastructure/di/container'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = await createClientUseCase.execute(body)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### **Presentation Layer**

```typescript
// presentation/components/features/client/ClientForm/ClientForm.tsx
export function ClientForm() {
  const { mutate, isPending } = useCreateClient()

  const onSubmit = (data: ClientFormData) => {
    mutate(data, {
      onSuccess: () => toast.success('Cliente criado!'),
      onError: (error) => toast.error(error.message),
    })
  }

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>
}
```

---

## 📊 Benefícios da Refatoração

### ✅ **Manutenibilidade**

- Código organizado e fácil de encontrar
- Responsabilidades bem definidas
- Baixo acoplamento entre camadas

### ✅ **Testabilidade**

- Lógica de negócio isolada e testável
- Mocks facilitados por interfaces
- Testes independentes de infraestrutura

### ✅ **Escalabilidade**

- Fácil adicionar novas features
- Substituir implementações sem afetar domínio
- Múltiplos desenvolvedores trabalhando em paralelo

### ✅ **Performance**

- Code splitting por feature
- Lazy loading de componentes
- Cache strategies bem definidas

### ✅ **Segurança**

- Validação em todas as camadas
- Tipagem forte em todo código
- Error handling centralizado

---

## 🚀 Próximos Passos

1. **Aprovar** este plano de refatoração
2. **Criar** branch `refactor/architecture-v2`
3. **Iniciar** Fase 1: Setup e preparação
4. **Migrar** módulo por módulo (começar por Client)
5. **Testar** cada módulo antes de prosseguir
6. **Documentar** decisões arquiteturais
7. **Review** e merge quando estável

---

## 📚 Referências

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Atomic Design](https://bradfrost.com/blog/post/atomic-web-design/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---

**Documento criado em**: 05/12/2025  
**Versão**: 1.0  
**Status**: Aguardando Aprovação
