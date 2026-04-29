'use client'

import { useState } from 'react'
import { Database, Search, Upload, Plus, Trash2, Check } from 'lucide-react'

type ScrapingTarget = {
  id: number
  tipo: string
  valor: string
  activo: boolean
  ultimo_scrape: string | null
  leads_encontrados: number
}

type LeadImport = {
  id: string
  fecha: string
  source_type: string
  filename: string | null
  total_filas: number
  procesados: number
  fallados: number
  status: string
}

type Props = {
  clienteId: string
  currentMode: 'scraping_auto' | 'byol' | 'mixed'
  scrapingTargets: ScrapingTarget[]
  imports: LeadImport[]
  totalLeads: number
}

export default function LeadsConfigClient({
  clienteId,
  currentMode,
  scrapingTargets,
  imports,
  totalLeads,
}: Props) {
  const [mode, setMode] = useState<'scraping_auto' | 'byol' | 'mixed'>(currentMode)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  // Scraping state
  const [newTipo, setNewTipo] = useState('hashtag')
  const [newValor, setNewValor] = useState('')

  // BYOL state
  const [csvText, setCsvText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)

  async function saveMode(newMode: typeof mode) {
    setSaving(true)
    try {
      const res = await fetch('/api/cliente/lead-source-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      })
      if (res.ok) {
        setMode(newMode)
        setSavedAt(new Date().toLocaleTimeString())
      }
    } finally {
      setSaving(false)
    }
  }

  async function addTarget() {
    if (!newValor.trim()) return
    const res = await fetch('/api/scraping/targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: newTipo, valor: newValor.trim() }),
    })
    if (res.ok) {
      setNewValor('')
      window.location.reload()
    }
  }

  async function toggleTarget(id: number, activo: boolean) {
    await fetch(`/api/scraping/targets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !activo }),
    })
    window.location.reload()
  }

  async function deleteTarget(id: number) {
    if (!confirm('¿Eliminar este target?')) return
    await fetch(`/api/scraping/targets/${id}`, { method: 'DELETE' })
    window.location.reload()
  }

  async function importCsv() {
    if (!csvText.trim()) return
    setImporting(true)
    setImportResult(null)
    try {
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText, source_type: 'csv' }),
      })
      const data = await res.json()
      if (res.ok) {
        setImportResult(
          `✅ ${data.procesados} leads importados, ${data.fallados} fallaron`
        )
        setCsvText('')
        setTimeout(() => window.location.reload(), 2000)
      } else {
        setImportResult(`❌ Error: ${data.error || 'desconocido'}`)
      }
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold">Fuente de leads</h1>
        <p className="text-fg-muted mt-1">
          Decidí cómo querés que el motor consiga leads para vos.
        </p>
      </div>

      {/* Stats */}
      <div className="surface p-6">
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-5 h-5 text-gold" />
          <h2 className="font-serif text-xl font-bold">Tu base actual</h2>
        </div>
        <p className="text-fg-muted text-sm">
          Tenés <span className="text-gold font-bold">{totalLeads}</span> leads en tu sistema.
        </p>
      </div>

      {/* Selector de modo */}
      <div className="surface p-6">
        <h2 className="font-serif text-xl font-bold mb-4">Modo de operación</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ModeCard
            icon={<Search className="w-6 h-6" />}
            title="Scraping automático"
            description="El motor busca leads en Instagram según hashtags, palabras clave y cuentas que vos definas."
            active={mode === 'scraping_auto'}
            disabled={saving}
            onClick={() => saveMode('scraping_auto')}
          />
          <ModeCard
            icon={<Upload className="w-6 h-6" />}
            title="Traer mi base (BYOL)"
            description="Ya tenés una lista de leads. Importás CSV o pegás handles y el motor los procesa."
            active={mode === 'byol'}
            disabled={saving}
            onClick={() => saveMode('byol')}
          />
          <ModeCard
            icon={<Database className="w-6 h-6" />}
            title="Mixto"
            description="El motor scrapea Y procesa lo que vos importás. Lo mejor de ambos."
            active={mode === 'mixed'}
            disabled={saving}
            onClick={() => saveMode('mixed')}
          />
        </div>
        {savedAt && (
          <p className="text-sm text-green-500 mt-4">
            ✓ Guardado a las {savedAt}
          </p>
        )}
      </div>

      {/* Tab content según modo */}
      {(mode === 'scraping_auto' || mode === 'mixed') && (
        <div className="surface p-6">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-5 h-5 text-gold" />
            <h2 className="font-serif text-xl font-bold">
              Targets de scraping ({scrapingTargets.length})
            </h2>
          </div>
          <p className="text-fg-muted text-sm mb-6">
            El motor va a scrapear perfiles de Instagram según estos criterios.
          </p>

          {/* Agregar target */}
          <div className="flex gap-2 mb-6">
            <select
              value={newTipo}
              onChange={(e) => setNewTipo(e.target.value)}
              className="px-3 py-2 bg-bg-elev border border-border rounded text-sm"
            >
              <option value="hashtag">Hashtag</option>
              <option value="keyword">Palabra clave</option>
              <option value="cuenta_seguidores">Seguidores de cuenta</option>
              <option value="cuenta_comentarios">Comentadores de cuenta</option>
            </select>
            <input
              value={newValor}
              onChange={(e) => setNewValor(e.target.value)}
              placeholder={
                newTipo === 'hashtag'
                  ? 'sin # (ej: emprendimiento)'
                  : newTipo === 'keyword'
                  ? 'palabra a buscar'
                  : 'username sin @'
              }
              className="flex-1 px-3 py-2 bg-bg-elev border border-border rounded text-sm"
            />
            <button
              onClick={addTarget}
              className="px-4 py-2 bg-gold text-bg-base rounded hover:bg-gold-hover flex items-center gap-2 text-sm font-bold"
            >
              <Plus className="w-4 h-4" /> Agregar
            </button>
          </div>

          {/* Lista de targets */}
          <div className="space-y-2">
            {scrapingTargets.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between py-2 px-3 bg-bg-elev rounded border border-border"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-fg-muted uppercase">{t.tipo}</span>
                  <span className="font-mono text-sm">{t.valor}</span>
                  {t.leads_encontrados > 0 && (
                    <span className="text-xs text-gold">
                      {t.leads_encontrados} leads
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleTarget(t.id, t.activo)}
                    className={`px-2 py-1 text-xs rounded ${
                      t.activo
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-fg-muted/20 text-fg-muted'
                    }`}
                  >
                    {t.activo ? 'Activo' : 'Pausado'}
                  </button>
                  <button
                    onClick={() => deleteTarget(t.id)}
                    className="p-1 text-fg-muted hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {scrapingTargets.length === 0 && (
              <p className="text-fg-muted text-sm py-4 text-center">
                Agregá tu primer target arriba.
              </p>
            )}
          </div>
        </div>
      )}

      {(mode === 'byol' || mode === 'mixed') && (
        <div className="surface p-6">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="w-5 h-5 text-gold" />
            <h2 className="font-serif text-xl font-bold">Importar leads</h2>
          </div>
          <p className="text-fg-muted text-sm mb-4">
            Pegá tu CSV con columnas{' '}
            <code className="text-gold">handle,nombre,bio,score,mensaje_enviado</code>
            . El campo <code className="text-gold">handle</code> es obligatorio.
          </p>

          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="handle,nombre,bio,score,mensaje_enviado&#10;leoncito_dev,Leoncito,Dev fullstack,8,Hola Leo, vi tu perfil...&#10;maria_coach,María,Coach de mindset,7,Hola María..."
            rows={8}
            className="w-full px-3 py-2 bg-bg-elev border border-border rounded text-sm font-mono"
          />
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={importCsv}
              disabled={importing || !csvText.trim()}
              className="px-4 py-2 bg-gold text-bg-base rounded hover:bg-gold-hover disabled:opacity-50 flex items-center gap-2 text-sm font-bold"
            >
              <Upload className="w-4 h-4" />
              {importing ? 'Importando...' : 'Importar CSV'}
            </button>
            {importResult && <span className="text-sm">{importResult}</span>}
          </div>

          {/* Historial imports */}
          {imports.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold mb-2">Imports recientes</h3>
              <div className="space-y-1">
                {imports.map((imp) => (
                  <div
                    key={imp.id}
                    className="flex items-center justify-between py-2 px-3 bg-bg-elev rounded text-sm"
                  >
                    <div>
                      <span className="text-fg-muted">
                        {new Date(imp.fecha).toLocaleString()}
                      </span>{' '}
                      · {imp.source_type}
                      {imp.filename && ` · ${imp.filename}`}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-500">
                        ✓ {imp.procesados}
                      </span>
                      {imp.fallados > 0 && (
                        <span className="text-red-500">✗ {imp.fallados}</span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          imp.status === 'completed'
                            ? 'bg-green-500/20 text-green-500'
                            : imp.status === 'failed'
                            ? 'bg-red-500/20 text-red-500'
                            : 'bg-fg-muted/20 text-fg-muted'
                        }`}
                      >
                        {imp.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ModeCard({
  icon,
  title,
  description,
  active,
  disabled,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  active: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-5 rounded-lg border text-left transition-all ${
        active
          ? 'border-gold bg-gold/5 shadow-gold'
          : 'border-border bg-bg-elev hover:border-gold/50'
      } disabled:opacity-50`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={active ? 'text-gold' : 'text-fg-muted'}>{icon}</div>
        {active && <Check className="w-5 h-5 text-gold" />}
      </div>
      <h3 className="font-serif text-lg font-bold mb-1">{title}</h3>
      <p className="text-xs text-fg-muted">{description}</p>
    </button>
  )
}
