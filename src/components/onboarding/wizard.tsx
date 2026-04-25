'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Database, Users, Target, Instagram, CreditCard, MessageSquare, Rocket, ChevronRight, Check, Loader2 } from 'lucide-react'
import type { ClienteContext } from '@/lib/cliente-db'

const PASOS = [
  { num: 1, titulo: 'Bienvenida', icon: Zap },
  { num: 2, titulo: 'Base de datos', icon: Database },
  { num: 3, titulo: 'Tu nicho', icon: Users },
  { num: 4, titulo: 'Fuente de leads', icon: Target },
  { num: 5, titulo: 'Instagram', icon: Instagram },
  { num: 6, titulo: 'Créditos', icon: CreditCard },
  { num: 7, titulo: 'Mensajes', icon: MessageSquare },
  { num: 8, titulo: 'Activar', icon: Rocket },
]

export function OnboardingWizard({ cliente }: { cliente: ClienteContext }) {
  const router = useRouter()
  const [paso, setPaso] = useState(Math.max(1, cliente.onboarding_paso || 1))
  const [loading, setLoading] = useState(false)

  // Estado del wizard
  const [config, setConfig] = useState({
    db_modalidad: cliente.db_modalidad ?? 'managed',
    nicho: '',
    targets_tipo: 'hashtag',
    targets_valores: '',
    sessionid_ig: '',
    paquete: 'growth',
    tono_mensajes: 'profesional',
  })

  const completarPaso = async () => {
    setLoading(true)
    // Avanzar paso
    if (paso < PASOS.length) {
      setPaso(paso + 1)
    } else {
      // Marcar completo
      await fetch('/api/onboarding/setup-managed', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completar: true }),
      })
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Header con progress */}
      <header className="border-b border-border bg-bg-surface">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold to-gold-hover flex items-center justify-center shadow-gold">
              <Zap className="w-5 h-5 text-bg-base" />
            </div>
            <span className="font-serif text-xl font-bold">ACELER<span className="text-gold">AME</span></span>
          </div>
          <span className="text-sm text-fg-muted ml-auto">Paso {paso} de {PASOS.length}</span>
        </div>
        <div className="h-1 bg-bg-overlay">
          <div className="h-full bg-gold transition-all" style={{ width: `${(paso / PASOS.length) * 100}%` }} />
        </div>
      </header>

      {/* Stepper sidebar + contenido */}
      <div className="flex-1 flex">
        <aside className="w-72 border-r border-border bg-bg-surface p-6 hidden md:block">
          <ol className="space-y-2">
            {PASOS.map((p) => {
              const Icon = p.icon
              const completo = paso > p.num
              const actual = paso === p.num
              return (
                <li key={p.num} className={`flex items-center gap-3 p-2 rounded-lg ${actual ? 'bg-gold/10 border border-gold/30' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    completo ? 'bg-success/20 text-success' :
                    actual ? 'bg-gold text-bg-base' :
                    'bg-bg-overlay text-fg-muted'
                  }`}>
                    {completo ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-sm ${actual ? 'text-fg font-medium' : 'text-fg-muted'}`}>
                    {p.titulo}
                  </span>
                </li>
              )
            })}
          </ol>
        </aside>

        <main className="flex-1 p-6 md:p-12 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            {paso === 1 && <Paso1Bienvenida nombre={cliente.nombre_completo} />}
            {paso === 2 && <Paso2DB config={config} setConfig={setConfig} />}
            {paso === 3 && <Paso3Nicho config={config} setConfig={setConfig} />}
            {paso === 4 && <Paso4Targets config={config} setConfig={setConfig} />}
            {paso === 5 && <Paso5IG config={config} setConfig={setConfig} />}
            {paso === 6 && <Paso6Creditos />}
            {paso === 7 && <Paso7Mensajes config={config} setConfig={setConfig} />}
            {paso === 8 && <Paso8Activar config={config} cliente={cliente} />}

            <div className="mt-8 flex items-center justify-between">
              {paso > 1 ? (
                <button onClick={() => setPaso(paso - 1)} className="btn-ghost">
                  ← Atrás
                </button>
              ) : <div />}
              <button onClick={completarPaso} disabled={loading} className="btn-primary">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {paso === PASOS.length ? 'Activar mi motor' : 'Siguiente'}
                {paso < PASOS.length && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function Paso1Bienvenida({ nombre }: { nombre: string }) {
  return (
    <div className="space-y-6">
      <div className="card-gold p-8 text-center">
        <Zap className="w-12 h-12 text-gold mx-auto mb-4" />
        <h1 className="font-serif text-4xl font-bold mb-3">Bienvenido, {nombre.split(' ')[0]}</h1>
        <p className="text-fg-muted text-lg">
          En los próximos minutos vas a configurar tu motor de prospección.
          Cuando termines, vas a tener leads cargados, IA generando mensajes y agenda automática.
        </p>
      </div>
      <div className="surface p-6">
        <h2 className="font-serif text-xl font-bold mb-3">Esto es lo que vamos a hacer:</h2>
        <ol className="space-y-2 text-fg-muted text-sm">
          <li>1. Elegir cómo gestionamos tu base de datos</li>
          <li>2. Definir tu nicho (qué tipo de cliente buscás)</li>
          <li>3. Configurar de dónde sacamos los leads</li>
          <li>4. Conectar tu cuenta de Instagram</li>
          <li>5. Cargar tus primeros créditos</li>
          <li>6. Personalizar el tono de tus mensajes</li>
          <li>7. Activar el motor</li>
        </ol>
      </div>
    </div>
  )
}

function Paso2DB({ config, setConfig }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold mb-2">¿Dónde guardamos tus leads?</h1>
        <p className="text-fg-muted">Esta es la decisión más importante. Podés cambiarla más adelante.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => setConfig({ ...config, db_modalidad: 'managed' })}
          className={`text-left p-5 rounded-xl border-2 transition-all ${
            config.db_modalidad === 'managed'
              ? 'border-gold bg-gold/5'
              : 'border-border bg-bg-surface hover:border-gold/40'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-gold text-bg-base text-xs font-bold">Recomendado</span>
          </div>
          <h3 className="font-serif text-xl font-bold mb-1">Managed</h3>
          <p className="text-sm text-fg-muted mb-3">Nosotros nos encargamos de todo.</p>
          <ul className="space-y-1 text-xs text-fg-muted">
            <li>✓ Sin configurar nada</li>
            <li>✓ Lista en 30 segundos</li>
            <li>✓ Apify scraping incluido</li>
            <li>✓ Backups automáticos</li>
          </ul>
        </button>

        <button
          onClick={() => setConfig({ ...config, db_modalidad: 'byodb' })}
          className={`text-left p-5 rounded-xl border-2 transition-all ${
            config.db_modalidad === 'byodb'
              ? 'border-gold bg-gold/5'
              : 'border-border bg-bg-surface hover:border-gold/40'
          }`}
        >
          <h3 className="font-serif text-xl font-bold mb-1 mt-7">BYODB</h3>
          <p className="text-sm text-fg-muted mb-3">Traés tu propio Supabase.</p>
          <ul className="space-y-1 text-xs text-fg-muted">
            <li>✓ Datos 100% tuyos</li>
            <li>✓ Sin lock-in</li>
            <li>✓ Tu propia infraestructura</li>
            <li>· Requiere conocimiento técnico</li>
          </ul>
        </button>
      </div>

      {config.db_modalidad === 'byodb' && (
        <div className="surface p-5">
          <p className="text-sm text-fg-muted mb-3">
            Necesitarás conectar tu Supabase en el siguiente paso. Asegurate de tener:
          </p>
          <ul className="space-y-1 text-xs text-fg-muted">
            <li>• URL del proyecto (https://xxxxxx.supabase.co)</li>
            <li>• Anon key (publishable)</li>
            <li>• Tablas: <code className="text-gold">prospeccion_leads</code>, <code className="text-gold">instagram_cuentas</code></li>
          </ul>
        </div>
      )}
    </div>
  )
}

function Paso3Nicho({ config, setConfig }: any) {
  const nichos = [
    { id: 'cafe', nombre: 'Café specialty', desc: 'Productores, baristas, tostadores' },
    { id: 'coaching', nombre: 'Coaching y mentoría', desc: 'Coaches, consultores, mentores' },
    { id: 'ecommerce', nombre: 'E-commerce', desc: 'Marcas D2C, dropshippers' },
    { id: 'inmobiliario', nombre: 'Inmobiliario', desc: 'Agentes, brokers, desarrolladores' },
    { id: 'fitness', nombre: 'Fitness y salud', desc: 'PTs, nutricionistas, gimnasios' },
    { id: 'otro', nombre: 'Otro', desc: 'Definí vos tu nicho' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold mb-2">¿Qué tipo de cliente buscás?</h1>
        <p className="text-fg-muted">Cada nicho tiene mensajes pre-cargados que la IA va a usar como base.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {nichos.map((n) => (
          <button
            key={n.id}
            onClick={() => setConfig({ ...config, nicho: n.id })}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              config.nicho === n.id ? 'border-gold bg-gold/5' : 'border-border bg-bg-surface hover:border-gold/40'
            }`}
          >
            <p className="font-medium">{n.nombre}</p>
            <p className="text-sm text-fg-muted">{n.desc}</p>
          </button>
        ))}
      </div>

      {config.nicho === 'otro' && (
        <input
          className="input"
          placeholder="Describí tu nicho (ej: SaaS B2B para empresas de logística)"
          onChange={(e) => setConfig({ ...config, nicho_custom: e.target.value })}
        />
      )}
    </div>
  )
}

function Paso4Targets({ config, setConfig }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold mb-2">¿De dónde sacamos los leads?</h1>
        <p className="text-fg-muted">Apify va a scrapear estas fuentes y poblar tu base.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="label">Tipo de fuente</label>
          <select
            className="input"
            value={config.targets_tipo}
            onChange={(e) => setConfig({ ...config, targets_tipo: e.target.value })}
          >
            <option value="hashtag">Hashtags Instagram</option>
            <option value="cuenta_seguidores">Seguidores de cuentas IG</option>
            <option value="keyword">Búsqueda por keyword</option>
          </select>
        </div>

        <div>
          <label className="label">Valores (uno por línea)</label>
          <textarea
            rows={6}
            className="input font-mono"
            placeholder={
              config.targets_tipo === 'hashtag'
                ? '#cafeespecial\n#cafemexico\n#baristacourse'
                : config.targets_tipo === 'cuenta_seguidores'
                ? '@sukhafe\n@baristaschool'
                : 'café specialty mexico\nformación barista'
            }
            value={config.targets_valores}
            onChange={(e) => setConfig({ ...config, targets_valores: e.target.value })}
          />
          <p className="text-xs text-fg-subtle mt-2">
            Cada lead enriquecido cuesta 5 créditos. Podés agregar más fuentes después.
          </p>
        </div>
      </div>
    </div>
  )
}

function Paso5IG({ config, setConfig }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold mb-2">Conectá tu Instagram</h1>
        <p className="text-fg-muted">Necesitamos el sessionid para enviar DMs desde tu cuenta.</p>
      </div>

      <div className="surface p-5">
        <h3 className="font-medium mb-3">Cómo obtener el sessionid:</h3>
        <ol className="space-y-2 text-sm text-fg-muted">
          <li>1. Abrí Instagram en Chrome (logueado)</li>
          <li>2. Apretá F12 → Application → Cookies → instagram.com</li>
          <li>3. Buscá la cookie llamada <code className="text-gold">sessionid</code></li>
          <li>4. Copiá el valor y pegalo abajo</li>
        </ol>
      </div>

      <div>
        <label className="label">SessionID</label>
        <input
          type="password"
          className="input font-mono"
          placeholder="123456789%3A..."
          value={config.sessionid_ig}
          onChange={(e) => setConfig({ ...config, sessionid_ig: e.target.value })}
        />
        <p className="text-xs text-fg-subtle mt-2">
          Tu sessionid se guarda encriptado. Lo podés revocar en cualquier momento desde Instagram.
        </p>
      </div>
    </div>
  )
}

function Paso6Creditos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold mb-2">Cargá tus primeros créditos</h1>
        <p className="text-fg-muted">Sin créditos no hay motor. 1 crédito = $0.10 USD.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="surface p-4 text-center">
          <p className="text-sm text-fg-muted">Starter</p>
          <p className="font-serif text-2xl font-bold text-gold">$50</p>
          <p className="text-xs text-fg-muted">500 créditos</p>
        </div>
        <div className="card-gold p-4 text-center">
          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-gold text-bg-base font-bold mb-1">Recomendado</span>
          <p className="text-sm text-fg-muted">Growth</p>
          <p className="font-serif text-2xl font-bold text-gold">$150</p>
          <p className="text-xs text-fg-muted">2.000 créditos</p>
        </div>
        <div className="surface p-4 text-center">
          <p className="text-sm text-fg-muted">Pro</p>
          <p className="font-serif text-2xl font-bold text-gold">$400</p>
          <p className="text-xs text-fg-muted">6.000 créditos</p>
        </div>
      </div>

      <div className="surface p-4 text-sm text-fg-muted">
        <p>Después de completar el wizard, te llevamos a la página de pago con USDT/TRON.</p>
        <p className="mt-1">Mientras tanto, podés seguir explorando.</p>
      </div>
    </div>
  )
}

function Paso7Mensajes({ config, setConfig }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold mb-2">Tono de tus mensajes</h1>
        <p className="text-fg-muted">La IA va a usar este tono para generar todos los DMs.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {[
          { id: 'profesional', label: 'Profesional', desc: 'Formal, directo, B2B clásico' },
          { id: 'casual', label: 'Casual', desc: 'Cercano, amigable, sin formalismos' },
          { id: 'argentino', label: 'Argentino', desc: 'Voseo, "che", expresiones rioplatenses' },
          { id: 'mexicano', label: 'Mexicano', desc: 'Mexicanismos suaves, neutro mexicano' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setConfig({ ...config, tono_mensajes: t.id })}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              config.tono_mensajes === t.id ? 'border-gold bg-gold/5' : 'border-border bg-bg-surface hover:border-gold/40'
            }`}
          >
            <p className="font-medium">{t.label}</p>
            <p className="text-sm text-fg-muted">{t.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function Paso8Activar({ config, cliente }: any) {
  return (
    <div className="space-y-6">
      <div className="card-gold p-8 text-center">
        <Rocket className="w-12 h-12 text-gold mx-auto mb-4" />
        <h1 className="font-serif text-4xl font-bold mb-3">¡Todo listo!</h1>
        <p className="text-fg-muted text-lg">Vamos a activar tu motor de prospección.</p>
      </div>

      <div className="surface p-6">
        <h2 className="font-serif text-xl font-bold mb-4">Resumen</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-border/50 pb-2">
            <dt className="text-fg-muted">Modalidad DB:</dt>
            <dd className="font-medium">{config.db_modalidad}</dd>
          </div>
          <div className="flex justify-between border-b border-border/50 pb-2">
            <dt className="text-fg-muted">Nicho:</dt>
            <dd className="font-medium">{config.nicho || '(sin definir)'}</dd>
          </div>
          <div className="flex justify-between border-b border-border/50 pb-2">
            <dt className="text-fg-muted">Fuente leads:</dt>
            <dd className="font-medium">{config.targets_tipo}</dd>
          </div>
          <div className="flex justify-between border-b border-border/50 pb-2">
            <dt className="text-fg-muted">IG conectado:</dt>
            <dd className="font-medium">{config.sessionid_ig ? '✓' : '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-fg-muted">Tono mensajes:</dt>
            <dd className="font-medium">{config.tono_mensajes}</dd>
          </div>
        </dl>
      </div>

      <p className="text-sm text-fg-muted text-center">
        Apretá "Activar mi motor" para guardar todo y entrar al dashboard.
      </p>
    </div>
  )
}
