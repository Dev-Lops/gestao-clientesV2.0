# Script de teste do sistema de pagamento automático
# Execute com: .\test-payment-system.ps1

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  TESTE - SISTEMA DE PAGAMENTO AUTOMÁTICO" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Verificar se o servidor está rodando
Write-Host "1. Verificando se o servidor está rodando..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $baseUrl -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Servidor está rodando!" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Servidor não está rodando!" -ForegroundColor Red
    Write-Host "   Execute 'pnpm dev' primeiro!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  TESTE 1: Processamento Manual (OWNER)" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Chamando: POST /api/admin/process-payments" -ForegroundColor Yellow
Write-Host "Este endpoint processa os pagamentos do mês atual" -ForegroundColor Gray
Write-Host ""

try {
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/admin/process-payments" -Method POST -Headers $headers -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ SUCESSO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Resultados:" -ForegroundColor Cyan
    Write-Host "  - Clientes processados: $($result.results.processed)" -ForegroundColor White
    Write-Host "  - Entradas criadas: $($result.results.created)" -ForegroundColor White
    Write-Host "  - Parcelas atualizadas: $($result.results.updated)" -ForegroundColor White
    Write-Host "  - Erros: $($result.results.errors)" -ForegroundColor White
    Write-Host "  - Mês: $($result.month)" -ForegroundColor White
    Write-Host ""
    
    if ($result.results.details.Count -gt 0) {
        Write-Host "Detalhes por cliente:" -ForegroundColor Cyan
        foreach ($detail in $result.results.details) {
            Write-Host ""
            Write-Host "  Cliente: $($detail.client)" -ForegroundColor Yellow
            Write-Host "    Valor: R$ $($detail.amount)" -ForegroundColor White
            Write-Host "    Tipo: $($detail.type)" -ForegroundColor White
            Write-Host "    Ação: $($detail.action)" -ForegroundColor White
            
            if ($detail.installment) {
                Write-Host "    Parcela: $($detail.installment.number)/$($detail.installment.total)" -ForegroundColor White
                Write-Host "    Status: $($detail.installment.status)" -ForegroundColor White
            }
        }
    } else {
        Write-Host "⚠️  Nenhum cliente para processar" -ForegroundColor Yellow
        Write-Host "   Certifique-se de ter clientes ativos com:" -ForegroundColor Gray
        Write-Host "   - Valor de contrato definido (pagamento mensal)" -ForegroundColor Gray
        Write-Host "   - Ou parcelas criadas (pagamento parcelado)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Resposta completa salva em: test-payment-result.json" -ForegroundColor Gray
    $result | ConvertTo-Json -Depth 10 | Out-File "test-payment-result.json"
    
} catch {
    Write-Host "❌ ERRO!" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 401) {
            Write-Host "Você não está autenticado!" -ForegroundColor Yellow
            Write-Host "Faça login no sistema primeiro." -ForegroundColor Yellow
        } elseif ($statusCode -eq 403) {
            Write-Host "Você não tem permissão (apenas OWNER)!" -ForegroundColor Yellow
            Write-Host "Entre com uma conta de OWNER." -ForegroundColor Yellow
        } else {
            Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  TESTE 2: Endpoint do Cron (Simulação)" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Chamando: GET /api/cron/process-monthly-payments" -ForegroundColor Yellow
Write-Host "Este endpoint simula o que o cron fará em produção" -ForegroundColor Gray
Write-Host ""

try {
    $cronSecret = "gc-2024-cron-secret-pay-auto-q8w9e7r6t5y4u3i2o1p0"
    $headers = @{
        "Authorization" = "Bearer $cronSecret"
    }
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/cron/process-monthly-payments" -Method GET -Headers $headers -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ SUCESSO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Resultados:" -ForegroundColor Cyan
    Write-Host "  - Clientes processados: $($result.results.processed)" -ForegroundColor White
    Write-Host "  - Entradas criadas: $($result.results.created)" -ForegroundColor White
    Write-Host "  - Erros: $($result.results.errors)" -ForegroundColor White
    Write-Host ""
    
    if ($result.results.details.Count -gt 0) {
        Write-Host "Detalhes por cliente:" -ForegroundColor Cyan
        foreach ($detail in $result.results.details) {
            Write-Host ""
            Write-Host "  Cliente: $($detail.client)" -ForegroundColor Yellow
            Write-Host "    Valor: R$ $($detail.amount)" -ForegroundColor White
            Write-Host "    Tipo: $($detail.type)" -ForegroundColor White
        }
    } else {
        Write-Host "⚠️  Nenhum cliente processado" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Resposta completa salva em: test-cron-result.json" -ForegroundColor Gray
    $result | ConvertTo-Json -Depth 10 | Out-File "test-cron-result.json"
    
} catch {
    Write-Host "❌ ERRO!" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 401) {
            Write-Host "Token de autorização inválido!" -ForegroundColor Yellow
            Write-Host "Verifique se CRON_SECRET no .env está correto." -ForegroundColor Yellow
        } else {
            Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  TESTE FINALIZADO!" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Verifique as entradas criadas no financeiro do sistema" -ForegroundColor White
Write-Host "2. Teste marcar uma parcela como 'paga' e veja a integração" -ForegroundColor White
Write-Host "3. Para produção, configure CRON_SECRET no Vercel" -ForegroundColor White
Write-Host ""
Write-Host "Documentação completa: GUIA_PAGAMENTO_AUTOMATICO.md" -ForegroundColor Gray
Write-Host ""
