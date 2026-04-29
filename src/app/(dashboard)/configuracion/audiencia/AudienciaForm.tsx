'use client'

import { useState } from 'react'
import { Users, Save } from 'lucide-react'

type Config = {
  buyer_persona_descripcion: string | null
  buyer_persona_nicho: string | null
  buyer_persona_dolor_principal: string | null
  buyer_persona_objeciones_comunes: string | null
  calificacion_criterio: string | null
  descalificacion_criterio: string | null
}

export default function AudienciaForm({ initialConfig }: { initialConfig: Config | null }) {
  const [config, setConfig] = useState<Config>({
    buyer_persona_descripcion: initialConfig?.buyer_persona_descripcion ?? '',
    buyer_persona_nicho: initialConfig?.buyer_persona_nicho ?? '',
    buyer_persona_dolor_principal: initialConfig?.buyer_persona_dolor_principal ?? '',
    buyer_persona_objeciones_comunes: initialConfig?.buyer_persona_objeciones_comunes ?? '',
    calificacion_criterio: initialConfig?.calificacion_criterio ?? '',
    descalificacion_criterio: initialConfig?.descalificacion_criterio ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/cliente/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'audiencia', data: config }),
      })
      if (res.ok) setSavedAt(new Date().toLocaleTimeString())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold flex items-center gap-3">
          <Users className="w-7 h-7 text-gold" />
          Audiencia
        </h1>
        <p className="text-fg-muted mt-1">A quién le hablás. La IA usa esto para calificar y conectar.</p>
      </div>

      <div className="surface p-6 space-y-5">
        <h2 className="font-serif text-lg font-bold">Buyer persona</h2>
        <TextArea
          label="Descripción del cliente ideal"
          help="Quién es, edad, profesión, situación."
          value={config.buyer_persona_descripcion ?? ''}
          onChange={(v) => setConfig({ ...config, buyer_persona_descripcion: v })}
          placeholder="Ej: Emprendedores latinos digitales 28-45 años que facturan 5-50K USD/mes y quieren escalar."
          rows={3}
        />
        <Field
          label="Nicho específico"
          help="Vertical o industria."
          value={config.buyer_persona_nicho ?? ''}
          onChange={(v) => setConfig({ ...config, buyer_persona_nicho: v })}
          placeholder="Ej: Coaches, consultores, agencias de marketing"
        />
        <TextArea
          label="Dolor principal"
          help="Qué problema concreto resuelve tu producto."
          value={config.buyer_persona_dolor_principal ?? ''}
          onChange={(v) => setConfig({ ...config, buyer_persona_dolor_principal: v })}
          placeholder="Ej: Trabajan 12h/día respondiendo DMs sin tiempo para escalar"
          rows={3}
        />
        <TextArea
          label="Objeciones comunes"
          help="Qué te dicen para no comprar. La IA los va a anticipar."
          value={config.buyer_persona_objeciones_comunes ?? ''}
          onChange={(v) => setConfig({ ...config, buyer_persona_objeciones_comunes: v })}
          placeholder="Ej: 'Es muy caro', 'Necesito pensarlo', 'Ya tengo equipo'"
          rows={3}
        />
      </div>

      <div className="surface p-6 space-y-5">
        <h2 className="font-serif text-lg font-bold">Calificación de leads</h2>
        <TextArea
          label="Criterios para calificar (lead bueno)"
          help="Qué señales tiene un cliente potencial."
          value={config.calificacion_criterio ?? ''}
          onChange={(v) => setConfig({ ...config, calificacion_criterio: v })}
          placeholder="Ej: Tiene negocio activo, factura más de 5K/mes, está saturado de DMs"
          rows={3}
        />
        <TextArea
          label="Criterios para descalificar (no es para vos)"
          help="Cuándo el lead NO es ideal y la IA debe descartar."
          value={config.descalificacion_criterio ?? ''}
          onChange={(v) => setConfig({ ...config, descalificacion_criterio: v })}
          placeholder="Ej: Es estudiante, busca trabajo, no tiene negocio, tira directo a venta"
          rows={3}
        />
      </div>

      <div className="flex items-center gap-4">
        <button onClick={save} disabled={saving} className="btn-primary">
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {savedAt && <span className="text-sm text-success">✓ Guardado a las {savedAt}</span>}
      </div>
    </div>
  )
}

function Field({ label, help, value, onChange, placeholder }: any) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input w-full" />
      {help && <p className="text-xs text-fg-muted mt-1">{help}</p>}
    </div>
  )
}

function TextArea({ label, help, value, onChange, placeholder, rows }: any) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows ?? 3} className="input w-full" />
      {help && <p className="text-xs text-fg-muted mt-1">{help}</p>}
    </div>
  )
}
