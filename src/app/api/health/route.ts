import { NextResponse } from 'next/server'

/**
 * Health Check Endpoint
 *
 * Este endpoint é usado para:
 * - Docker health checks
 * - Load balancers
 * - Monitoring systems
 * - Verificar se a aplicação está respondendo
 */
export async function GET() {
  try {
    // Verificação básica de saúde
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    }

    return NextResponse.json(health, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
