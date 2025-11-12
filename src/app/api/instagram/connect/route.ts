import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/instagram/connect?clientId=xxx
 * Retorna a URL de autorização do Instagram OAuth para o cliente conectar sua conta
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId é obrigatório' },
        { status: 400 }
      )
    }

    const appId = process.env.INSTAGRAM_APP_ID
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI

    if (!appId || !redirectUri) {
      return NextResponse.json(
        {
          error:
            'Instagram não configurado. Configure INSTAGRAM_APP_ID e INSTAGRAM_REDIRECT_URI no arquivo .env',
          details: {
            hasAppId: !!appId,
            hasRedirectUri: !!redirectUri,
            hint: 'Verifique o arquivo INSTAGRAM_TROUBLESHOOTING.md para instruções detalhadas',
          },
        },
        { status: 500 }
      )
    }

    // Validar formato do App ID (deve ser numérico)
    if (!/^\d+$/.test(appId)) {
      return NextResponse.json(
        {
          error: 'INSTAGRAM_APP_ID inválido. Deve ser um número sem aspas.',
          example: 'INSTAGRAM_APP_ID=123456789012345',
          hint: 'Copie o Instagram App ID (não o Facebook App ID) da seção Instagram Basic Display no Facebook Developers',
        },
        { status: 500 }
      )
    }

    // URL de autorização do Instagram Basic Display API
    const authUrl = new URL('https://api.instagram.com/oauth/authorize')
    authUrl.searchParams.set('client_id', appId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', 'user_profile,user_media')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('state', clientId) // Usa clientId como state para identificar o cliente

    console.log('[Instagram OAuth] Gerando URL de autorização:', {
      appId: appId.substring(0, 4) + '...',
      redirectUri,
      clientId,
    })

    return NextResponse.json({ authUrl: authUrl.toString() })
  } catch (error) {
    console.error('Erro ao gerar URL de autorização do Instagram:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar URL de autorização' },
      { status: 500 }
    )
  }
}
