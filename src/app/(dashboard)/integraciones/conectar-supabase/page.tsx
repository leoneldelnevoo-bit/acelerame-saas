'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database, CheckCircle2, AlertCircle, Loader2, ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function ConectarSupabasePage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [estado, setEstado] = useState<'idle' | 'conectando' | 'ok' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function conectar(e: React.FormEvent) {
    e.preventDefault()
    setEstado('conectando')
    setError(null)
    try {
      const res = await fetch('/api/integraciones/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), anon_key: anonKey.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setEstado('error')
        setError(data.error || 'Error desconocido')
        return
      }
      setEstado('ok')
      setTimeout(() => {
        router.push('/integraciones')
        router.refresh()
      }, 2000)
    } catch (e: any) {
      setEstado('error')
      setError(e?.message || 'Network error')
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/integraciones" className="text-fg-muted hover:text-gold inline-flex items-center gap-2 text-sm">
        <ArrowLeft className="w-4 h-4" /> Volver a Integraciones
      </Link>

      <div className="surface p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
            <Database className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold">Conectar tu Supabase (BYODB)</h1>
            <p className="text-fg-muted text-sm">Traé tu propio Supabase. Tus datos viven con vos.</p>
          </div>
        </div>

        <div className="bg-bg-overlay/50 rounded-lg p-4 mb-6 border border-border text-sm">
          <p className="font-medium mb-2">📋 ¿Qué necesito?</p>
          <ol className="text-fg-muted space-y-1 list-decimal pl-4">
            <li>Tener un proyecto Supabase con la tabla <code className="text-gold">prospeccion_leads</code></li>
            <li>La URL del proyecto (https://xyz.supabase.co)</li>
            <li>La anon key (Project Settings → API Keys → anon public)</li>
          </ol>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline mt-3 inline-flex items-center gap-1 text-sm"
          >
            Abrir Supabase Dashboard <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <form onSubmit={conectar} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">URL del Supabase</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyz.supabase.co"
              className="input w-full font-mono text-sm"
              disabled={estado === 'conectando' || estado === 'ok'}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Anon Key</label>
            <input
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="sb_publishable_xxx... o eyJxxx..."
              className="input w-full font-mono text-sm"
              disabled={estado === 'conectando' || estado === 'ok'}
              required
            />
          </div>

          {estado === 'idle' && (
            <button type="submit" className="btn-primary w-full">Conectar</button>
          )}

          {estado === 'conectando' && (
            <div className="flex items-center justify-center gap-3 py-4 text-fg-muted">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Probando conexión…</span>
            </div>
          )}

          {estado === 'ok' && (
            <div className="bg-success/5 border border-success/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-success">¡Conectado!</p>
                  <p className="text-sm text-fg-muted mt-1">Te redirigimos en 2 segundos…</p>
                </div>
              </div>
            </div>
          )}

          {estado === 'error' && (
            <div className="space-y-3">
              <div className="bg-danger/5 border border-danger/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-danger">No pude conectar</p>
                    <p className="text-sm text-fg-muted mt-1">{error}</p>
                  </div>
                </div>
              </div>
              <button type="submit" className="btn-primary w-full" onClick={() => setEstado('idle')}>
                Reintentar
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
