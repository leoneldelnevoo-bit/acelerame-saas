'use client'

import { useState } from 'react'
import { Shield, Clock, Zap } from 'lucide-react'

type Limites = {
  cliente_id: string
  max_dms_por_dia: number
  max_followups_por_dia: number
  max_replies_por_ciclo: number
  max_acciones_por_hora: number
  hora_inicio: number
  hora_fin: number
  zona_horaria: string
  cooldown_entre_dms_seg: number
  cooldown_followup_horas: number
  score_minimo: number
  max_objeciones_antes_descartar: number
  scraping_intervalo_horas: number
  scraping_max_perfiles_dia: number
}

export default function LimitesClient({
  clienteId,
  initialLimites,
}: {
  clienteId: string
  initialLimites: Limites | null
}) {
  const [limites, setLimites] = useState<Limites>(
    initialLimites || ({
      cliente_id: clienteId,
      max_dms_por_dia: 30,
      max_followups_por_dia: 15,
      max_replies_por_ciclo: 2,
      max_acciones_por_hora: 10,
      hora_inicio: 8,
      hora_fin: 22,
      zona_horaria: 'America/Argentina/Buenos_Aires',
      cooldown_entre_dms_seg: 90,
      cooldown_followup_horas: 24,
      score_minimo: 7,
      max_objeciones_antes_descartar: 3,
      scraping_intervalo_horas: 6,
      scraping_max_perfiles_dia: 100,
    } as Limites)
  )
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  function update<K extends keyof Limites>(key: K, value: Limites[K]) {
    setLimites({ ...limites, [key]: value })
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/cliente/limites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(limites),
      })
      if (res.ok) setSavedAt(new Date().toLocaleTimeString())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold">Límites operativos</h1>
        <p className="text-fg-muted mt-1">
          Controles anti-ban. Más conservador = más seguro pero más lento.
        </p>
      </div>

      <div className="surface p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-gold" />
          <h2 className="font-serif text-xl font-bold">Límites de mensajes</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumField
            label="Max DMs nuevos por día"
            help="Recomendado: 20-30. >50 = riesgo de ban."
            value={limites.max_dms_por_dia}
            min={1}
            max={100}
            onChange={(v) => update('max_dms_por_dia', v)}
          />
          <NumField
            label="Max follow-ups por día"
            help="Followups después de 24h sin respuesta."
            value={limites.max_followups_por_dia}
            min={0}
            max={50}
            onChange={(v) => update('max_followups_por_dia', v)}
          />
          <NumField
            label="Max replies por ciclo (10 min)"
            help="Cuántas respuestas a leads que respondieron."
            value={limites.max_replies_por_ciclo}
            min={0}
            max={10}
            onChange={(v) => update('max_replies_por_ciclo', v)}
          />
          <NumField
            label="Max acciones por hora"
            help="Tope global por hora — incluye DMs, replies, checks."
            value={limites.max_acciones_por_hora}
            min={1}
            max={30}
            onChange={(v) => update('max_acciones_por_hora', v)}
          />
        </div>
      </div>

      <div className="surface p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-gold" />
          <h2 className="font-serif text-xl font-bold">Horario de trabajo</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumField
            label="Hora de inicio"
            help="0-23"
            value={limites.hora_inicio}
            min={0}
            max={23}
            onChange={(v) => update('hora_inicio', v)}
          />
          <NumField
            label="Hora de fin"
            help="0-23"
            value={limites.hora_fin}
            min={0}
            max={23}
            onChange={(v) => update('hora_fin', v)}
          />
          <div className="flex flex-col">
            <label className="text-sm font-bold mb-1">Zona horaria</label>
            <select
              value={limites.zona_horaria}
              onChange={(e) => update('zona_horaria', e.target.value)}
              className="px-3 py-2 bg-bg-elev border border-border rounded text-sm"
            >
              <option value="America/Argentina/Buenos_Aires">Buenos Aires (-3)</option>
              <option value="America/Mexico_City">Ciudad de México (-6)</option>
              <option value="America/Bogota">Bogotá (-5)</option>
              <option value="America/Lima">Lima (-5)</option>
              <option value="America/Santiago">Santiago (-3/-4)</option>
              <option value="America/New_York">New York (-5)</option>
              <option value="Europe/Madrid">Madrid (+1)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="surface p-6">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-5 h-5 text-gold" />
          <h2 className="font-serif text-xl font-bold">Cooldowns y filtros</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumField
            label="Segundos entre DMs"
            help="Tiempo mínimo entre dos DMs. <30s = bot detection."
            value={limites.cooldown_entre_dms_seg}
            min={30}
            max={600}
            onChange={(v) => update('cooldown_entre_dms_seg', v)}
          />
          <NumField
            label="Horas antes de un follow-up"
            help="Cuánto esperar antes de mandar followup."
            value={limites.cooldown_followup_horas}
            min={12}
            max={168}
            onChange={(v) => update('cooldown_followup_horas', v)}
          />
          <NumField
            label="Score mínimo de leads"
            help="Solo contactar leads con score >= a este."
            value={limites.score_minimo}
            min={1}
            max={10}
            onChange={(v) => update('score_minimo', v)}
          />
          <NumField
            label="Max objeciones antes descartar"
            help="Tras X objeciones, lead pasa a etapa 99."
            value={limites.max_objeciones_antes_descartar}
            min={1}
            max={5}
            onChange={(v) => update('max_objeciones_antes_descartar', v)}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-3 bg-gold text-bg-base rounded font-bold hover:bg-gold-hover disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {savedAt && <span className="text-sm text-green-500">✓ Guardado a las {savedAt}</span>}
      </div>
    </div>
  )
}

function NumField({
  label,
  help,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  help?: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-bold mb-1">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="px-3 py-2 bg-bg-elev border border-border rounded text-sm"
      />
      {help && <span className="text-xs text-fg-muted mt-1">{help}</span>}
    </div>
  )
}
