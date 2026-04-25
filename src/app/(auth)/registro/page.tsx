'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createMasterBrowserClient } from '@/lib/supabase/client'
import { ArrowLeft, Zap, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { slugify } from '@/lib/utils'

export default function RegistroPage() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      setLoading(false)
      return
    }

    const supabase = createMasterBrowserClient()

    // 1. Crear usuario en auth
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { nombre_completo: nombre, empresa },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // 2. Crear registro en master.clientes (vía API que usa service role)
    try {
      const res = await fetch('/api/onboarding/setup-managed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          nombre_completo: nombre,
          empresa,
          slug: slugify(empresa || nombre),
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        setError(errData.error ?? 'Error creando cuenta')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/bienvenida')
        router.refresh()
      }, 1500)
    } catch (e: any) {
      setError(e?.message ?? 'Error de red')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-bg-base flex items-center justify-center px-6 py-12">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-gold/5 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-fg-muted hover:text-gold text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-gold-hover flex items-center justify-center shadow-gold">
            <Zap className="w-5 h-5 text-bg-base" />
          </div>
          <span className="font-serif text-2xl font-bold">ACELER<span className="text-gold">AME</span></span>
        </div>

        <div className="surface p-8">
          <h1 className="font-serif text-3xl font-bold mb-2">Creá tu cuenta</h1>
          <p className="text-fg-muted mb-8">Empezá tu motor de prospección en 15 minutos.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nombre" className="label">Nombre completo</label>
              <input
                id="nombre"
                type="text"
                required
                className="input"
                placeholder="Juan Pérez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="empresa" className="label">Empresa</label>
              <input
                id="empresa"
                type="text"
                className="input"
                placeholder="Mi Empresa SA"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                placeholder="tu@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="label">Contraseña</label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                className="input"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-success/10 border border-success/30 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <p className="text-sm text-success">¡Cuenta creada! Redirigiendo…</p>
              </div>
            )}

            <button type="submit" disabled={loading || success} className="btn-primary w-full py-3">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Creando cuenta…' : 'Crear mi cuenta'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-fg-muted">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-gold hover:text-gold-hover font-medium">
            Ingresar
          </Link>
        </p>
      </div>
    </main>
  )
}
