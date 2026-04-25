import Link from 'next/link'
import { Zap, Database, MessageSquare, TrendingUp, Lock, Sparkles, CheckCircle2 } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg-base">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gold/5 blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-32">
          <nav className="flex items-center justify-between mb-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-gold-hover flex items-center justify-center shadow-gold">
                <Zap className="w-5 h-5 text-bg-base" />
              </div>
              <span className="font-serif text-2xl font-bold">
                ACELER<span className="text-gold">AME</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="btn-ghost">Ingresar</Link>
              <Link href="/registro" className="btn-primary">Empezar gratis</Link>
            </div>
          </nav>

          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-sm mb-6">
              <Sparkles className="w-3 h-3" /> Prospección B2B automatizada con IA
            </span>
            <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 text-balance">
              Tu motor de ventas, <span className="text-gold">corriendo solo</span>.
            </h1>
            <p className="text-xl text-fg-muted mb-10 text-balance">
              Conectá tus cuentas, definí tu cliente ideal, cargá créditos. Nosotros prospectamos, calificamos y agendamos por vos. 24/7.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/registro" className="btn-primary px-6 py-3 text-base">
                Empezar ahora
                <Zap className="w-4 h-4" />
              </Link>
              <Link href="#como-funciona" className="btn-ghost px-6 py-3 text-base">
                Ver cómo funciona
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="como-funciona" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl font-bold mb-4">3 pasos para empezar a vender</h2>
          <p className="text-fg-muted text-lg">De cero a primer mensaje en 15 minutos.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            number="1"
            icon={Database}
            title="Conectá tu base"
            desc="Traé tu propia base de datos de Supabase, o dejá que nosotros la creemos por vos. Vos elegís."
          />
          <FeatureCard
            number="2"
            icon={MessageSquare}
            title="Definí tu cliente"
            desc="Hashtags, cuentas IG o keywords. La IA scrapea, califica y filtra los mejores leads para tu nicho."
          />
          <FeatureCard
            number="3"
            icon={TrendingUp}
            title="Activá el motor"
            desc="DMs personalizados, calificación, pitch y agenda automática. Vos solo recibís llamadas con leads calientes."
          />
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl font-bold mb-4">Pagás solo por lo que usás</h2>
          <p className="text-fg-muted text-lg">Sin suscripciones. 1 crédito = $0.10 USD.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <PricingCard
            name="Starter"
            price="$50"
            credits="500 créditos"
            features={[
              '~500 DMs Instagram',
              '~250 mensajes con IA',
              '~165 emails cold',
              'BYODB o Managed',
            ]}
          />
          <PricingCard
            name="Growth"
            price="$150"
            credits="2.000 créditos"
            featured
            features={[
              '~2.000 DMs Instagram',
              '~1.000 mensajes con IA',
              '~660 emails cold',
              'Soporte prioritario',
            ]}
          />
          <PricingCard
            name="Pro"
            price="$400"
            credits="6.000 créditos"
            features={[
              '~6.000 DMs Instagram',
              '~3.000 mensajes con IA',
              '~2.000 emails cold',
              'Onboarding 1-on-1',
            ]}
          />
        </div>

        <p className="text-center text-fg-subtle text-sm mt-8">
          Pago con USDT/TRON. Verificación blockchain automática.
        </p>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="card-gold p-12">
          <Lock className="w-12 h-12 text-gold mx-auto mb-4" />
          <h2 className="font-serif text-3xl font-bold mb-4">Tus datos, tus reglas.</h2>
          <p className="text-fg-muted text-lg mb-8 max-w-xl mx-auto">
            Si traés tu Supabase, los datos viven con vos. Sin lock-in, sin letra chica. Te llevás todo cuando quieras.
          </p>
          <Link href="/registro" className="btn-primary px-6 py-3 text-base">
            Empezar gratis
          </Link>
        </div>
      </section>

      <footer className="border-t border-border mt-20 py-8 text-center text-fg-subtle text-sm">
        © 2026 ACELERAME · Hecho con ☕ en Argentina
      </footer>
    </main>
  )
}

function FeatureCard({ number, icon: Icon, title, desc }: any) {
  return (
    <div className="surface p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold text-sm font-bold">
          {number}
        </span>
        <Icon className="w-5 h-5 text-gold" />
      </div>
      <h3 className="font-serif text-xl font-bold mb-2">{title}</h3>
      <p className="text-fg-muted">{desc}</p>
    </div>
  )
}

function PricingCard({ name, price, credits, features, featured = false }: any) {
  return (
    <div className={featured ? 'card-gold p-6 relative' : 'surface p-6'}>
      {featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gold text-bg-base text-xs font-bold">
          Más elegido
        </span>
      )}
      <p className="text-sm text-fg-muted mb-2">{name}</p>
      <p className="font-serif text-4xl font-bold text-gold mb-1">{price}</p>
      <p className="text-sm text-fg-muted mb-6">{credits}</p>
      <ul className="space-y-2">
        {features.map((f: string, i: number) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
