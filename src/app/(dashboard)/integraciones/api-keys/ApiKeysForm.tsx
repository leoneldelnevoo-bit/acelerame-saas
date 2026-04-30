'use client'

import { useState } from 'react'
import { Sparkles, Mail, Key, CheckCircle2, AlertTriangle, Eye, EyeOff, Save, Loader2, Info, ExternalLink } from 'lucide-react'

type State = {
  anthropic: { masked: string; configurada: boolean; status: string; validadoEn: string | null }
  resend: { masked: string; configurada: boolean; fromEmail: string; status: string; validadoEn: string | null }
}

export default function ApiKeysForm({ initial }: { initial: State }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold flex items-center gap-3">
          <Key className="w-7 h-7 text-gold" />
          API Keys
        </h1>
        <p className="text-fg-muted mt-1">
          Tus propias claves de Claude (IA) y Resend (email). Esto es <strong>opcional</strong>.
        </p>
      </div>

      {/* Explicación */}
      <div className="surface p-5 border-info/30 bg-info/5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-info shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="font-bold text-info">¿Tengo que configurar mis propias keys?</p>
            <p className="text-fg-muted">
              <strong>No es obligatorio.</strong> Por defecto, ACELERAME usa nuestras propias claves de Claude y Resend, y vos solo pagás créditos según uso.
            </p>
            <p className="text-fg-muted">
              <strong>Configurá tus propias keys si:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-fg-muted ml-2">
              <li>Querés que los costos de IA y email vayan directo a tu cuenta (no a la nuestra)</li>
              <li>Necesitás que los emails salgan desde <em>tu</em> dominio verificado (no desde resend.dev)</li>
              <li>Tenés cumplimiento o auditoría que requiere control directo de los servicios</li>
            </ul>
          </div>
        </div>
      </div>

      <ClaudeSection initial={initial.anthropic} />
      <ResendSection initial={initial.resend} />
    </div>
  )
}

// ==================================================================
// Claude API
// ==================================================================
function ClaudeSection({ initial }: { initial: State['anthropic'] }) {
  const [key, setKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const [removing, setRemoving] = useState(false)

  async function guardar() {
    if (!key.trim()) return
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/cliente/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'anthropic', api_key: key.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setMsg({ tipo: 'ok', texto: 'Key guardada y validada. Tu motor ya la está usando.' })
        setKey('')
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMsg({ tipo: 'err', texto: data.error || 'Error guardando' })
      }
    } finally {
      setSaving(false)
    }
  }

  async function eliminar() {
    if (!confirm('¿Eliminar tu Claude API key? Volveremos a usar la del sistema.')) return
    setRemoving(true)
    try {
      await fetch('/api/cliente/api-keys?provider=anthropic', { method: 'DELETE' })
      window.location.reload()
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="surface p-6 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <Sparkles className="w-7 h-7 text-gold mt-1" />
          <div>
            <h2 className="font-serif text-xl font-bold">Claude API · Anthropic</h2>
            <p className="text-sm text-fg-muted">La IA que personaliza cada mensaje y responde conversaciones.</p>
          </div>
        </div>
        <StatusBadge status={initial.status} configurada={initial.configurada} />
      </div>

      {/* Estado actual */}
      {initial.configurada && (
        <div className="bg-bg-overlay/50 rounded-lg p-3 border border-border flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm">
            <p>Key actual: <code className="text-gold font-mono">{initial.masked}</code></p>
            {initial.validadoEn && (
              <p className="text-xs text-fg-muted mt-1">
                Validada {new Date(initial.validadoEn).toLocaleString()}
              </p>
            )}
          </div>
          <button onClick={eliminar} disabled={removing} className="btn-ghost text-xs text-danger">
            {removing ? 'Eliminando...' : 'Eliminar y usar la del sistema'}
          </button>
        </div>
      )}

      {/* Input nueva key */}
      <div>
        <label className="block text-sm font-bold mb-1">
          {initial.configurada ? 'Reemplazar key' : 'Tu Claude API key'}
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="input w-full font-mono pr-10"
              spellCheck={false}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={guardar} disabled={saving || !key.trim()} className="btn-primary shrink-0">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
        </div>
        <p className="text-xs text-fg-muted mt-2">
          Se guarda cifrada y solo se descifra cuando el motor n8n la necesita. Validamos que funcione antes de guardar.
        </p>
      </div>

      {msg && (
        <div className={`p-3 rounded-lg border text-sm ${msg.tipo === 'ok' ? 'bg-success/10 border-success/30 text-success' : 'bg-danger/10 border-danger/30 text-danger'}`}>
          {msg.tipo === 'ok' ? '✓' : '⚠️'} {msg.texto}
        </div>
      )}

      {/* Cómo conseguirla */}
      <details className="text-sm">
        <summary className="cursor-pointer font-bold text-gold">¿Cómo consigo mi Claude API key?</summary>
        <ol className="list-decimal list-inside text-fg-muted space-y-1 mt-2 ml-2">
          <li>Andá a <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline inline-flex items-center gap-1">console.anthropic.com/settings/keys <ExternalLink className="w-3 h-3" /></a></li>
          <li>Logueate o creá cuenta (necesitás cargar saldo, mínimo USD 5)</li>
          <li>Click en "Create Key" → ponele un nombre (ej: "ACELERAME")</li>
          <li>Copiá el valor que empieza con <code>sk-ant-api03-...</code></li>
          <li>Pegalo arriba</li>
        </ol>
        <p className="text-xs text-fg-muted mt-2">
          💰 Costos: Claude Sonnet cuesta ~USD 0.003 por mensaje generado. Una conversación promedio gasta ~USD 0.05.
        </p>
      </details>
    </div>
  )
}

