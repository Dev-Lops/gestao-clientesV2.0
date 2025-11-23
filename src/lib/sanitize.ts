import DOMPurify from 'dompurify'

// Lazily initialize DOMPurify + JSDOM to avoid loading `jsdom` at module
// evaluation time (fixes ESM/CommonJS issues with parse5/jsdom on Netlify).
type PurifyInstance = ReturnType<typeof DOMPurify>
let purify: PurifyInstance | null = null
let purifyInitializing: Promise<PurifyInstance> | null = null

async function ensurePurify(): Promise<PurifyInstance> {
  if (purify) return purify
  if (purifyInitializing) return purifyInitializing
  purifyInitializing = (async () => {
    const jsdom = await import('jsdom')
    const { JSDOM } = jsdom as any
    const window = new JSDOM('').window
    purify = DOMPurify(window)
    return purify as PurifyInstance
  })()
  const instance = await purifyInitializing
  purifyInitializing = null
  return instance
}

/**
 * Sanitiza HTML removendo scripts maliciosos e tags perigosas
 * @param html - String HTML para sanitizar
 * @returns HTML sanitizado
 */
export async function sanitizeHtml(html: string): Promise<string> {
  try {
    const p = await ensurePurify()
    return p.sanitize(html, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        'ul',
        'ol',
        'li',
        'a',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'blockquote',
        'code',
        'pre',
        'span',
        'div',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      ALLOW_DATA_ATTR: false,
    })
  } catch (err) {
    // If DOMPurify/jsdom cannot be initialized (e.g. ESM/CJS conflict), fall
    // back to a conservative HTML-stripping sanitizer to avoid crashing the
    // server. This keeps the app available while preventing script injection.
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim()
  }
}

/**
 * Sanitiza texto simples removendo caracteres potencialmente perigosos
 * @param text - Texto para sanitizar
 * @returns Texto sanitizado
 */
export function sanitizeText(text: string): string {
  if (!text) return ''

  // Remove null bytes e caracteres de controle
  let sanitized = text.replace(/\0/g, '')
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // Escapa HTML básico
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')

  return sanitized.trim()
}

/**
 * Sanitiza URL verificando protocolo e removendo javascript:
 * @param url - URL para sanitizar
 * @returns URL sanitizada ou string vazia se inválida
 */
export function sanitizeUrl(url: string): string {
  if (!url) return ''

  const trimmed = url.trim().toLowerCase()

  // Bloqueia protocolos perigosos
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return ''
  }

  try {
    const parsed = new URL(url)
    // Permite apenas http, https, mailto
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return ''
    }
    return parsed.toString()
  } catch {
    // Se não for URL válida, retorna vazio
    return ''
  }
}

/**
 * Sanitiza objeto recursivamente aplicando sanitização apropriada por tipo
 * @param obj - Objeto para sanitizar
 * @param options - Opções de sanitização
 * @returns Objeto sanitizado
 */
export async function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    htmlFields?: string[]
    textFields?: string[]
    urlFields?: string[]
  } = {}
): Promise<T> {
  const { htmlFields = [], textFields = [], urlFields = [] } = options
  const sanitized = { ...obj }

  for (const key in sanitized) {
    const value = sanitized[key]

    if (value === null || value === undefined) {
      continue
    }

    // Preserve Date instances and other non-plain objects that shouldn't be sanitized recursively
    if (value instanceof Date) {
      // keep as-is
      sanitized[key] = value as T[Extract<keyof T, string>]
      continue
    }

    if (typeof value === 'string') {
      if (htmlFields.includes(key)) {
        // sanitizeHtml is async
        // eslint-disable-next-line no-await-in-loop
        sanitized[key] = (await sanitizeHtml(value)) as T[Extract<
          keyof T,
          string
        >]
      } else if (urlFields.includes(key)) {
        sanitized[key] = sanitizeUrl(value) as T[Extract<keyof T, string>]
      } else if (textFields.includes(key)) {
        sanitized[key] = sanitizeText(value) as T[Extract<keyof T, string>]
      }
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeText(item) : item
      ) as T[Extract<keyof T, string>]
    } else if (typeof value === 'object') {
      // Only deeply sanitize plain objects; leave other instances as-is
      const isPlainObject =
        Object.prototype.toString.call(value) === '[object Object]'
      if (isPlainObject) {
        // recursive sanitizeObject is async
        // eslint-disable-next-line no-await-in-loop
        sanitized[key] = (await sanitizeObject(
          value as Record<string, unknown>,
          options
        )) as T[Extract<keyof T, string>]
      } else {
        sanitized[key] = value as T[Extract<keyof T, string>]
      }
    }
  }

  return sanitized
}

/**
 * Validação de email básica
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validação de telefone brasileiro
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+55\s?)?(\(?\d{2}\)?\s?)?9?\d{4}-?\d{4}$/
  return phoneRegex.test(phone)
}
