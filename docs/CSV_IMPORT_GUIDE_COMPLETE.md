# Guia de Importação CSV - Extrato Bancário Completo

Este guia explica como importar extratos bancários completos (entradas E saídas) do Nubank ou outro banco via arquivo CSV.

## ✨ Funcionalidades

- **Upload de CSV**: Interface simples para enviar extratos bancários completos
- **Processamento de Entradas**: Conciliação automática com clientes e faturas
- **Processamento de Saídas**: Categorização inteligente de despesas
- **Análise Completa**: Visão total do fluxo de caixa (receitas + despesas)
- **Múltiplos Cenários**: Trata pagamentos identificados, não identificados e duplicados
- **Feedback Detalhado**: Mostra resultados separados para entradas e saídas

## 📋 Formato do CSV

O sistema aceita CSV no formato padrão do Nubank:

```csv
Data,Descrição,Valor,Categoria
01/12/2024,"Pix recebido - João Silva - CPF 123.456.789-00",150.00,Pix
02/12/2024,"Pix recebido - Maria Santos",280.50,Pix
03/12/2024,"Transferência realizada",-50.00,Transferência
05/12/2024,"AWS - Infraestrutura",-89.90,Tecnologia
10/12/2024,"Aluguel escritório",-1200.00,Aluguel
```

### Campos Esperados

| Campo         | Formato                  | Exemplo                                          |
| ------------- | ------------------------ | ------------------------------------------------ |
| **Data**      | DD/MM/YYYY ou YYYY-MM-DD | 15/12/2024                                       |
| **Descrição** | Texto livre              | "Pix recebido - João Silva - CPF 123.456.789-00" |
| **Valor**     | Decimal com vírgula      | 150,00 (entrada) ou -50,00 (saída)               |
| **Categoria** | Texto                    | Pix, Transferência, Tecnologia, etc              |

**Importante**: Valores positivos = receitas, valores negativos = despesas

## 🚀 Como Usar

### 1. Exportar do Nubank

1. Acesse o app Nubank
2. Vá em **Extrato**
3. Toque nos **3 pontos** no canto superior
4. Selecione **Exportar extrato**
5. Escolha o período desejado
6. Baixe o arquivo CSV

### 2. Importar no Sistema

1. Acesse a página **Financeiro** (`/billing`)
2. Clique no botão **Importar CSV** no cabeçalho
3. Selecione o arquivo baixado do Nubank
4. Aguarde o processamento
5. Visualize o resultado da importação

## 🎯 Lógica de Processamento

O sistema processa **TODAS** as transações do extrato - entradas E saídas:

### 1. RECEITAS (Entradas / Valores Positivos)

#### 1.1 Identificação do Cliente

**Por CPF/CNPJ:**

- Extrai CPF/CNPJ da descrição do Pix
- Formatos reconhecidos: `123.456.789-00` ou `12.345.678/0001-90`
- Busca cliente com CPF/CNPJ correspondente

**Por Nome:**

- Extrai nome antes do primeiro `-` na descrição
- Faz busca fuzzy (case-insensitive) no banco

#### 1.2 Conciliação com Fatura

Se cliente identificado:

- Busca faturas em aberto (`OPEN` ou `OVERDUE`)
- Compara valor com tolerância de ±R$ 0,01
- Prioriza fatura mais antiga (por `dueDate`)

Se fatura encontrada:

- Registra pagamento via `PaymentOrchestrator`
- Atualiza status da fatura para `PAID`
- Vincula pagamento à fatura
- **Status: Reconciliado ✅**

Se cliente identificado mas sem fatura:

- Cria registro `Finance` do tipo `income`
- Vincula ao cliente
- Categoria: da descrição ou "Pix - CSV Import"
- **Status: Receita Importada 💰**

Se cliente não identificado:

- Cria `Finance` do tipo `income` sem cliente
- Categoria: "Não identificado - CSV Import"
- Flag `needsReview: true` para revisão manual
- **Status: Precisa Revisão 🔍**

### 2. DESPESAS (Saídas / Valores Negativos)

#### 2.1 Categorização Automática

O sistema categoriza automaticamente baseado em palavras-chave na descrição:

