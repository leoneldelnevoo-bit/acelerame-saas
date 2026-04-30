'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, ArrowRight, Sparkles, Users, Instagram, Search, Calendar, Zap } from 'lucide-react'

type Progreso = {
  producto: boolean
  audiencia: boolean
  cuentaIG: boolean
  targets: boolean
  agenda: boolean
}

const PASOS = [
  {
    id: 'producto',
    nombre: 'Tu producto',
    desc: '¿Qué vendés? Lo más importante para que la IA hable con tu voz.',
    icon: Sparkles,
    href: '/configuracion/producto',
    tiempo: '1 min',
  },
  {
    id: 'audiencia',
    nombre: 'Tu audiencia ideal',
    desc: '¿A quién le hablás? Buyer persona, dolor, objeciones.',
    icon: Users,
    href: '/configuracion/audiencia',
    tiempo: '2 min',
  },
  {
    id: 'cuentaIG',
    nombre: 'Tu cuenta de Instagram',
    desc: 'Cargá tu sessionid para que el motor pueda mandar DMs.',
    icon: Instagram,
    href: '/configuracion/cuenta-ig',
    tiempo: '1 min',
  },
  {
    id: 'targets',
    nombre: 'Targets de scraping',
    desc: 'Hashtags, cuentas o keywords donde buscar leads.',
    icon: Search,
    href: '/configuracion/leads',
    tiempo: '1 min',
  },
  {
    id: 'agenda',
    nombre: 'Tu link de agenda',
    desc: 'Calendly, Cal.com, TidyCal o el link que uses.',
    icon: Calendar,
    href: '/configuracion/agenda',
    tiempo: '30 seg',
  },
] as const

export default function OnboardingWizard({ cliente, progreso }: { cliente: any; progreso: Progreso }) {
  const completados = Object.values(progreso).filter(Boolean).length
  const total = PASOS.length
  const todoOk = completados === total

  const siguiente = PASOS.find((p) => !progreso[p.id as keyof Progreso])

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="font-serif text-4xl font-bold">
          {todoOk ? '¡Todo listo, ' : '¡Empezá en 5 min, '}
          {cliente.nombre_completo.split(' ')[0]}!
        </h1>
        <p className="text-fg-muted mt-2 text-lg">
          {todoOk
            ? 'Tu motor de prospección está configurado. Activalo cuando quieras.'
            : 'Configurá estos 5 pasos y tu motor empieza a generar leads automáticamente.'}
        </p>
      </div>

      {/* Progress bar */}
      <div className="surface p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold">Progreso de configuración</p>
          <p className="text-sm font-mono text-gold">{completados} / {total}</p>
        </div>
        <div className="h-3 bg-bg-overlay rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold to-success transition-all duration-500"
            style={{ width: `${(completados / total) * 100}%` }}
          />
        </div>
      </div>

      {/* CTA del siguiente paso */}
      {siguiente && !todoOk && (
        <Link href={siguiente.href} className="card-gold p-6 hover:border-gold transition-colors block">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
              <siguiente.icon className="w-6 h-6 text-gold" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-gold mb-1">Tu próximo paso · {siguiente.tiempo}</p>
              <h2 className="font-serif text-2xl font-bold mb-1">{siguiente.nombre}</h2>
              <p className="text-fg-muted">{siguiente.desc}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gold mt-2" />
          </div>
        </Link>
      )}

      {todoOk && (
        <div className="card-gold p-6 border-success/40 bg-success/5">
          <div className="flex items-start gap-4">
            <Zap className="w-10 h-10 text-success" />
            <div>
              <h2 className="font-serif text-2xl font-bold text-success">Todo configurado 🎉</h2>
              <p className="text-fg-muted mt-1">
                Tu motor está listo para activarse. Cuando lo prendas, va a empezar a buscar leads,
                mandar DMs personalizados y agendar llamadas.
              </p>
              <Link href="/dashboard" className="btn-primary mt-4">
                <Zap className="w-4 h-4" /> Ir al dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Lista de pasos */}
      <div className="space-y-2">
        <h3 className="font-bold text-fg-muted text-sm uppercase tracking-wider">Todos los pasos</h3>
        {PASOS.map((paso, i) => {
          const ok = progreso[paso.id as keyof Progreso]
          const esSiguiente = !ok && siguiente?.id === paso.id

          return (
            <Link
              key={paso.id}
              href={paso.href}
              className={`block p-4 rounded-lg border transition-colors ${
                ok
                  ? 'bg-success/5 border-success/30'
                  : esSiguiente
                  ? 'bg-gold/5 border-gold/40 hover:border-gold'
                  : 'bg-bg-overlay/30 border-border hover:border-gold/30'
              }`}
            >
              <div className="flex items-center gap-4">
                {ok ? (
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-fg-muted shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{i + 1}. {paso.nombre}</span>
                    <span className="text-xs text-fg-subtle">· {paso.tiempo}</span>
                  </div>
                  <p className="text-sm text-fg-muted">{paso.desc}</p>
                </div>
                <ArrowRight className={`w-4 h-4 shrink-0 ${ok ? 'text-success' : 'text-fg-muted'}`} />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Sección opcional: API keys */}
      <div className="surface p-5 border-info/20">
        <h3 className="font-bold mb-1 flex items-center gap-2">
          <Zap className="w-4 h-4 text-info" />
          Opcional: usar tus propias API keys
        </h3>
        <p className="text-sm text-fg-muted mb-3">
          Por defecto, ACELERAME usa nuestras keys de Claude IA y Resend (email).
          Si querés que el costo de IA y email vaya directo a tu cuenta, configurá las tuyas.
        </p>
        <Link href="/integraciones/api-keys" className="btn-ghost text-sm inline-flex items-center gap-2">
          Configurar API keys propias <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
