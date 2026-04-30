import { NextRequest, NextResponse } from 'next/server'
import { getClienteContext } from '@/lib/cliente-db'
import { createMasterAdminClient } from '@/lib/supabase/server'
import { rateLimitGuard, validateBody, auditLog } from '@/lib/security'

/**
 * Valida una key contra Anthropic API
 */
async function validarClaudeKey(key: string): Promise<{ ok: boolean; error?: string }> {
  if (!key.startsWith('sk-ant-')) {
    return { ok: false, error: 'La key debe empezar con sk-ant-' }
  }
  try {
    const ctrl = new AbortController()
    const tm = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'ping' }],
      }),
      signal: ctrl.signal,
    })
    clearTimeout(tm)
    if (res.ok) return { ok: true }
    if (res.status === 401) return { ok: false, error: 'Key inválida (401 Unauthorized)' }
    if (res.status === 429) return { ok: false, error: 'Rate limit en Anthropic, probá en unos segundos' }
    if (res.status === 400) {
      // Probablemente modelo no disponible — la key es válida igual
      return { ok: true }
    }
    return { ok: false, error: `Anthropic respondió ${res.status}` }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Error de red' }
  }
}

/**
 * Valida una key + email contra Resend
 */
async function validarResendKey(key: string, fromEmail: string): Promise<{ ok: boolean; error?: string }> {
  if (!key.startsWith('re_')) {
    return { ok: false, error: 'La key debe empezar con re_' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
    return { ok: false, error: 'Email FROM inválido' }
  }
  try {
    // Usar GET /domains para validar la key sin enviar emails
    const ctrl = new AbortController()
    const tm = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${key}` },
      signal: ctrl.signal,
    })
    clearTimeout(tm)
    if (res.status === 401) return { ok: false, error: 'Key inválida (401)' }
    if (!res.ok) return { ok: false, error: `Resend respondió ${res.status}` }

    // Validar que el dominio del fromEmail esté verificado
    const data = await res.json()
    const domains = (data.data || data) as Array<{ name: string; status: string }>
    const domain = fromEmail.split('@')[1]
    const found = Array.isArray(domains) && domains.find((d) => d.name === domain && d.status === 'verified')
    if (!found) {
      return {
        ok: false,
        error: `El dominio "${domain}" no está verificado en tu cuenta Resend. Verificalo primero.`,
      }
    }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Error de red' }
  }
}

// ====================================================================
// POST /api/cliente/api-keys
// ====================================================================
export async function POST(req: NextRequest) {
  const limit = await rateLimitGuard(req, 'api-keys-update', 10, 60)
  if (limit) return limit

  const cliente = await getClienteContext()
  if (!cliente) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || !body.provider) {
    return NextResponse.json({ error: 'Falta provider' }, { status: 400 })
  }

  if (body.provider === 'anthropic') {
    const v = validateBody<{ api_key: string }>(body, {
      provider: { type: 'string', required: true, enum: ['anthropic'] },
      api_key: { type: 'string', required: true, minLength: 20, maxLength: 200 },
    })
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 })

    const validation = await validarClaudeKey(v.data.api_key)
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })

    const admin = createMasterAdminClient()
    const { error } = await admin
      .from('cliente_integraciones')
      .upsert({
        cliente_id: cliente.id,
        byo_anthropic_key: v.data.api_key,
        byo_anthropic_status: 'ok',
        byo_anthropic_validado_en: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'cliente_id' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await auditLog(cliente.id, 'byo_anthropic_configurada', null, req)
    return NextResponse.json({ ok: true })
  }

  if (body.provider === 'resend') {
    const v = validateBody<{ api_key: string; from_email: string }>(body, {
      provider: { type: 'string', required: true, enum: ['resend'] },
      api_key: { type: 'string', required: true, minLength: 10, maxLength: 200 },
      from_email: { type: 'email', required: true },
    })
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 })

    const validation = await validarResendKey(v.data.api_key, v.data.from_email)
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })

    const admin = createMasterAdminClient()
    const { error } = await admin
      .from('cliente_integraciones')
      .upsert({
        cliente_id: cliente.id,
        byo_resend_key: v.data.api_key,
        byo_resend_from_email: v.data.from_email,
        byo_resend_status: 'ok',
        byo_resend_validado_en: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'cliente_id' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await auditLog(cliente.id, 'byo_resend_configurada', null, req)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Provider inválido' }, { status: 400 })
}

// ====================================================================
// DELETE /api/cliente/api-keys?provider=anthropic
// ====================================================================
export async function DELETE(req: NextRequest) {
  const cliente = await getClienteContext()
  if (!cliente) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const provider = new URL(req.url).searchParams.get('provider')
  if (!provider || !['anthropic', 'resend'].includes(provider)) {
    return NextResponse.json({ error: 'Provider inválido' }, { status: 400 })
  }

  const admin = createMasterAdminClient()
  const update: any = { updated_at: new Date().toISOString() }
  if (provider === 'anthropic') {
    update.byo_anthropic_key = null
    update.byo_anthropic_status = 'no_configurado'
    update.byo_anthropic_validado_en = null
  } else {
    update.byo_resend_key = null
    update.byo_resend_from_email = null
    update.byo_resend_status = 'no_configurado'
    update.byo_resend_validado_en = null
  }

  const { error } = await admin
    .from('cliente_integraciones')
    .update(update)
    .eq('cliente_id', cliente.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await auditLog(cliente.id, `byo_${provider}_eliminada`, null, req)
  return NextResponse.json({ ok: true })
}
