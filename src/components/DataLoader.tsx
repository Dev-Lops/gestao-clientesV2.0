'use client'

import { ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface DataLoaderProps {
  loading: boolean
  error: Error | null
  data: unknown
  children: ReactNode
  skeleton: ReactNode
  loadingState?: 'skeleton' | 'spinner' | 'fade'
}

/**
 * Componente wrapper que gerencia estados de carregamento
 * Renderiza skeleton enquanto carrega, erro se falhar, ou conteúdo se sucesso
 */
export function DataLoader({
  loading,
  error,
  data,
  children,
  skeleton,
  loadingState = 'skeleton',
}: DataLoaderProps) {
  // Carregando
  if (loading) {
    if (loadingState === 'spinner') {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full bg-background" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-r from-primary to-primary/50 animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">Carregando dados...</p>
          </div>
        </div>
      )
    }

    return <div className={loadingState === 'fade' ? 'opacity-50' : ''}>{skeleton}</div>
  }

  // Erro
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    )
  }

  // Sem dados
  if (!data) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Nenhum dado disponível</AlertDescription>
      </Alert>
    )
  }

  // Conteúdo
  return <>{children}</>
}

interface PartialDataLoaderProps {
  /**
   * Se true, mostra skeleton enquanto carrega (padrão)
   * Se false, mostra conteúdo anterior enquanto carrega
   */
  showSkeletonWhileLoading?: boolean
  isRefetching?: boolean
  children: ReactNode
  skeleton: ReactNode
}

/**
 * Versão parcial que mostra skeleton sobre o conteúdo anterior
 * Útil para atualizar dados sem descartar o conteúdo antigo
 */
export function PartialDataLoader({
  showSkeletonWhileLoading = true,
  isRefetching = false,
  children,
  skeleton,
}: PartialDataLoaderProps) {
  if (isRefetching && showSkeletonWhileLoading) {
    return <div className="opacity-60 pointer-events-none">{skeleton}</div>
  }

  if (isRefetching) {
    return <div className="opacity-50 transition-opacity">{children}</div>
  }

  return <>{children}</>
}
