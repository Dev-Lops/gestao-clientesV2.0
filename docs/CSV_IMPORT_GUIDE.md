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
```

### Campos Esperados

| Campo         | Formato                  | Exemplo                                          |
| ------------- | ------------------------ | ------------------------------------------------ |
| **Data**      | DD/MM/YYYY ou YYYY-MM-DD | 15/12/2024                                       |
| **Descrição** | Texto livre              | "Pix recebido - João Silva - CPF 123.456.789-00" |
| **Valor**     | Decimal com vírgula      | 150,00 ou -50,00                                 |
| **Categoria** | Texto                    | Pix, Transferência, etc                          |

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

## 🎯 Lógica de Conciliação

O sistema processa cada transação seguindo estas regras:

### 1. Identificação do Cliente

**Por CPF/CNPJ (Recomendado):**

- Extrai CPF/CNPJ da descrição do Pix
- Formatos reconhecidos: `123.456.789-00` ou `12.345.678/0001-90`
- Busca cliente com CPF/CNPJ correspondente (campos únicos no banco)
- **Identificação mais precisa e confiável**

**Por Nome (Fallback):**

- Extrai nome antes do primeiro `-` na descrição
- Faz busca fuzzy (case-insensitive) no banco
- Usado quando CPF/CNPJ não está presente na descrição

### 2. Conciliação com Fatura

Se cliente identificado:

- Busca faturas em aberto (`OPEN` ou `OVERDUE`)
- Compara valor com tolerância de ±R$ 0,01
- Prioriza fatura mais antiga (por `dueDate`)

Se fatura encontrada:

- Registra pagamento via `PaymentOrchestrator`
- Atualiza status da fatura para `PAID`
- Vincula pagamento à fatura

### 3. Registro Financeiro

**Cliente + Fatura identificados:**

- Cria `Payment` vinculado à fatura
- Cria `Finance` do tipo `income`
- Marca como reconciliado

**Cliente identificado, sem fatura:**

- Cria `Payment` avulso
- Cria `Finance` do tipo `income`
- Categoria: "Pix - CSV Import"

**Cliente não identificado:**

- Cria apenas `Finance` do tipo `income`
- Categoria: "Não identificado - CSV Import"
- Adiciona flag `needsReview: true` no metadata

### 4. Duplicatas

- Sistema verifica se transação já existe
- Compara: data, valor e trecho da descrição
- Ignora duplicatas automaticamente

## 📊 Resultado da Importação

Após processar o CSV, você verá um resumo:

```
✅ Importação concluída!
   • 15 transações processadas
   • 8 pagamentos conciliados
   • 5 importados sem conciliação
   • 2 ignorados (duplicados)
```

### Tipos de Resultado

| Status          | Descrição                                           |
| --------------- | --------------------------------------------------- |
| **Conciliados** | Cliente + fatura identificados, pagamento vinculado |
| **Importados**  | Registrados como receita, sem vínculo com fatura    |
| **Ignorados**   | Duplicados ou saídas (despesas)                     |
| **Erros**       | Falhas no processamento (raros)                     |

## 🔍 Transações Não Identificadas

Transações marcadas com `needsReview: true` aparecem em relatórios separados.

**Para revisar:**

1. Acesse **Financeiro > Receitas**
2. Filtre por "Não identificado"
3. Edite manualmente para vincular ao cliente correto

## ⚙️ Configuração (Opcional)

Nenhuma configuração especial é necessária. O sistema funciona out-of-the-box.

### Estrutura de Dados

O sistema armazena metadados para rastreabilidade:

**Payment.metadata:**

```json
{
  "source": "csv_import",
  "originalDescription": "Pix recebido - João Silva - CPF 123.456.789-00"
}
```

**Finance.metadata:**

```json
{
  "source": "csv_import",
  "needsReview": true
}
```

## 🛠️ Troubleshooting

### CSV não é aceito

**Problema:** Arquivo rejeitado após seleção

**Solução:**

- Certifique-se que a extensão é `.csv`
- Abra no Excel/LibreOffice e salve novamente como CSV
- Verifique se as colunas estão separadas por vírgula

### Clientes não identificados

**Problema:** Muitas transações sem cliente identificado

**Soluções:**

1. **Adicione CPF/CNPJ aos clientes:**
   - Vá em Clientes
   - Edite cada cliente
   - Preencha CPF ou CNPJ

2. **Padronize nomes:**
   - Nome no sistema deve corresponder ao do Pix
   - Use nome completo quando possível

### Faturas não conciliadas

**Problema:** Cliente identificado mas fatura não vinculada

**Causas comuns:**

- Valor não confere (diferença > R$ 0,01)
- Fatura já paga anteriormente
- Fatura inexistente (criar manualmente)

## 📈 Boas Práticas

1. **Importe regularmente**: Semanal ou mensalmente
2. **Revise não identificados**: Vincule manualmente se necessário
3. **Mantenha CPF/CNPJ atualizados**: Facilita conciliação
4. **Backup do CSV**: Guarde os arquivos originais

## 🔐 Segurança

- CSV é processado no servidor (nunca exposto ao cliente)
- Dados sensíveis não são logados
- Apenas OWNER pode importar CSV
- Transações são registradas no audit log

## 🆘 Suporte

Se encontrar problemas:

1. Verifique o formato do CSV
2. Teste com arquivo menor (10-20 linhas)
3. Consulte os logs do servidor para detalhes

---

**Última atualização:** Dezembro 2024
