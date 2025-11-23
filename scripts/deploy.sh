#!/bin/bash

# =============================================================================
# Script de Deploy para Produção
# =============================================================================
# Este script automatiza o processo de deploy para produção
# =============================================================================

set -e  # Sair em caso de erro

echo "🚀 Iniciando deploy para produção..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se estamos na branch correta
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "master" ]; then
    echo -e "${RED}❌ Erro: Deploy deve ser feito a partir da branch master${NC}"
    echo -e "${YELLOW}Branch atual: $CURRENT_BRANCH${NC}"
    exit 1
fi

# Verificar se há mudanças não commitadas
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}❌ Erro: Há mudanças não commitadas${NC}"
    git status -s
    exit 1
fi

# Atualizar do remoto
echo "📥 Atualizando do remoto..."
git pull origin master

# Verificar variáveis de ambiente
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Erro: Arquivo .env.production não encontrado${NC}"
    echo -e "${YELLOW}Copie .env.production.example e configure as variáveis${NC}"
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
pnpm install --frozen-lockfile

# Gerar Prisma Client
echo "🔧 Gerando Prisma Client..."
pnpm prisma:generate

# Executar migrações do banco
echo "🗄️  Executando migrações do banco de dados..."
read -p "Deseja executar as migrações? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pnpm prisma:deploy
fi

# Executar testes
echo "🧪 Executando testes..."
pnpm test

# Build da aplicação
echo "🏗️  Construindo aplicação..."
pnpm build

# Verificar se o build foi bem sucedido
if [ ! -d ".next" ]; then
    echo -e "${RED}❌ Erro: Build falhou - diretório .next não encontrado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"

# Perguntar se deseja fazer deploy via Docker
read -p "Deseja fazer deploy via Docker? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🐳 Construindo imagem Docker..."
    docker-compose -f docker-compose.prod.yml build
    
    echo "🚢 Iniciando containers..."
    docker-compose -f docker-compose.prod.yml up -d
    
    echo -e "${GREEN}✅ Deploy Docker concluído!${NC}"
fi

echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo ""
echo "📋 Próximos passos:"
echo "  1. Verifique os logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  2. Acesse a aplicação: http://localhost:3000"
echo "  3. Configure o proxy reverso (nginx) se necessário"
echo ""
