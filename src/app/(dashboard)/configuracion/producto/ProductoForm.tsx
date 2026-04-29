'use client'

import { useState } from 'react'
import { Settings, Save } from 'lucide-react'

type Config = {
  producto_nombre: string | null
  producto_descripcion: string | null
  producto_propuesta_valor: string | null
  producto_precio_rango: string | null
}

export default function ProductoForm({ initialConfig }: { initialConfig: Config | null }) {
  const [config, setConfig] = useState<Config>({
    producto_nombre: initialConfig?.producto_nombre ?? '',
    producto_descripcion: initialConfig?.producto_descripcion ?? '',
    producto_propuesta_valor: initialConfig?.producto_propuesta_valor ?? '',
    producto_precio_rango: initialConfig?.producto_precio_rango ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/cliente/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'producto', data: config }),
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
          <Settings className="w-7 h-7 text-gold" />
          Producto
        </h1>
        <p className="text-fg-muted mt-1">Qué vendés. La IA lo usa para personalizar cada mensaje.</p>
      </div>

      <div className="surface p-6 space-y-5">
        <Field
          label="Nombre del producto/servicio"
          help="Ej: ACELERAME, Sukhafé, Mentoría 1:1, etc."
          value={config.producto_nombre ?? ''}
          onChange={(v) => setConfig({ ...config, producto_nombre: v })}
          placeholder="Mi producto"
        />
        <TextArea
          label="Descripción corta"
          help="2-3 oraciones de qué hace tu producto/servicio."
          value={config.producto_descripcion ?? ''}
          onChange={(v) => setConfig({ ...config, producto_descripcion: v })}
          placeholder="Ej: Sistema automatizado de prospección B2B en Instagram que..."
          rows={3}
        />
        <TextArea
          label="Propuesta de valor"
          help="El beneficio principal. Qué transformación logra el cliente."
          value={config.producto_propuesta_valor ?? ''}
          onChange={(v) => setConfig({ ...config, producto_propuesta_valor: v })}
          placeholder="Ej: 30+ leads cualificados/mes en IG sin tocar un DM."
          rows={3}
        />
        <Field
          label="Rango de precio"
          help="Cómo lo vendés. La IA lo menciona si el lead pregunta."
          value={config.producto_precio_rango ?? ''}
          onChange={(v) => setConfig({ ...config, producto_precio_rango: v })}
          placeholder="Ej: USD 1.500 setup + USD 200/mes"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary"
        >
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
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input w-full"
      />
      {help && <p className="text-xs text-fg-muted mt-1">{help}</p>}
    </div>
  )
}

function TextArea({ label, help, value, onChange, placeholder, rows }: any) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows ?? 3}
        className="input w-full"
      />
      {help && <p className="text-xs text-fg-muted mt-1">{help}</p>}
    </div>
  )
}
