'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SetupManagedPage() {
  const router = useRouter()
  const [estado, setEstado] = useState<'idle' | 'creando' | 'ok' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [schema, setSchema] = useState<string | null>(null)

  async function setup() {
    setEstado('creando')
    setError(null)
    try {
      const res = await fetch('/api/onboarding/setup-managed', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_modalidad: 'managed' }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setEstado('error')
        setError(data.error || 'Error desconocido')
        return
      }
      setEstado('ok')
      setSchema(data.cliente?.schema_db ?? null)
      // Redirect después de 2s
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
            <h1 className="font-serif text-2xl font-bold">Setup Managed</h1>
            <p className="text-fg-muted text-sm">Vamos a crear tu base de datos en nuestro Supabase</p>
          </div>
        </div>

        <div className="bg-bg-overlay/50 rounded-lg p-4 mb-6 border border-border">
          <h3 className="font-medium mb-2">¿Qué se va a crear?</h3>
          <ul className="text-sm text-fg-muted space-y-1">
            <li>• Schema dedicado para tus datos (cliente_&lt;tu-slug&gt;)</li>
            <li>• Tabla <code className="text-gold">prospeccion_leads</code> para tus leads</li>
            <li>• Tabla <code className="text-gold">instagram_cuentas</code> para tus cuentas IG</li>
            <li>• Tabla <code className="text-gold">scraping_config</code> para targets de Apify</li>
            <li>• Tabla <code className="text-gold">mensajes_templates</code> para mensajes pre-cargados</li>
          </ul>
        </div>

        {estado === 'idle' && (
          <button onClick={setup} className="btn-primary w-full">
            Crear mi base de datos
          </button>
        )}

        {estado === 'creando' && (
          <div className="flex items-center justify-center gap-3 py-8 text-fg-muted">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Creando schema y tablas…</span>
          </div>
        )}

        {estado === 'ok' && (
          <div className="bg-success/5 border border-success/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-success">¡Listo!</p>
                <p className="text-sm text-fg-muted mt-1">
                  Tu schema <span className="font-mono text-gold">{schema}</span> está creado.
                  Te redirigimos en 2 segundos…
                </p>
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
                  <p className="font-medium text-danger">Error</p>
                  <p className="text-sm text-fg-muted mt-1">{error}</p>
                </div>
              </div>
            </div>
            <button onClick={setup} className="btn-primary w-full">Reintentar</button>
          </div>
        )}
      </div>
    </div>
  )
}
