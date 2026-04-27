'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Sparkles, Target, Mic, Loader2, CheckCircle2, AlertCircle, Save } from 'lucide-react'

type Tab = 'cuenta' | 'producto' | 'buyer' | 'voz'

export function ConfigTabs({ cliente, configInicial }: { cliente: any; configInicial: any }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('producto')
  const [config, setConfig] = useState({
    producto_nombre: configInicial?.producto_nombre || '',
    producto_descripcion: configInicial?.producto_descripcion || '',
    producto_propuesta_valor: configInicial?.producto_propuesta_valor || '',
    producto_precio_rango: configInicial?.producto_precio_rango || '',
    buyer_persona_descripcion: configInicial?.buyer_persona_descripcion || '',
    buyer_persona_nicho: configInicial?.buyer_persona_nicho || '',
    buyer_persona_dolor_principal: configInicial?.buyer_persona_dolor_principal || '',
    buyer_persona_objeciones_comunes: configInicial?.buyer_persona_objeciones_comunes || '',
    tono: configInicial?.tono || 'casual',
    region: configInicial?.region || 'AR',
    palabras_prohibidas: (configInicial?.palabras_prohibidas || []).join(', '),
    ejemplos_mensajes: configInicial?.ejemplos_mensajes || '',
    calificacion_criterio: configInicial?.calificacion_criterio || '',
    descalificacion_criterio: configInicial?.descalificacion_criterio || '',
    link_agenda: configInicial?.link_agenda || '',
    duracion_llamada_min: configInicial?.duracion_llamada_min || 15,
  })
  const [estado, setEstado] = useState<'idle' | 'guardando' | 'ok' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function guardar() {
    setEstado('guardando')
    setError(null)
    try {
      const payload = {
        ...config,
        palabras_prohibidas: config.palabras_prohibidas
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean),
        duracion_llamada_min: parseInt(String(config.duracion_llamada_min)) || 15,
      }
      const res = await fetch('/api/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setEstado('error')
        setError(data.error || 'Error desconocido')
        return
      }
      setEstado('ok')
      setTimeout(() => {
        setEstado('idle')
        router.refresh()
      }, 2000)
    } catch (e: any) {
      setEstado('error')
      setError(e?.message || 'Network error')
    }
  }

  const setField = (field: string, value: any) =>
    setConfig((c) => ({ ...c, [field]: value }))

  return (
    <div>
      {/* Tabs nav */}
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        <TabButton
          active={tab === 'cuenta'}
          onClick={() => setTab('cuenta')}
          icon={User}
          label="Cuenta"
        />
        <TabButton
          active={tab === 'producto'}
          onClick={() => setTab('producto')}
          icon={Sparkles}
          label="Producto"
        />
        <TabButton
          active={tab === 'buyer'}
          onClick={() => setTab('buyer')}
          icon={Target}
          label="Buyer Persona"
        />
        <TabButton
          active={tab === 'voz'}
          onClick={() => setTab('voz')}
          icon={Mic}
          label="Tu voz / Tono"
        />
      </div>

      {/* Tab content */}
      <div className="space-y-6">
        {tab === 'cuenta' && (
          <div className="surface p-6 space-y-3">
            <h2 className="font-serif text-xl font-bold mb-2">Datos de cuenta</h2>
            <Field label="Nombre" value={cliente.nombre_completo} />
            <Field label="Email" value={cliente.email} />
            <Field label="Empresa" value={cliente.empresa ?? '—'} />
            <Field label="Slug" value={cliente.slug} mono />
            <Field label="Estado" value={cliente.estado} />
            <Field
              label="Modalidad DB"
              value={cliente.db_modalidad ?? 'no configurada'}
            />
            <Field label="Schema" value={cliente.schema_db} mono />
            <p className="text-xs text-fg-subtle pt-2">
              Para cambiar email o slug, contactá soporte.
            </p>
          </div>
        )}

        {tab === 'producto' && (
          <div className="surface p-6 space-y-4">
            <div>
              <h2 className="font-serif text-xl font-bold">Tu producto / servicio</h2>
              <p className="text-sm text-fg-muted">
                Esta info la lee la IA para personalizar mensajes. Cuanto mejor lo
                describas, más natural va a sonar.
              </p>
            </div>

            <FormField label="Nombre del producto / servicio" required>
              <input
                value={config.producto_nombre}
                onChange={(e) => setField('producto_nombre', e.target.value)}
                placeholder="Ej: Sistema de Prospección Automatizada"
                className="input w-full"
              />
            </FormField>

            <FormField label="Descripción (qué hacés exactamente)">
              <textarea
                value={config.producto_descripcion}
                onChange={(e) => setField('producto_descripcion', e.target.value)}
                placeholder="Ej: Implemento sistemas de IA que generan leads cualificados en Instagram automáticamente, sin que tengas que mover un dedo. Trabajan 24/7 mientras dormís."
                className="input w-full h-24"
              />
            </FormField>

            <FormField label="Propuesta de valor (en una frase)">
              <input
                value={config.producto_propuesta_valor}
                onChange={(e) =>
                  setField('producto_propuesta_valor', e.target.value)
                }
                placeholder="Ej: Te traigo 50+ leads cualificados por mes sin tocar Instagram"
                className="input w-full"
              />
            </FormField>

            <FormField label="Rango de precio (opcional)">
              <input
                value={config.producto_precio_rango}
                onChange={(e) => setField('producto_precio_rango', e.target.value)}
                placeholder="Ej: USD 1500-3000 setup + 500/mes"
                className="input w-full"
              />
            </FormField>

            <FormField label="Link de agenda (Calendly, etc)">
              <input
                value={config.link_agenda}
                onChange={(e) => setField('link_agenda', e.target.value)}
                placeholder="https://calendly.com/tu-cuenta/15min"
                className="input w-full"
              />
            </FormField>

            <FormField label="Duración de la llamada (min)">
              <input
                type="number"
                value={config.duracion_llamada_min}
                onChange={(e) =>
                  setField('duracion_llamada_min', parseInt(e.target.value) || 15)
                }
                className="input w-32"
              />
            </FormField>
          </div>
        )}

        {tab === 'buyer' && (
          <div className="surface p-6 space-y-4">
            <div>
              <h2 className="font-serif text-xl font-bold">Buyer Persona ideal</h2>
              <p className="text-sm text-fg-muted">
                Quién es tu cliente perfecto. La IA usa esto para calificar y
                descalificar leads.
              </p>
            </div>

            <FormField label="Nicho / industria">
              <input
                value={config.buyer_persona_nicho}
                onChange={(e) =>
                  setField('buyer_persona_nicho', e.target.value)
                }
                placeholder="Ej: Cafetalleros mexicanos / Coaches de fitness / Agencias de marketing"
                className="input w-full"
              />
            </FormField>

            <FormField label="Descripción del cliente ideal">
              <textarea
                value={config.buyer_persona_descripcion}
                onChange={(e) =>
                  setField('buyer_persona_descripcion', e.target.value)
                }
                placeholder="Ej: Productor de café specialty mexicano, 35-55 años, factura USD 100K+/año, exporta a USA o quiere empezar a exportar, tiene 5-15 empleados."
                className="input w-full h-24"
              />
            </FormField>

            <FormField label="Dolor principal que resolvés">
              <textarea
                value={config.buyer_persona_dolor_principal}
                onChange={(e) =>
                  setField('buyer_persona_dolor_principal', e.target.value)
                }
                placeholder="Ej: No saben cómo conseguir compradores internacionales sin intermediarios que les bajen el margen."
                className="input w-full h-20"
              />
            </FormField>

            <FormField label="Objeciones comunes (separar por línea)">
              <textarea
                value={config.buyer_persona_objeciones_comunes}
                onChange={(e) =>
                  setField('buyer_persona_objeciones_comunes', e.target.value)
                }
                placeholder="Ej:
- 'No tengo tiempo para esto'
- 'Mi café es muy local, no creo que funcione'
- 'Ya probé de exportar y fue un dolor de cabeza'"
                className="input w-full h-32 font-mono text-sm"
              />
            </FormField>

            <FormField label="Criterio de calificación (qué SÍ es buen lead)">
              <textarea
                value={config.calificacion_criterio}
                onChange={(e) =>
                  setField('calificacion_criterio', e.target.value)
                }
                placeholder="Ej: Tiene finca propia o socios productores. Ya está vendiendo café (no idea). Quiere escalar."
                className="input w-full h-20"
              />
            </FormField>

            <FormField label="Criterio de descalificación (qué NO es lead)">
              <textarea
                value={config.descalificacion_criterio}
                onChange={(e) =>
                  setField('descalificacion_criterio', e.target.value)
                }
                placeholder="Ej: Solo quiere consumir café (no productor). Recién está empezando sin operación. Pregunta solo precio sin contexto."
                className="input w-full h-20"
              />
            </FormField>
          </div>
        )}

        {tab === 'voz' && (
          <div className="surface p-6 space-y-4">
            <div>
              <h2 className="font-serif text-xl font-bold">Tu voz / Tono</h2>
              <p className="text-sm text-fg-muted">
                Cómo te comunicás vos. La IA imita este estilo para que no parezca
                bot.
              </p>
            </div>

            <FormField label="Tono">
              <select
                value={config.tono}
                onChange={(e) => setField('tono', e.target.value)}
                className="input w-full"
              >
                <option value="casual">Casual y amigable (vos / tutear)</option>
                <option value="profesional">Profesional pero cercano</option>
                <option value="tecnico">Técnico / experto</option>
                <option value="formal">Formal (usted)</option>
                <option value="provocador">Provocador / disruptivo</option>
              </select>
            </FormField>

            <FormField label="Región / variante de español">
              <select
                value={config.region}
                onChange={(e) => setField('region', e.target.value)}
                className="input w-full"
              >
                <option value="AR">Argentina (vos, che, dale)</option>
                <option value="MX">México (tú, órale, qué onda)</option>
                <option value="ES">España (tú, vale, tío)</option>
                <option value="CO">Colombia (tú/vos, parcero)</option>
                <option value="CL">Chile (tú, weón, cachai)</option>
                <option value="PE">Perú (tú, pe)</option>
                <option value="ES_NEUTRO">Español neutro</option>
              </select>
            </FormField>

            <FormField
              label="Palabras prohibidas (separá por coma)"
              hint="La IA va a evitar estas palabras. Útil para no sonar genérico."
            >
              <textarea
                value={config.palabras_prohibidas}
                onChange={(e) =>
                  setField('palabras_prohibidas', e.target.value)
                }
                placeholder="potenciar, escalar, transformar, sinergia, oportunidad única, nivel"
                className="input w-full h-20"
              />
            </FormField>

            <FormField
              label="Ejemplos de tu voz"
              hint="Pegá 3-5 mensajes reales que escribirías a un cliente. La IA los usa para imitarte."
            >
              <textarea
                value={config.ejemplos_mensajes}
                onChange={(e) =>
                  setField('ejemplos_mensajes', e.target.value)
                }
                placeholder="Ej:
1. 'Vi que estás vendiendo en mercado local. Cuándo arrancaste?'
2. 'Bueno, te re entiendo. Probaste con compradores de USA directos?'
3. 'Mirá, te tiro un dato: el 80% de los productores mexicanos pierde 30% de margen por intermediarios.'"
                className="input w-full h-40 font-mono text-sm"
              />
            </FormField>
          </div>
        )}

        {/* Botón guardar */}
        {tab !== 'cuenta' && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {estado === 'ok' && (
                <div className="flex items-center gap-2 text-success text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Configuración guardada. La
                  IA va a usar esto en el próximo mensaje.
                </div>
              )}
              {estado === 'error' && (
                <div className="flex items-center gap-2 text-danger text-sm">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}
            </div>
            <button
              onClick={guardar}
              disabled={estado === 'guardando'}
              className="btn-primary"
            >
              {estado === 'guardando' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Guardar configuración
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: any
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 whitespace-nowrap ${
        active
          ? 'border-gold text-gold'
          : 'border-transparent text-fg-muted hover:text-fg'
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  )
}

function FormField({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-fg-subtle mt-1">{hint}</p>}
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-3 py-2 border-b border-border/40 last:border-0">
      <span className="text-sm text-fg-muted w-32 shrink-0">{label}</span>
      <span className={`text-sm ${mono ? 'font-mono text-gold' : ''}`}>{value}</span>
    </div>
  )
}