| Categoria                 | Palavras-chave                                                   |
| ------------------------- | ---------------------------------------------------------------- |
| **Infraestrutura/Cloud**  | aws, google cloud, azure, heroku, vercel, netlify                |
| **Software/Assinaturas**  | github, notion, figma, adobe, microsoft, google workspace, slack |
| **Marketing**             | facebook ads, google ads, instagram, publicidade, marketing      |
| **Fornecedores**          | freelancer, prestador, fornecedor, serviço                       |
| **Taxas/Impostos**        | taxa, tarifa, imposto, tributo, inss, darf                       |
| **Folha de Pagamento**    | salário, folha, pró-labore, pro labore                           |
| **Escritório/Utilidades** | aluguel, energia, água, internet, telefone                       |
| **Equipamentos**          | equipamento, computador, notebook, mouse, teclado                |
| **Outras Despesas**       | qualquer outra saída não categorizada                            |

#### 2.2 Registro

- Cria registro `Finance` do tipo `expense`
- Aplica categoria automática
- Armazena categoria original do banco em metadata
- Permite edição manual posterior

### 3. Detecção de Duplicatas

Para evitar importações duplicadas:

- Verifica combinação: data + valor + descrição (50 chars)
- Ignora automaticamente se já existe
- **Status: Ignorado 🚫**

## 📊 Resultado da Importação

Após processar o CSV, você verá um resumo detalhado:

```text
✅ Importação concluída!
   📥 RECEITAS:
      • 8 pagamentos conciliados com faturas
      • 5 receitas importadas (sem fatura)
      • 2 ignoradas (duplicadas)

   📤 DESPESAS:
      • 12 despesas importadas e categorizadas
      • 1 ignorada (duplicada)
```

### Tipos de Resultado

| Status                   | Tipo    | Descrição                                                |
| ------------------------ | ------- | -------------------------------------------------------- |
| **Conciliados**          | Receita | Cliente + fatura identificados, pagamento vinculado      |
| **Importados (Receita)** | Receita | Cliente identificado mas sem fatura, ou não identificado |
| **Importados (Despesa)** | Despesa | Saída categorizada automaticamente                       |
| **Ignorados**            | Ambos   | Duplicados detectados automaticamente                    |
| **Erros**                | Ambos   | Falhas no processamento (raros)                          |

## 🔍 Revisão de Transações

### Receitas Não Identificadas

Transações marcadas com `needsReview: true` precisam de revisão manual:

**Para revisar:**

1. Acesse **Financeiro > Receitas**
2. Filtre por "Não identificado - CSV Import"
3. Edite manualmente para vincular ao cliente correto

### Despesas Importadas

Todas as despesas são importadas com categorização automática:

**Para revisar categorias:**

1. Acesse **Financeiro > Despesas**
2. Filtre por "CSV Import" ou categoria específica
3. Edite se necessário (ex: recategorizar)

## 💡 Exemplos de Processamento

### Exemplo 1: Pix com CPF (Melhor cenário)

```csv
15/12/2024,"Pix recebido - João Silva - CPF 123.456.789-00",500.00,Pix
```

**Resultado:**

- ✅ Cliente identificado por CPF
- ✅ Fatura de R$ 500 encontrada
- ✅ Pagamento registrado e fatura marcada como PAID
- **Status: Reconciliado**

### Exemplo 2: Pix sem CPF

```csv
15/12/2024,"Pix recebido - Maria Santos",300.00,Pix
```

**Resultado:**

- ✅ Cliente identificado por nome (busca fuzzy)
- ⚠️ Nenhuma fatura de R$ 300 encontrada
- ℹ️ Receita avulsa criada e vinculada ao cliente
- **Status: Receita Importada**

### Exemplo 3: Despesa de Infraestrutura

```csv
10/12/2024,"AWS - Invoice Dec 2024",-156.78,Tecnologia
```

**Resultado:**

- ✅ Detectado como despesa (valor negativo)
- ✅ Categorizado automaticamente como "Infraestrutura/Cloud"
- ✅ Finance criado com categoria original "Tecnologia" em metadata
- **Status: Despesa Importada**

### Exemplo 4: Despesa de Marketing

