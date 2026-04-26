'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, AlertCircle, Plus } from 'lucide-react'

export function CuentasIGForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [sessionid, setSessionid] = useState('')
  const [estado, setEstado] = useState<'idle' | 'cargando' | 'ok' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setEstado('cargando')
    setError(null)
    try {
      const res = await fetch('/api/onboarding/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim().replace(/^@/, ''),
          sessionid: sessionid.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setEstado('error')
        setError(data.error || 'Error desconocido')
        return
      }
      setEstado('ok')
      setUsername('')
      setSessionid('')
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
        <label className="text-sm font-medium block mb-1">Username de Instagram</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="@tu_handle"
          className="input w-full"
          disabled={estado === 'cargando'}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-1">sessionid</label>
        <textarea
          value={sessionid}
          onChange={(e) => setSessionid(e.target.value)}
          placeholder="63123456789%3AaBcDeF..."
          className="input w-full font-mono text-xs h-24"
          disabled={estado === 'cargando'}
          required
        />
      </div>

      {estado === 'idle' && (
        <button type="submit" className="btn-primary">
          <Plus className="w-4 h-4" /> Agregar cuenta
        </button>
      )}

      {estado === 'cargando' && (
        <div className="flex items-center gap-2 text-fg-muted text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Guardando…
        </div>
      )}

      {estado === 'ok' && (
        <div className="flex items-center gap-2 text-success text-sm">
          <CheckCircle2 className="w-4 h-4" /> Cuenta agregada
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
