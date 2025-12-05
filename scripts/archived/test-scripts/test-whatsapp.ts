/**
 * Script para testar configuração do WhatsApp
 *
 * Uso:
 *   pnpm exec tsx scripts/test-whatsapp.ts
 *
 * Ou com número customizado:
 *   TEST_PHONE=+5511999998888 pnpm exec tsx scripts/test-whatsapp.ts
 */

import { WhatsAppService } from '../src/services/notifications/WhatsAppService'

async function test() {
  console.log('🔍 Testando Configuração WhatsApp\n')
  console.log('='.repeat(60))

  // Verificar variáveis de ambiente
  console.log('\n📋 Variáveis de Ambiente:')
  console.log('-'.repeat(60))

  const checks = [
    { name: 'WHATSAPP_API_URL', value: process.env.WHATSAPP_API_URL },
    { name: 'WHATSAPP_API_TOKEN', value: process.env.WHATSAPP_API_TOKEN },
    { name: 'WHATSAPP_PROVIDER', value: process.env.WHATSAPP_PROVIDER },
    {
      name: 'WHATSAPP_PHONE_NUMBER_ID',
      value: process.env.WHATSAPP_PHONE_NUMBER_ID,
    },
    { name: 'PIX_KEY', value: process.env.PIX_KEY },
    { name: 'APP_URL', value: process.env.APP_URL },
    {
      name: 'WHATSAPP_SEND_AUTOMATIC',
      value: process.env.WHATSAPP_SEND_AUTOMATIC,
    },
  ]

  let allConfigured = true

  for (const check of checks) {
    const status = check.value ? '✅' : '❌'
    const display = check.value
      ? check.name.includes('TOKEN') || check.name.includes('KEY')
        ? `${check.value.substring(0, 10)}...`
        : check.value
      : 'NÃO CONFIGURADO'

    console.log(`${status} ${check.name.padEnd(25)} = ${display}`)

    if (!check.value && check.name !== 'WHATSAPP_SEND_AUTOMATIC') {
      allConfigured = false
    }
  }

  console.log('\n🔌 Status do Serviço:')
  console.log('-'.repeat(60))
  const enabled = WhatsAppService.isEnabled()
  console.log(enabled ? '✅ WhatsApp HABILITADO' : '❌ WhatsApp DESABILITADO')

  if (!allConfigured) {
    console.log('\n⚠️  Algumas variáveis não estão configuradas!')
    console.log('📖 Consulte: docs/WHATSAPP_SETUP_GUIDE.md')
    console.log(
      '\n💡 Crie arquivo .env.local na raiz com (exemplo Meta rápido):'
    )
    console.log(`
  WHATSAPP_PROVIDER=meta
  WHATSAPP_PHONE_NUMBER_ID=SEU_PHONE_NUMBER_ID
  WHATSAPP_API_TOKEN=SEU_TOKEN_AQUI
  PIX_KEY=sua_chave_pix
  APP_URL=http://localhost:3000
  WHATSAPP_SEND_AUTOMATIC=true
  `)
    process.exit(1)
  }

  // Teste de envio (opcional)
  const testPhone = process.env.TEST_PHONE

  if (testPhone) {
    console.log('\n📱 Enviando Mensagem de Teste:')
    console.log('-'.repeat(60))
    console.log(`Para: ${testPhone}`)

    const result = await WhatsAppService.send({
      to: testPhone,
      body: `✅ Teste de configuração WhatsApp\n\nData/Hora: ${new Date().toLocaleString('pt-BR')}\n\nSe você recebeu esta mensagem, a configuração está funcionando corretamente!`,
    })

    console.log('\n📊 Resultado:')
    console.log(JSON.stringify(result, null, 2))

    if (result.ok) {
      console.log('\n✅ SUCESSO! Mensagem enviada.')
      console.log('📱 Verifique o WhatsApp do número: ' + testPhone)
    } else {
      console.log('\n❌ ERRO ao enviar mensagem:')
      console.log(result.error || 'Erro desconhecido')

      if (result.error?.includes('Invalid phone number')) {
        console.log(
          '\n💡 Dica: O número deve estar no formato E.164: +5511999998888'
        )
      }
      if (result.error?.includes('(#130429)')) {
        console.log(
          '\n💡 Dica: Adicione este número nos "Test numbers" no painel Meta'
        )
      }
      if (result.error?.includes('token')) {
        console.log(
          '\n💡 Dica: Verifique se o token não expirou. Gere um permanente.'
        )
      }
    }
  } else {
    console.log('\n📱 Teste de Envio:')
    console.log('-'.repeat(60))
    console.log('⏭️  Pulado (defina TEST_PHONE para testar envio)')
    console.log('\nPara testar:')
    console.log(
      '  TEST_PHONE=+5511999998888 pnpm exec tsx scripts/test-whatsapp.ts'
    )
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Teste concluído!\n')
}

test().catch((err) => {
  console.error('\n❌ Erro fatal:', err)
  process.exit(1)
})
