'use client'

import { useState } from 'react'
import { Calendar, Save, ExternalLink } from 'lucide-react'

type Config = {
  link_agenda: string | null
  duracion_llamada_min: number | null
}

export default function AgendaForm({ initialConfig }: { initialConfig: Config | null }) {
  const [config, setConfig] = useState<Config>({
    link_agenda: initialConfig?.link_agenda ?? '',
    duracion_llamada_min: initialConfig?.duracion_llamada_min ?? 20,
  })
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/cliente/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'agenda', data: config }),
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
          <Calendar className="w-7 h-7 text-gold" />
          Agenda
        </h1>
        <p className="text-fg-muted mt-1">El link que la IA manda cuando un lead acepta llamada.</p>
      </div>

      <div className="surface p-6 space-y-5">
        <div>
          <label className="block text-sm font-bold mb-1">Link de tu calendario</label>
          <input
            type="url"
            value={config.link_agenda ?? ''}
            onChange={(e) => setConfig({ ...config, link_agenda: e.target.value })}
            placeholder="https://calendly.com/tu-nombre o https://acelerame.online/agendar.html"
            className="input w-full"
          />
          <p className="text-xs text-fg-muted mt-1">
            Calendly, Cal.com, TidyCal, Google Calendar, o tu propio link.
          </p>
          {config.link_agenda && (
            <a href={config.link_agenda} target="_blank" rel="noopener noreferrer" className="text-xs text-gold hover:underline inline-flex items-center gap-1 mt-2">
              Probar link <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Duración de la llamada (minutos)</label>
          <input
            type="number"
            min={10}
            max={120}
            value={config.duracion_llamada_min ?? 20}
            onChange={(e) => setConfig({ ...config, duracion_llamada_min: parseInt(e.target.value) || 20 })}
            className="input md:w-32"
          />
          <p className="text-xs text-fg-muted mt-1">
            La IA lo menciona cuando propone la llamada. Recomendado: 15-30 min para llamadas de descubrimiento.
          </p>
        </div>
      </div>

      <div className="surface p-6 bg-bg-overlay/50">
        <p className="text-sm font-bold mb-2">Cómo lo usa la IA</p>
        <p className="text-sm text-fg-muted mb-3">
          Cuando un lead llega a la etapa "Aceptó llamada" (etapa 10), la IA va a mandar un mensaje similar a:
        </p>
        <div className="bg-bg-base rounded-lg p-3 text-sm font-mono text-fg-muted border border-border">
          {config.link_agenda
            ? `Genial! Acá te dejo mi link para coordinar una llamada de ${config.duracion_llamada_min} min: ${config.link_agenda}`
            : 'Falta configurar tu link de agenda arriba.'}
        </div>
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
