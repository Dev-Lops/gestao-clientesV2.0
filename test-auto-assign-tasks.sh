#!/bin/bash

# Script de teste para atribuição automática de tasks
# Testa os 3 cenários principais

echo "=========================================="
echo "🧪 TESTE: Atribuição Automática de Tasks"
echo "=========================================="
echo ""

# Configuração
API_URL="http://localhost:3000/api/tasks/v2"
ORG_ID="clg7z9q4w0000qz088a1b2c3d"  # Substitua com org real
PRIORITY="MEDIUM"

echo "📋 Cenário 1: Criar task SEM assignee (atribuição automática)"
echo "---"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Task com atribuição automática\",
    \"orgId\": \"$ORG_ID\",
    \"priority\": \"$PRIORITY\",
    \"description\": \"Esta task será atribuída automaticamente ao owner ou staff\"
  }" | jq .
echo ""
echo ""

echo "📋 Cenário 2: Criar task COM autoAssign=false"
echo "---"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Task sem atribuição automática\",
    \"orgId\": \"$ORG_ID\",
    \"priority\": \"$PRIORITY\",
    \"autoAssign\": false,
    \"description\": \"Esta task NÃO será atribuída automaticamente\"
  }" | jq .
echo ""
echo ""

echo "📋 Cenário 3: Criar task COM assignee específico"
echo "---"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Task com assignee manual\",
    \"orgId\": \"$ORG_ID\",
    \"priority\": \"$PRIORITY\",
    \"assignee\": \"clu1234567890abcdefghijkl\",
    \"description\": \"Esta task tem assignee específico\"
  }" | jq .
echo ""
echo ""

echo "✅ Testes concluídos!"
