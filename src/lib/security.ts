import { NextRequest, NextResponse } from 'next/server'
import { createMasterAdminClient } from './supabase/server'

/**
 * Helpers de seguridad reutilizables en APIs:
 * - rateLimit() — limita por IP/email
 * - validateBody() — valida shape y tipo
 * - auditLog() — registra acciones críticas
 * - getClientIP() — IP real detrás de proxies
 */

/**
 * Detecta IP real considerando Vercel/Cloudflare headers
 */
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}

/**
 * Rate limit usando RPC en Postgres.
 * Devuelve { allowed: false } si excede.
 *
 * @param identifier - IP, email, cliente_id, etc.
 * @param endpoint - Nombre lógico (ej: 'login', 'config-update')
 * @param maxRequests - Máximo en la ventana
 * @param windowSeconds - Tamaño de la ventana
 */
export async function rateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number = 60,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const admin = createMasterAdminClient()

  try {
    const { data, error } = await admin.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds,
    })

    if (error || !data || !data[0]) {
      // Si falla el RPC, permitimos pero loggeamos (fail-open por disponibilidad)
      console.error('rateLimit RPC error:', error)
      return { allowed: true, remaining: maxRequests, resetAt: new Date() }
    }

    const row = data[0]
    return {
      allowed: row.allowed,
      remaining: Math.max(0, maxRequests - row.current_count),
      resetAt: new Date(row.reset_at),
    }
  } catch (e) {
    console.error('rateLimit exception:', e)
    return { allowed: true, remaining: maxRequests, resetAt: new Date() }
  }
}

/**
 * Wrapper de rate limit para usar en APIs.
 * Devuelve NextResponse 429 si bloqueado, null si OK.
 */
export async function rateLimitGuard(
  req: NextRequest,
  endpoint: string,
  maxRequests: number = 60,
  windowSeconds: number = 60
): Promise<NextResponse | null> {
  const ip = getClientIP(req)
  const result = await rateLimit(ip, endpoint, maxRequests, windowSeconds)
  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Demasiadas solicitudes. Intentá de nuevo en un momento.',
        retryAfter: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }
  return null
}

/**
 * Validador simple de shape de body. Reemplaza Zod para casos básicos.
 * Devuelve { ok: true, data } o { ok: false, error }
 */
type FieldSpec = {
  type: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'uuid' | 'array' | 'object'
  required?: boolean
  maxLength?: number
  minLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  enum?: any[]
  itemType?: 'string' | 'number'
}

export type Schema = Record<string, FieldSpec>

export function validateBody<T = any>(body: any, schema: Schema): { ok: true; data: T } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Body inválido (no es objeto)' }
  }

  const result: any = {}
  const errors: string[] = []

  for (const [field, spec] of Object.entries(schema)) {
    const value = body[field]
    const present = value !== undefined && value !== null

    if (!present) {
      if (spec.required) errors.push(`Campo "${field}" es obligatorio`)
      continue
    }

    // Validación por tipo
    switch (spec.type) {
      case 'string':
        if (typeof value !== 'string') { errors.push(`"${field}" debe ser string`); break }
        if (spec.maxLength && value.length > spec.maxLength) errors.push(`"${field}" excede ${spec.maxLength} caracteres`)
        if (spec.minLength && value.length < spec.minLength) errors.push(`"${field}" debe tener al menos ${spec.minLength} caracteres`)
        if (spec.pattern && !spec.pattern.test(value)) errors.push(`"${field}" formato inválido`)
        if (spec.enum && !spec.enum.includes(value)) errors.push(`"${field}" debe ser uno de: ${spec.enum.join(', ')}`)
        result[field] = value
        break
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) { errors.push(`"${field}" debe ser número`); break }
        if (spec.min !== undefined && value < spec.min) errors.push(`"${field}" mínimo ${spec.min}`)
        if (spec.max !== undefined && value > spec.max) errors.push(`"${field}" máximo ${spec.max}`)
        result[field] = value
        break
      case 'boolean':
        if (typeof value !== 'boolean') { errors.push(`"${field}" debe ser boolean`); break }
        result[field] = value
        break
      case 'email':
        if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`"${field}" debe ser email válido`)
          break
        }
        result[field] = value.toLowerCase().trim()
        break
      case 'url':
        if (typeof value !== 'string') { errors.push(`"${field}" debe ser URL`); break }
        try {
          const u = new URL(value)
          if (!['http:', 'https:'].includes(u.protocol)) {
            errors.push(`"${field}" debe ser http o https`)
            break
          }
          result[field] = value.trim()
        } catch {
          errors.push(`"${field}" URL inválida`)
        }
        break
      case 'uuid':
        if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
          errors.push(`"${field}" debe ser UUID`)
          break
        }
        result[field] = value
        break
      case 'array':
        if (!Array.isArray(value)) { errors.push(`"${field}" debe ser array`); break }
        if (spec.maxLength && value.length > spec.maxLength) errors.push(`"${field}" excede ${spec.maxLength} items`)
        if (spec.itemType) {
          for (const item of value) {
            if (typeof item !== spec.itemType) {
              errors.push(`Items de "${field}" deben ser ${spec.itemType}`)
              break
            }
          }
        }
        result[field] = value
        break
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) { errors.push(`"${field}" debe ser objeto`); break }
        result[field] = value
        break
    }
  }

  if (errors.length > 0) {
    return { ok: false, error: errors.join('; ') }
  }
  return { ok: true, data: result as T }
}

/**
 * Sanitiza un string para evitar SQL injection en LIKE / OR queries.
 * Escapa caracteres % y _.
 */
export function sanitizeLikePattern(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&')
}

/**
 * Registra una acción crítica en master.audit_log.
 * No falla si hay error (best-effort).
 */
export async function auditLog(
  clienteId: string | null,
  accion: string,
  detalles?: any,
  req?: NextRequest
): Promise<void> {
  try {
    const admin = createMasterAdminClient()
    await admin.from('audit_log').insert({
      cliente_id: clienteId,
      accion,
      detalles: detalles ?? null,
      ip_address: req ? getClientIP(req) : null,
      user_agent: req?.headers.get('user-agent') ?? null,
    })
  } catch (e) {
    console.error('auditLog error:', e)
  }
}

/**
 * Enmascara una API key para mostrar al usuario (sk-ant-...XXXX)
 */
export function maskKey(key: string | null | undefined): string {
  if (!key) return 'no configurada'
  if (key.length < 12) return '••••'
  return `${key.substring(0, 8)}…${key.substring(key.length - 4)}`
}