// ==================================================================
// Resend
// ==================================================================
function ResendSection({ initial }: { initial: State['resend'] }) {
  const [key, setKey] = useState('')
  const [fromEmail, setFromEmail] = useState(initial.fromEmail || '')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const [removing, setRemoving] = useState(false)

  async function guardar() {
    if (!key.trim() || !fromEmail.trim()) {
      setMsg({ tipo: 'err', texto: 'Necesito tanto la API key como el email de envío.' })
      return
    }
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/cliente/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'resend', api_key: key.trim(), from_email: fromEmail.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setMsg({ tipo: 'ok', texto: 'Resend configurado. Tu dominio ya está siendo usado para emails.' })
        setKey('')
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMsg({ tipo: 'err', texto: data.error || 'Error guardando' })
      }
    } finally {
      setSaving(false)
    }
  }

  async function eliminar() {
    if (!confirm('¿Eliminar tu Resend? Volveremos a usar onboarding@resend.dev del sistema.')) return
    setRemoving(true)
    try {
      await fetch('/api/cliente/api-keys?provider=resend', { method: 'DELETE' })
      window.location.reload()
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="surface p-6 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <Mail className="w-7 h-7 text-gold mt-1" />
          <div>
            <h2 className="font-serif text-xl font-bold">Resend · Email</h2>
            <p className="text-sm text-fg-muted">Notificaciones cuando un lead agenda llamada o llega a pitch.</p>
          </div>
        </div>
        <StatusBadge status={initial.status} configurada={initial.configurada} />
      </div>

      {initial.configurada && (
        <div className="bg-bg-overlay/50 rounded-lg p-3 border border-border flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm">
            <p>Key: <code className="text-gold font-mono">{initial.masked}</code></p>
            <p className="text-xs">Email envío: <code className="text-gold font-mono">{initial.fromEmail}</code></p>
            {initial.validadoEn && (
              <p className="text-xs text-fg-muted mt-1">
                Validado {new Date(initial.validadoEn).toLocaleString()}
              </p>
            )}
          </div>
          <button onClick={eliminar} disabled={removing} className="btn-ghost text-xs text-danger">
            {removing ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      )}

      <div>
        <label className="block text-sm font-bold mb-1">Email de envío (FROM)</label>
        <input
          type="email"
          value={fromEmail}
          onChange={(e) => setFromEmail(e.target.value)}
          placeholder="ventas@tudominio.com"
          className="input w-full font-mono"
        />
        <p className="text-xs text-fg-muted mt-1">
          Tiene que ser de un dominio que vos verificaste en Resend.
        </p>
      </div>

      <div>
        <label className="block text-sm font-bold mb-1">
          {initial.configurada ? 'Reemplazar Resend API key' : 'Tu Resend API key'}
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="re_..."
              className="input w-full font-mono pr-10"
              spellCheck={false}
              autoComplete="off"
            />
            <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg">
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={guardar} disabled={saving || !key.trim() || !fromEmail.trim()} className="btn-primary shrink-0">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-3 rounded-lg border text-sm ${msg.tipo === 'ok' ? 'bg-success/10 border-success/30 text-success' : 'bg-danger/10 border-danger/30 text-danger'}`}>
          {msg.tipo === 'ok' ? '✓' : '⚠️'} {msg.texto}
        </div>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer font-bold text-gold">¿Cómo configuro Resend?</summary>
        <ol className="list-decimal list-inside text-fg-muted space-y-1 mt-2 ml-2">
          <li>Andá a <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline inline-flex items-center gap-1">resend.com <ExternalLink className="w-3 h-3" /></a> y creá cuenta (es gratis hasta 3.000 emails/mes)</li>
          <li>En Domains, agregá tu dominio (ej: tudominio.com) y configurá los registros DNS que te pide</li>
          <li>Esperá ~30 min a que Resend valide el DNS</li>
          <li>Andá a API Keys → Create API Key → ponele "ACELERAME" → permission "Sending access"</li>
          <li>Copiá la key (empieza con <code>re_</code>) y pegala arriba</li>
          <li>En "Email de envío" usá un email de tu dominio (ej: <code>hola@tudominio.com</code>)</li>
        </ol>
        <p className="text-xs text-fg-muted mt-2">
          💡 Si todavía no querés configurar dominio, podés usar la del sistema sin hacer nada (los emails llegan desde onboarding@resend.dev).
        </p>
      </details>
    </div>
  )
}

function StatusBadge({ status, configurada }: { status: string; configurada: boolean }) {
  if (status === 'ok') {
    return (
      <span className="shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success/10 border border-success/30 text-success text-xs font-bold">
        <CheckCircle2 className="w-3 h-3" /> Activo (tu key)
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-danger/10 border border-danger/30 text-danger text-xs font-bold">
        <AlertTriangle className="w-3 h-3" /> Error de validación
      </span>
    )
  }
  // no_configurado
  return (
    <span className="shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-bg-overlay border border-border text-fg-muted text-xs">
      Usando key del sistema
    </span>
  )
}
