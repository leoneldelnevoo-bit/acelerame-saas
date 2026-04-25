import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Zap } from 'lucide-react'
import LoginForm from '@/components/app/login-form'

export const metadata = { title: 'Ingresar · ACELERAME' }

export default function LoginPage() {
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
          <h1 className="font-serif text-3xl font-bold mb-2">Ingresá al panel</h1>
          <p className="text-fg-muted mb-8">Accedé a tu sistema de prospección.</p>
          <Suspense fallback={<div className="py-8 text-center text-fg-muted">Cargando...</div>}><LoginForm /></Suspense>
        </div>

        <p className="mt-6 text-center text-sm text-fg-muted">
          ¿No tenés cuenta?{' '}
          <Link href="/registro" className="text-gold hover:text-gold-hover font-medium">
            Solicitar acceso
          </Link>
        </p>
      </div>
    </main>
  )
}
