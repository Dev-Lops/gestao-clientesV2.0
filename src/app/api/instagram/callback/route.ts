import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/instagram/callback?code=xxx&state=clientId
 * Callback do OAuth do Instagram - recebe o código de autorização e troca por access token
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const clientId = searchParams.get('state') // O clientId foi passado como state
    const error = searchParams.get('error')
    const errorReason = searchParams.get('error_reason')
    const errorDescription = searchParams.get('error_description')

    // Se o usuário negou a autorização
    if (error) {
      console.error(
        'Instagram OAuth error:',
        error,
        errorReason,
        errorDescription
      )
      return NextResponse.redirect(
        new URL(
          `/clients/${clientId}/info?instagram_error=${
            errorDescription || 'Autorização negada'
          }`,
          req.url
        )
      )
    }

    if (!code || !clientId) {
      return NextResponse.json(
        { error: 'Código de autorização ou clientId não fornecido' },
        { status: 400 }
      )
    }

    const appId = process.env.INSTAGRAM_APP_ID
    const appSecret = process.env.INSTAGRAM_APP_SECRET
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI

    if (!appId || !appSecret || !redirectUri) {
      return NextResponse.json(
        { error: 'Instagram não configurado no servidor' },
        { status: 500 }
      )
    }

    // Passo 1: Trocar código por short-lived token
    const tokenResponse = await fetch(
      'https://api.instagram.com/oauth/access_token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code,
        }),
      }
    )

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Instagram token exchange error:', errorData)
      return NextResponse.redirect(
        new URL(
          `/clients/${clientId}/info?instagram_error=Erro ao obter token do Instagram`,
          req.url
        )
      )
    }

    const tokenData = await tokenResponse.json()
    const shortLivedToken = tokenData.access_token
    const instagramUserId = tokenData.user_id

    // Passo 2: Trocar short-lived token por long-lived token (dura 60 dias)
    const longLivedResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortLivedToken}`
    )

    if (!longLivedResponse.ok) {
      const errorData = await longLivedResponse.json()
      console.error('Instagram long-lived token error:', errorData)
      // Mesmo se falhar, vamos salvar o short-lived token (dura 1 hora)
      await updateClientInstagramData(
        clientId,
        shortLivedToken,
        instagramUserId,
        3600
      )
      return NextResponse.redirect(
        new URL(
          `/clients/${clientId}/info?instagram_success=true&instagram_warning=Token de curta duração`,
          req.url
        )
      )
    }

    const longLivedData = await longLivedResponse.json()
    const accessToken = longLivedData.access_token
    const expiresIn = longLivedData.expires_in // Segundos até expirar (geralmente 5184000 = 60 dias)

    // Passo 3: Buscar informações do perfil do Instagram
    const profileResponse = await fetch(
      `https://graph.instagram.com/${instagramUserId}?fields=id,username&access_token=${accessToken}`
    )

    let instagramUsername = null
    if (profileResponse.ok) {
      const profileData = await profileResponse.json()
      instagramUsername = profileData.username
    }

    // Passo 4: Salvar token e informações no banco de dados
    await updateClientInstagramData(
      clientId,
      accessToken,
      instagramUserId,
      expiresIn,
      instagramUsername
    )

    // Redirecionar de volta para a página do cliente com sucesso
    return NextResponse.redirect(
      new URL(`/clients/${clientId}/info?instagram_success=true`, req.url)
    )
  } catch (error) {
    console.error('Erro no callback do Instagram:', error)
    return NextResponse.json(
      { error: 'Erro ao processar callback do Instagram' },
      { status: 500 }
    )
  }
}

/**
 * Atualiza os dados do Instagram do cliente no banco de dados
 */
async function updateClientInstagramData(
  clientId: string,
  accessToken: string,
  instagramUserId: string,
  expiresIn: number,
  instagramUsername?: string | null
) {
  const expiresAt = new Date(Date.now() + expiresIn * 1000)

  await prisma.client.update({
    where: { id: clientId },
    data: {
      instagramAccessToken: accessToken,
      instagramUserId,
      instagramTokenExpiresAt: expiresAt,
      ...(instagramUsername && { instagramUsername }),
    },
  })
}
