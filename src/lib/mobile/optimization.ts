/**
 * Mobile API Optimization Utilities
 *
 * Provides lightweight responses, caching, and pagination for mobile clients
 */

/**
 * Lightweight client response for mobile
 * ~30% smaller than full response
 */
export interface MobileClientResponse {
  id: string
  name: string
  email: string
  avatar?: string | null
  status: 'active' | 'inactive'
}

/**
 * Lightweight invoice response for mobile
 * ~40% smaller than full response
 */
export interface MobileInvoiceResponse {
  id: string
  number: string
  status: string
  totalAmount: number
  dueDate: string
  clientName: string
  clientId: string
}

/**
 * Lightweight transaction response for mobile
 */
export interface MobileTransactionResponse {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  date: string
  description?: string
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  ttl: number // Time to live in seconds
  key: string
  tags?: string[]
}

/**
 * Transform full client to lightweight response
 */
export function toMobileClient(
  client: Record<string, unknown>
): MobileClientResponse {
  return {
    id: String(client.id),
    name: String(client.name),
    email: String(client.email),
    avatar: client.avatar as string | null | undefined,
    status: (client.isActive as boolean) ? 'active' : 'inactive',
  }
}

/**
 * Transform full invoice to lightweight response
 */
export function toMobileInvoice(
  invoice: Record<string, unknown>
): MobileInvoiceResponse {
  return {
    id: String(invoice.id),
    number: String(invoice.invoiceNumber),
    status: String(invoice.status),
    totalAmount: Number(invoice.totalAmount),
    dueDate: (invoice.dueDate as Date).toISOString(),
    clientName:
      ((invoice.client as Record<string, unknown>)?.name as string) ||
      'Unknown',
    clientId: String(invoice.clientId),
  }
}

/**
 * Transform full transaction to lightweight response
 */
export function toMobileTransaction(
  transaction: Record<string, unknown>
): MobileTransactionResponse {
  return {
    id: String(transaction.id),
    type: transaction.type as 'income' | 'expense',
    amount: Number(transaction.amount),
    category: String(transaction.category),
    date: (transaction.date as Date).toISOString(),
    description: transaction.description as string | undefined,
  }
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit)
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  }
}

/**
 * Build paginated response
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  return {
    data,
    meta: calculatePaginationMeta(total, page, limit),
  }
}

/**
 * Validate and normalize pagination params
 */
export function normalizePaginationParams(
  page?: string | number,
  limit?: string | number
): { page: number; limit: number } {
  let normalizedPage = 1
  let normalizedLimit = 20 // Default mobile limit

  if (page) {
    const p = typeof page === 'string' ? parseInt(page) : page
    normalizedPage = Math.max(1, p)
  }

  if (limit) {
    const l = typeof limit === 'string' ? parseInt(limit) : limit
    // Cap at 100 for mobile (prevent abuse)
    normalizedLimit = Math.min(100, Math.max(5, l))
  }

  return { page: normalizedPage, limit: normalizedLimit }
}

/**
 * Calculate offset for pagination
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit
}

/**
 * Build Prisma skip/take for pagination
 */
export function getPrismaSkipTake(
  page: number,
  limit: number
): { skip: number; take: number } {
  return {
    skip: calculateOffset(page, limit),
    take: limit,
  }
}

/**
 * Estimate response size reduction
 */
export function estimateMobileResponseReduction(
  originalSize: number,
  reductionPercent: number = 30
): number {
  return Math.ceil(originalSize * ((100 - reductionPercent) / 100))
}

/**
 * Build cache key for mobile endpoints
 */
export function buildMobilesCacheKey(
  endpoint: string,
  userId: string,
  params?: Record<string, unknown>
): string {
  const paramStr = params ? JSON.stringify(params).replace(/\s/g, '') : ''
  return `mobile:${endpoint}:${userId}:${paramStr}`
}

/**
 * Get cache TTL based on endpoint
 */
export function getCacheTTL(endpoint: string): number {
  const ttlMap: Record<string, number> = {
    // 5 minutes for relatively static data
    '/clients': 5 * 60,
    '/invoices': 3 * 60,
    '/transactions': 2 * 60,
    '/dashboard': 1 * 60,
    // 30 seconds for frequently changing data
    '/balance': 30,
    '/pending': 30,
  }

  return ttlMap[endpoint] || 5 * 60 // Default 5 minutes
}

/**
 * Compress response using gzip
 * (Note: actual gzip compression is handled by middleware)
 */
export function isCompressionNeeded(sizeInBytes: number): boolean {
  return sizeInBytes > 1024 // Compress responses > 1KB
}
