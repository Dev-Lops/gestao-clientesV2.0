/**
 * Logger utility - Sistema de logging estruturado e configurável
 *
 * Características:
 * - Níveis de log (debug, info, warn, error)
 * - Condicional por ambiente (dev/prod)
 * - Contexto adicional suportado
 * - Preparado para integração com serviços externos (Sentry, Datadog, etc.)
 *
 * Uso:
 * ```tsx
 * import { logger } from '@/lib/logger';
 *
 * logger.debug('Componente montado', { componentName: 'LoginPage' });
 * logger.info('Usuário logado', { userId: user.id });
 * logger.warn('Recurso deprecated', { resource: 'oldAPI' });
 * logger.error('Erro ao buscar dados', error, { endpoint: '/api/clients' });
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

interface LoggerConfig {
  enabled: boolean
  minLevel: LogLevel
  includeTimestamp: boolean
  includeStackTrace: boolean
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '#6B7280', // gray-500
  info: '#3B82F6', // blue-500
  warn: '#F59E0B', // amber-500
  error: '#EF4444', // red-500
}

const LOG_EMOJIS: Record<LogLevel, string> = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
}

class Logger {
  private config: LoggerConfig

  constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      minLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      includeTimestamp: true,
      includeStackTrace: process.env.NODE_ENV === 'development',
    }
  }

  /**
   * Configura o logger
   */
  configure(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config }
  }

  /**
   * Verifica se o nível de log deve ser registrado
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled && level !== 'error') {
      return false
    }
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel]
  }

  /**
   * Formata a mensagem de log
   */
  private formatMessage(level: LogLevel, message: string): string {
    const parts: string[] = []

    if (this.config.includeTimestamp) {
      const timestamp = new Date().toISOString()
      parts.push(`[${timestamp}]`)
    }

    parts.push(`${LOG_EMOJIS[level]} [${level.toUpperCase()}]`)
    parts.push(message)

    return parts.join(' ')
  }

  /**
   * Formata o contexto adicional
   */
  private formatContext(context?: LogContext): string {
    if (!context || Object.keys(context).length === 0) {
      return ''
    }
    return '\nContext: ' + JSON.stringify(context, null, 2)
  }

  /**
   * Envia log para serviços externos (Sentry, Datadog, etc.)
   */
  private sendToExternalService() {
    // TODO: Integrar com Sentry quando configurado
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   if (level === 'error' && error) {
    //     window.Sentry.captureException(error, { extra: context });
    //   } else {
    //     window.Sentry.captureMessage(message, {
    //       level: level as SeverityLevel,
    //       extra: context,
    //     });
    //   }
    // }
  }

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug(message: string, context?: LogContext) {
    if (!this.shouldLog('debug')) return

    const formattedMessage = this.formatMessage('debug', message)
    const formattedContext = this.formatContext(context)

    if (typeof window !== 'undefined') {
      console.log(
        `%c${formattedMessage}`,
        `color: ${LOG_COLORS.debug}`,
        formattedContext
      )
    } else {
      console.log(formattedMessage + formattedContext)
    }
  }

  /**
   * Log informativo
   */
  info(message: string, context?: LogContext) {
    if (!this.shouldLog('info')) return

    const formattedMessage = this.formatMessage('info', message)
    const formattedContext = this.formatContext(context)

    if (typeof window !== 'undefined') {
      console.log(
        `%c${formattedMessage}`,
        `color: ${LOG_COLORS.info}; font-weight: bold`,
        formattedContext
      )
    } else {
      console.log(formattedMessage + formattedContext)
    }

    this.sendToExternalService()
  }

  /**
   * Log de aviso
   */
  warn(message: string, context?: LogContext) {
    if (!this.shouldLog('warn')) return

    const formattedMessage = this.formatMessage('warn', message)
    const formattedContext = this.formatContext(context)

    if (typeof window !== 'undefined') {
      console.warn(
        `%c${formattedMessage}`,
        `color: ${LOG_COLORS.warn}; font-weight: bold`,
        formattedContext
      )
    } else {
      console.warn(formattedMessage + formattedContext)
    }

    this.sendToExternalService()
  }

  /**
   * Log de erro - sempre registrado
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    // Erro sempre é registrado, independente da configuração
    const formattedMessage = this.formatMessage('error', message)
    const formattedContext = this.formatContext(context)

    if (typeof window !== 'undefined') {
      console.error(
        `%c${formattedMessage}`,
        `color: ${LOG_COLORS.error}; font-weight: bold`,
        formattedContext,
        error
      )
    } else {
      console.error(formattedMessage + formattedContext, error)
    }

    // Stack trace em desenvolvimento
    if (
      this.config.includeStackTrace &&
      error instanceof Error &&
      error.stack
    ) {
      console.error('Stack trace:', error.stack)
    }

    // Sempre enviar erros para serviços externos
    this.sendToExternalService()
  }

  /**
   * Agrupa logs relacionados
   */
  group(label: string, collapsed = false) {
    if (!this.config.enabled) return

    if (collapsed) {
      console.groupCollapsed(label)
    } else {
      console.group(label)
    }
  }

  /**
   * Finaliza grupo de logs
   */
  groupEnd() {
    if (!this.config.enabled) return
    console.groupEnd()
  }

  /**
   * Mede tempo de execução
   */
  time(label: string) {
    if (!this.config.enabled) return
    console.time(label)
  }

  /**
   * Finaliza medição de tempo
   */
  timeEnd(label: string) {
    if (!this.config.enabled) return
    console.timeEnd(label)
  }

  /**
   * Log de tabela (útil para arrays de objetos)
   */
  table(data: unknown) {
    if (!this.config.enabled) return
    console.table(data)
  }
}

// Singleton instance
export const logger = new Logger()

// Export types
export type { LogContext, LoggerConfig, LogLevel }
