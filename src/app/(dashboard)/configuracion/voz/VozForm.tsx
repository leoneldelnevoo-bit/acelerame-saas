'use client'

import { useState } from 'react'
import { Mic, Save, X, Plus } from 'lucide-react'

type Config = {
  tono: string | null
  idioma: string | null
  region: string | null
  palabras_prohibidas: string[] | null
  ejemplos_mensajes: string | null
}

export default function VozForm({ initialConfig }: { initialConfig: Config | null }) {
  const [config, setConfig] = useState<Config>({
    tono: initialConfig?.tono ?? 'casual',
    idioma: initialConfig?.idioma ?? 'es',
    region: initialConfig?.region ?? 'AR',
    palabras_prohibidas: Array.isArray(initialConfig?.palabras_prohibidas) ? initialConfig!.palabras_prohibidas! : [],
    ejemplos_mensajes: initialConfig?.ejemplos_mensajes ?? '',
  })
  const [nuevaPalabra, setNuevaPalabra] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  function agregarPalabra() {
    const p = nuevaPalabra.trim().toLowerCase()
    if (!p) return
    if ((config.palabras_prohibidas ?? []).includes(p)) return
    setConfig({ ...config, palabras_prohibidas: [...(config.palabras_prohibidas ?? []), p] })
    setNuevaPalabra('')
  }

  function quitarPalabra(p: string) {
    setConfig({ ...config, palabras_prohibidas: (config.palabras_prohibidas ?? []).filter((x) => x !== p) })
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/cliente/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'voz', data: config }),
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
          <Mic className="w-7 h-7 text-gold" />
          Voz e IA
        </h1>
        <p className="text-fg-muted mt-1">Cómo escribe la IA en tu nombre.</p>
      </div>

      <div className="surface p-6 space-y-5">
        <h2 className="font-serif text-lg font-bold">Estilo de escritura</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">Tono</label>
            <select value={config.tono ?? 'casual'} onChange={(e) => setConfig({ ...config, tono: e.target.value })} className="input w-full">
              <option value="casual">Casual</option>
              <option value="profesional">Profesional</option>
              <option value="amigable">Amigable</option>
              <option value="directo">Directo</option>
              <option value="empatico">Empático</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Idioma</label>
            <select value={config.idioma ?? 'es'} onChange={(e) => setConfig({ ...config, idioma: e.target.value })} className="input w-full">
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Región</label>
            <select value={config.region ?? 'AR'} onChange={(e) => setConfig({ ...config, region: e.target.value })} className="input w-full">
              <option value="AR">Argentina (vos, tenés)</option>
              <option value="MX">México (tú, tienes)</option>
              <option value="ES">España (tú, tienes)</option>
              <option value="CO">Colombia (tú/usted)</option>
              <option value="generico">Genérico LATAM</option>
            </select>
          </div>
        </div>
      </div>

      <div className="surface p-6 space-y-4">
        <h2 className="font-serif text-lg font-bold">Palabras prohibidas</h2>
        <p className="text-sm text-fg-muted">La IA jamás va a usar estas palabras en tus mensajes.</p>

        <div className="flex gap-2">
          <input
            type="text"
            value={nuevaPalabra}
            onChange={(e) => setNuevaPalabra(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && agregarPalabra()}
            placeholder="ej: potenciar, sinergia, mindset"
            className="input flex-1"
          />
          <button onClick={agregarPalabra} className="btn-primary">
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>

        {(config.palabras_prohibidas ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(config.palabras_prohibidas ?? []).map((p) => (
              <span key={p} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-danger/10 border border-danger/30 text-danger text-sm">
                {p}
                <button onClick={() => quitarPalabra(p)} className="hover:opacity-60">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="surface p-6 space-y-4">
        <h2 className="font-serif text-lg font-bold">Ejemplos de tu voz</h2>
        <p className="text-sm text-fg-muted">
          Pegá 3-5 mensajes reales tuyos. La IA los va a imitar como referencia (few-shot).
        </p>
        <textarea
          value={config.ejemplos_mensajes ?? ''}
          onChange={(e) => setConfig({ ...config, ejemplos_mensajes: e.target.value })}
          rows={10}
          placeholder="Mensaje 1: Hola Pablo, vi que comentaste en el post de Cardone. Te mando un audio bla bla...&#10;&#10;Mensaje 2: Che, ¿cómo andás? Buenísimo lo que estás haciendo con tu agencia..."
          className="input w-full font-mono text-sm"
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