```csv
12/12/2024,"Facebook Ads - Campanha",-450.00,Marketing
```

**Resultado:**

- ✅ Detectado como despesa
- ✅ Categorizado como "Marketing"
- ✅ Categoria original preservada
- **Status: Despesa Importada**

## ⚙️ Configuração

Nenhuma configuração especial é necessária. O sistema funciona out-of-the-box.

### Estrutura de Metadados

**Para Receitas (Finance.metadata):**

```json
{
  "source": "csv_import",
  "originalDescription": "Pix recebido - João Silva - CPF 123.456.789-00",
  "category": "Pix",
  "needsReview": false
}
```

**Para Despesas (Finance.metadata):**

```json
{
  "source": "csv_import",
  "originalCategory": "Tecnologia"
}
```

## 🛠️ Troubleshooting

### CSV não é aceito

**Problema:** Arquivo rejeitado após seleção

**Soluções:**

- Certifique-se que a extensão é `.csv`
- Abra no Excel/LibreOffice e salve novamente como CSV UTF-8
- Verifique se as colunas estão separadas por vírgula
- Não use ponto-e-vírgula como separador

### Clientes não identificados (muitos)

**Problema:** Muitas receitas marcadas como "Não identificado"

**Soluções:**

1. **Adicione CPF/CNPJ aos clientes:**
   - Vá em Clientes
   - Edite cada cliente
   - Preencha CPF ou CNPJ

2. **Padronize nomes:**
   - Nome no sistema deve corresponder ao do Pix
   - Use nome completo quando possível
   - Evite abreviações diferentes

### Faturas não conciliadas

**Problema:** Cliente identificado mas fatura não vinculada

**Causas comuns:**

- Valor não confere (diferença > R$ 0,01)
- Fatura já paga anteriormente
- Fatura não existe no sistema
- Status da fatura não é OPEN ou OVERDUE

**Solução:** Sistema registra como receita avulsa automaticamente

### Despesas mal categorizadas

**Problema:** Categorização automática incorreta

**Solução:**

1. Edite manualmente a categoria desejada
2. Future: O sistema pode aprender com suas edições (planejado)

## 📈 Boas Práticas

### Importação Regular

- **Semanal**: Para acompanhamento próximo do fluxo de caixa
- **Mensal**: Para fechamento contábil
- **Nunca importar mesmo arquivo 2x**: Sistema detecta duplicatas mas é melhor evitar

### Organização de Clientes

- Mantenha CPF/CNPJ sempre atualizado
- Use nomes padronizados (igual ao banco)
- Crie faturas antes de receber pagamento (para auto-conciliação)

### Revisão de Dados

- Revise "Não identificados" semanalmente
- Verifique categorias de despesas mensalmente
- Mantenha backup dos CSVs originais

### Análise Financeira

Com entradas + saídas importadas:

- Compare receitas vs despesas por período
- Identifique maiores categorias de gasto
- Acompanhe fluxo de caixa real

## 🔐 Segurança

- CSV é processado no servidor (nunca exposto ao navegador)
- Dados sensíveis não são logados
- Apenas usuários com role OWNER podem importar
- Todas transações são registradas no audit log
- Metadados preservam rastreabilidade completa

## 📊 Relatórios e Dashboard

Após importação, os dados aparecem em:

1. **Dashboard Financeiro**: KPIs atualizados com receitas e despesas
2. **Página de Receitas**: Filtrável por "CSV Import"
3. **Página de Despesas**: Filtrável por categoria
4. **Relatório de Conciliação**: Mostra pagamentos reconciliados
5. **Fluxo de Caixa**: Visão consolidada entrada vs saída

## 🆘 Suporte

Se encontrar problemas:

1. Verifique o formato do CSV
2. Teste com arquivo menor (10-20 linhas)
3. Consulte os logs do servidor para detalhes
4. Verifique se clientes têm CPF/CNPJ cadastrado

### Logs de Debug

No servidor, procure por:

```
Error importing transaction: [data]: [descrição] - [mensagem de erro]
```

---

**Última atualização:** Dezembro 2024  
**Versão:** 2.0 - Suporte completo a entradas e saídas
