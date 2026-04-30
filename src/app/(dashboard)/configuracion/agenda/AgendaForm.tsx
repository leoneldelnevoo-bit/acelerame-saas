'use client'

import { useState, useMemo } from 'react'
import { Calendar, Save, ExternalLink, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { PROVEEDORES, detectarProveedor, type AgendaProveedor } from '@/lib/agenda-connectors'

type Initial = {
  duracion: number
  proveedor: AgendaProveedor | null
  url: string
  status: string
  validadoEn: string | null
}

export default function AgendaForm({ initial }: { initial: Initial }) {
  const [proveedor, setProveedor] = useState<AgendaProveedor | null>(initial.proveedor)
  const [url, setUrl] = useState(initial.url)
  const [duracion, setDuracion] = useState(initial.duracion)
  const [status, setStatus] = useState(initial.status)
  const [validadoEn, setValidadoEn] = useState(initial.validadoEn)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Auto-detectar proveedor cuando el cliente pega URL
  const proveedorDetectado = useMemo(() => detectarProveedor(url), [url])

  const proveedorActivo = proveedor ?? proveedorDetectado
  const info = PROVEEDORES.find((p) => p.id === proveedorActivo)

  async function validarYGuardar() {
    setSaving(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/cliente/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedor: proveedorActivo ?? 'custom',
          url: url.trim(),
          duracion_llamada_min: duracion,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Error guardando')
        return
      }
      setStatus(data.status)
      setValidadoEn(data.validado_en)
      setSavedAt(new Date().toLocaleTimeString())
    } catch (e: any) {
      setErrorMsg(e?.message || 'Error de red')
    } finally {
      setSaving(false)
    }
  }

  async function probarLink() {
    if (!url.trim()) return
    setValidating(true)
    try {
      const res = await fetch('/api/cliente/agenda?action=ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (data.ok) {
        setErrorMsg(null)
        alert('✅ Link funciona correctamente (status ' + data.status + ')')
      } else {
        setErrorMsg(`Link no responde: ${data.error || 'status ' + data.status}`)
      }
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold flex items-center gap-3">
          <Calendar className="w-7 h-7 text-gold" />
          Agenda
        </h1>
        <p className="text-fg-muted mt-1">El link que la IA manda cuando un lead acepta llamada.</p>
      </div>

      {/* Estado actual */}
      {status === 'ok' && (
        <div className="surface p-4 border-success/40 bg-success/5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            <div>
              <p className="font-bold text-success">Link de agenda activo</p>
              <p className="text-sm text-fg-muted mt-1">
                Validado {validadoEn ? new Date(validadoEn).toLocaleString() : 'recientemente'}.
                La IA va a usar este link cuando un lead acepte una llamada.
              </p>
            </div>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="surface p-4 border-danger/40 bg-danger/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
            <div>
              <p className="font-bold text-danger">El link no responde</p>
              <p className="text-sm text-fg-muted mt-1">Probá con otro link o contactá a soporte.</p>
            </div>
          </div>
        </div>
      )}

      {/* Selector de proveedor */}
      <div className="surface p-6 space-y-4">
        <h2 className="font-serif text-lg font-bold">¿Qué proveedor usás?</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PROVEEDORES.map((p) => (
            <button
              key={p.id}
              onClick={() => setProveedor(p.id)}
              className={`p-4 rounded-lg border text-left transition-colors ${
                proveedorActivo === p.id
                  ? 'border-gold bg-gold/5'
                  : 'border-border hover:border-gold/50'
              }`}
            >
              <div className="text-2xl mb-1">{p.logo}</div>
              <p className="font-bold text-sm">{p.nombre}</p>
            </button>
          ))}
        </div>
      </div>

      {/* URL + Duración */}
      <div className="surface p-6 space-y-5">
        <div>
          <label className="block text-sm font-bold mb-1">Link de tu calendario</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={info?.ejemplo ?? 'https://...'}
            className="input w-full font-mono"
            spellCheck={false}
          />
          {info && (
            <p className="text-xs text-fg-muted mt-1">{info.instrucciones}</p>
          )}
          {url && proveedorDetectado && proveedorDetectado !== proveedor && (
            <p className="text-xs text-info mt-1">
              💡 Detecté que es un link de <strong>{PROVEEDORES.find(p => p.id === proveedorDetectado)?.nombre}</strong> — ya lo cambié arriba.
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold hover:underline inline-flex items-center gap-1">
                Abrir en pestaña nueva <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {url && (
              <button onClick={probarLink} disabled={validating} className="text-xs text-gold hover:underline inline-flex items-center gap-1">
                {validating ? <Loader2 className="w-3 h-3 animate-spin" /> : '🔍'} Probar que funcione
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Duración de la llamada (minutos)</label>
          <input
            type="number"
            min={10}
            max={120}
            value={duracion}
            onChange={(e) => setDuracion(parseInt(e.target.value) || 20)}
            className="input md:w-32"
          />
          <p className="text-xs text-fg-muted mt-1">
            La IA lo menciona cuando propone la llamada. Recomendado: 15-30 min para descubrimiento.
          </p>
        </div>
      </div>

      {/* Preview de mensaje */}
      <div className="surface p-6 bg-bg-overlay/30">
        <p className="text-sm font-bold mb-2">Preview · Cómo lo usa la IA</p>
        <p className="text-sm text-fg-muted mb-3">
          Cuando un lead llega a la etapa "Aceptó llamada", la IA envía un mensaje similar a:
        </p>
        <div className="bg-bg-base rounded-lg p-3 text-sm font-mono text-fg-muted border border-border">
          {url
            ? `Genial! Acá te dejo mi link para coordinar una llamada de ${duracion} min: ${url}`
            : '👆 Configurá el link arriba para ver el preview real.'}
        </div>
      </div>

      {/* Acciones */}
      {errorMsg && (
        <div className="surface p-4 border-danger/40">
          <p className="text-sm text-danger">⚠️ {errorMsg}</p>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button onClick={validarYGuardar} disabled={saving || !url.trim()} className="btn-primary">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Validando y guardando...' : 'Validar y guardar'}
        </button>
        {savedAt && <span className="text-sm text-success">✓ Guardado a las {savedAt}</span>}
      </div>
    </div>
  )
}
