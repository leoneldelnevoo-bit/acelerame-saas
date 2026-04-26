'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, AlertCircle, Plus } from 'lucide-react'

const TIPOS = [
  { value: 'hashtag', label: 'Hashtag', placeholder: 'cafespecialty, mejorcafe' },
  { value: 'cuenta_seguidores', label: 'Cuenta (seguidores)', placeholder: 'nespresso, starbucks' },
  { value: 'cuenta_comentarios', label: 'Cuenta (comentarios)', placeholder: 'nespresso' },
  { value: 'keyword', label: 'Keyword', placeholder: 'amante del café, tostador' },
]

export function ApifyTargetsForm({ saldo }: { saldo: number }) {
  const router = useRouter()
  const [tipo, setTipo] = useState('hashtag')
  const [valoresRaw, setValoresRaw] = useState('')
  const [limit, setLimit] = useState(20)
  const [estado, setEstado] = useState<'idle' | 'cargando' | 'ok' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const valores = valoresRaw
    .split(/[\n,]/)
    .map((v) => v.trim().replace(/^[#@]/, ''))
    .filter(Boolean)

  const costoEstimado = valores.length * limit * 5

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (valores.length === 0) {
      setError('Cargá al menos un valor')
      setEstado('error')
      return
    }
    setEstado('cargando')
    setError(null)
    try {
      const res = await fetch('/api/onboarding/scraping-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, valores, limit_per_target: limit }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setEstado('error')
        setError(data.error || 'Error desconocido')
        return
      }
      setEstado('ok')
      setValoresRaw('')
      setTimeout(() => {
        router.refresh()
        setEstado('idle')
      }, 1500)
    } catch (e: any) {
      setEstado('error')
      setError(e?.message || 'Network error')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-sm font-medium block mb-1">Tipo de target</label>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="input w-full"
          disabled={estado === 'cargando'}
        >
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">
          Valores (separados por coma o salto de línea)
        </label>
        <textarea
          value={valoresRaw}
          onChange={(e) => setValoresRaw(e.target.value)}
          placeholder={TIPOS.find((t) => t.value === tipo)?.placeholder}
          className="input w-full font-mono text-sm h-24"
          disabled={estado === 'cargando'}
        />
        {valores.length > 0 && (
          <p className="text-xs text-fg-muted mt-1">{valores.length} valor(es) parseado(s)</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">Leads por target (limit)</label>
        <input
          type="number"
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value) || 20)}
          min={1}
          max={500}
          className="input w-full"
          disabled={estado === 'cargando'}
        />
      </div>

      {valores.length > 0 && (
        <div className={`text-sm p-3 rounded border ${
          costoEstimado > saldo
            ? 'bg-danger/5 border-danger/30 text-danger'
            : 'bg-bg-overlay/50 border-border text-fg-muted'
        }`}>
          💰 Costo estimado: <strong>{costoEstimado} créditos</strong> · Saldo: {saldo}
          {costoEstimado > saldo && (
            <p className="mt-1 text-xs">⚠️ No tenés suficiente saldo. Esto solo guarda los targets, no los corre todavía.</p>
          )}
        </div>
      )}

      {estado === 'idle' && (
        <button type="submit" className="btn-primary" disabled={valores.length === 0}>
          <Plus className="w-4 h-4" /> Agregar {valores.length} target(s)
        </button>
      )}

      {estado === 'cargando' && (
        <div className="flex items-center gap-2 text-fg-muted text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Guardando…
        </div>
      )}

      {estado === 'ok' && (
        <div className="flex items-center gap-2 text-success text-sm">
          <CheckCircle2 className="w-4 h-4" /> Targets agregados
        </div>
      )}

      {estado === 'error' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-danger text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
          <button type="submit" className="btn-primary" onClick={() => setEstado('idle')}>
            Reintentar
          </button>
        </div>
      )}
    </form>
  )
}
