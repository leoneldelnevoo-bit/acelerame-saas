'use client'

import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, Database, Cloud, CheckCircle2, AlertTriangle, Loader2, FileText, X, ArrowRight, Download } from 'lucide-react'

type ImportRecord = {
  id: number
  fecha: string
  source_type: string
  filename: string | null
  total_filas: number
  procesados: number
  fallados: number
  status: string
}

type Preview = {
  total: number
  validos: number
  duplicados: number
  erroresCount: number
  erroresPreview: Array<{ fila: number; error: string }>
  columnasOriginales: string[]
  mapeo: Record<string, string>
  ambiguas: string[]
  primerasFilas: any[]
}

type Modo = 'archivo' | 'sheets' | 'supabase'

const CAMPOS_DISPONIBLES = [
  { id: 'handle', label: '@handle (obligatorio)', required: true },
  { id: 'nombre', label: 'Nombre', required: false },
  { id: 'bio', label: 'Bio / Descripción', required: false },
  { id: 'email', label: 'Email', required: false },
  { id: 'telefono', label: 'Teléfono', required: false },
  { id: 'score', label: 'Score (1-10)', required: false },
  { id: 'mensaje_enviado', label: 'Mensaje cold DM listo', required: false },
  { id: 'fuente', label: 'Fuente / Origen', required: false },
]

export default function ImportClient({ imports }: { imports: ImportRecord[] }) {
  const [modo, setModo] = useState<Modo>('archivo')
  const [step, setStep] = useState<'config' | 'preview' | 'done'>('config')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [resultado, setResultado] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estado por modo
  const [archivo, setArchivo] = useState<File | null>(null)
  const [sheetUrl, setSheetUrl] = useState('')
  const [supaConfig, setSupaConfig] = useState({ url: '', anonKey: '', tabla: '' })
  const [mapeoEditable, setMapeoEditable] = useState<Record<string, string>>({})

  const fileRef = useRef<HTMLInputElement>(null)

  function reset() {
    setStep('config')
    setPreview(null)
    setResultado(null)
    setError(null)
    setArchivo(null)
    setSheetUrl('')
    setSupaConfig({ url: '', anonKey: '', tabla: '' })
    setMapeoEditable({})
    if (fileRef.current) fileRef.current.value = ''
  }

  async function generarPreview() {
    setError(null)
    setLoading(true)
    try {
      let res: Response
      if (modo === 'archivo') {
        if (!archivo) { setError('Subí un archivo'); setLoading(false); return }
        const fd = new FormData()
        fd.append('file', archivo)
        res = await fetch('/api/cliente/import/preview', { method: 'POST', body: fd })
      } else if (modo === 'sheets') {
        if (!sheetUrl.trim()) { setError('Pegá la URL de Google Sheets'); setLoading(false); return }
        res = await fetch('/api/cliente/import/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo: 'sheets', url: sheetUrl.trim() }),
        })
      } else {
        if (!supaConfig.url || !supaConfig.anonKey || !supaConfig.tabla) {
          setError('Completá los 3 campos de Supabase'); setLoading(false); return
        }
        res = await fetch('/api/cliente/import/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo: 'supabase', ...supaConfig }),
        })
      }

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error en preview')
        setLoading(false)
        return
      }
      setPreview(data)
      setMapeoEditable(data.mapeo)
      setStep('preview')
    } catch (e: any) {
      setError(e?.message || 'Error de red')
    } finally {
      setLoading(false)
    }
  }

  async function importar() {
    setError(null)
    setLoading(true)
    try {
      let res: Response
      if (modo === 'archivo') {
        const fd = new FormData()
        fd.append('file', archivo!)
        fd.append('mapeo', JSON.stringify(mapeoEditable))
        res = await fetch('/api/cliente/import/process', { method: 'POST', body: fd })
      } else if (modo === 'sheets') {
        res = await fetch('/api/cliente/import/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo: 'sheets', url: sheetUrl, mapeo: mapeoEditable }),
        })
      } else {
        res = await fetch('/api/cliente/import/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo: 'supabase', ...supaConfig, mapeo: mapeoEditable }),
        })
      }

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error en import')
        setLoading(false)
        return
      }
      setResultado(data)
      setStep('done')
    } catch (e: any) {
      setError(e?.message || 'Error de red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold flex items-center gap-3">
          <Upload className="w-7 h-7 text-gold" />
          Importar leads
        </h1>
        <p className="text-fg-muted mt-1">
          Subí tu base existente desde un archivo, Google Sheets o Supabase.
          El motor va a procesarlos automáticamente como cold DMs.
        </p>
      </div>

      {/* === STEP 1: Selección de modo === */}
      {step === 'config' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ModoCard
              icon={FileSpreadsheet}
              titulo="Archivo"
              desc="CSV, Excel (.xlsx) o JSON"
              activo={modo === 'archivo'}
              onClick={() => setModo('archivo')}
            />
            <ModoCard
              icon={Cloud}
              titulo="Google Sheets"
              desc="Hoja pública de Google"
              activo={modo === 'sheets'}
              onClick={() => setModo('sheets')}
            />
            <ModoCard
              icon={Database}
              titulo="Supabase"
              desc="Tu propio Supabase externo"
              activo={modo === 'supabase'}
              onClick={() => setModo('supabase')}
            />
          </div>

          {/* Forms por modo */}
          {modo === 'archivo' && (
            <div className="surface p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Archivo (CSV, XLSX, XLS, JSON)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${archivo ? 'border-success bg-success/5' : 'border-border hover:border-gold/50'}`}
                >
                  <Upload className={`w-10 h-10 mx-auto mb-2 ${archivo ? 'text-success' : 'text-fg-muted'}`} />
                  {archivo ? (
                    <div>
                      <p className="font-bold text-success">{archivo.name}</p>
                      <p className="text-xs text-fg-muted mt-1">{(archivo.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold">Click para subir o arrastrá un archivo</p>
                      <p className="text-xs text-fg-muted mt-1">Máximo 10 MB · Hasta 5000 filas</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.tsv,.xlsx,.xls,.json,.txt"
                  onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-fg-muted">
                💡 La primera fila del archivo debe tener los nombres de columna (handle, nombre, bio, etc.)
              </p>
            </div>
          )}

          {modo === 'sheets' && (
            <div className="surface p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">URL de Google Sheets</label>
                <input
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="input w-full font-mono text-sm"
                />
                <p className="text-xs text-fg-muted mt-2">
                  La hoja tiene que ser <strong>pública</strong>: en Google Sheets → Compartir → "Anyone with the link can view".
                </p>
              </div>
            </div>
          )}

          {modo === 'supabase' && (
            <div className="surface p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">URL del proyecto Supabase</label>
                <input
                  type="url"
                  value={supaConfig.url}
                  onChange={(e) => setSupaConfig({ ...supaConfig, url: e.target.value })}
                  placeholder="https://abcdefgh.supabase.co"
                  className="input w-full font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Anon key (público)</label>
                <input
                  type="password"
                  value={supaConfig.anonKey}
                  onChange={(e) => setSupaConfig({ ...supaConfig, anonKey: e.target.value })}
                  placeholder="eyJhbGc..."
                  className="input w-full font-mono text-sm"
                  autoComplete="off"
                />
                <p className="text-xs text-fg-muted mt-1">
                  ⚠️ Solo el <code>anon</code> key (no el service role). Lo encontrás en Settings → API.
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Nombre de la tabla</label>
                <input
                  type="text"
                  value={supaConfig.tabla}
                  onChange={(e) => setSupaConfig({ ...supaConfig, tabla: e.target.value })}
                  placeholder="leads"
                  className="input w-full font-mono text-sm"
                />
                <p className="text-xs text-fg-muted mt-1">
                  La tabla debe estar accesible vía RLS al anon key (usá una policy <code>SELECT</code> pública o un view).
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="surface p-4 border-danger/40 bg-danger/5">
              <p className="text-sm text-danger">⚠️ {error}</p>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button onClick={generarPreview} disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? 'Analizando...' : 'Continuar a vista previa'}
            </button>
          </div>
        </>
      )}

      {/* === STEP 2: Preview con mapeo editable === */}
      {step === 'preview' && preview && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Total filas" value={preview.total} />
            <Stat label="Válidos" value={preview.validos} color="success" />
            <Stat label="Duplicados" value={preview.duplicados} color="warning" />
            <Stat label="Errores" value={preview.erroresCount} color="danger" />
          </div>

          <div className="surface p-6 space-y-4">
            <h2 className="font-serif text-xl font-bold">Mapeo de columnas</h2>
            <p className="text-sm text-fg-muted">
              Confirmá qué columna de tu archivo corresponde a cada campo del sistema.
            </p>

            <div className="space-y-2">
              {preview.columnasOriginales.map((col) => (
                <div key={col} className="flex items-center gap-3 flex-wrap">
                  <code className="bg-bg-overlay px-2 py-1 rounded text-sm font-mono min-w-[180px]">{col}</code>
                  <ArrowRight className="w-4 h-4 text-fg-muted shrink-0" />
                  <select
                    value={mapeoEditable[col] || ''}
                    onChange={(e) => {
                      const newMapeo = { ...mapeoEditable }
                      if (e.target.value) newMapeo[col] = e.target.value
                      else delete newMapeo[col]
                      setMapeoEditable(newMapeo)
                    }}
                    className="input flex-1 max-w-xs"
                  >
                    <option value="">— Ignorar esta columna —</option>
                    {CAMPOS_DISPONIBLES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview tabla */}
          <div className="surface overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-serif text-lg font-bold">Preview · primeros 10 leads</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-overlay">
                  <tr className="text-left">
                    <th className="px-4 py-2 font-medium text-fg-muted">Handle</th>
                    <th className="px-4 py-2 font-medium text-fg-muted">Nombre</th>
                    <th className="px-4 py-2 font-medium text-fg-muted">Score</th>
                    <th className="px-4 py-2 font-medium text-fg-muted">Mensaje</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.primerasFilas.map((lead, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="px-4 py-2 font-mono">@{lead.handle}</td>
                      <td className="px-4 py-2">{lead.nombre || '—'}</td>
                      <td className="px-4 py-2 font-mono">{lead.score ?? '—'}</td>
                      <td className="px-4 py-2 truncate max-w-xs text-xs">
                        {lead.mensaje_enviado || <span className="text-fg-subtle">(sin mensaje)</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {preview.erroresPreview.length > 0 && (
            <div className="surface p-4 border-warning/30">
              <p className="font-bold text-warning mb-2">⚠️ Algunos errores encontrados:</p>
              <ul className="text-sm text-fg-muted space-y-1">
                {preview.erroresPreview.map((e, i) => (
                  <li key={i}>· Fila {e.fila}: {e.error}</li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="surface p-4 border-danger/40 bg-danger/5">
              <p className="text-sm text-danger">⚠️ {error}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button onClick={reset} className="btn-ghost">
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button onClick={importar} disabled={loading || preview.validos === 0} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {loading ? 'Importando...' : `Importar ${preview.validos} leads`}
            </button>
          </div>
        </>
      )}

      {/* === STEP 3: Resultado === */}
      {step === 'done' && resultado && (
        <div className="surface p-8 border-success/40 bg-success/5 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
          <h2 className="font-serif text-3xl font-bold text-success">¡Import exitoso!</h2>
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <Stat label="Importados" value={resultado.importado} color="success" />
            <Stat label="Duplicados" value={resultado.duplicados_omitidos} color="warning" />
            <Stat label="Errores" value={resultado.errores + (resultado.fallados || 0)} color="danger" />
          </div>
          <p className="text-fg-muted">
            Los leads ya están en tu base. El motor va a empezar a procesarlos en el próximo ciclo (cada 10 min).
          </p>
          <div className="flex items-center justify-center gap-3">
            <a href="/leads" className="btn-primary">Ver mis leads</a>
            <button onClick={reset} className="btn-ghost">Importar otro</button>
          </div>
        </div>
      )}

      {/* === Historial de imports === */}
      {step === 'config' && imports.length > 0 && (
        <div className="surface overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-serif text-lg font-bold">Historial de imports</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-bg-overlay">
              <tr className="text-left">
                <th className="px-4 py-2 font-medium text-fg-muted">Fecha</th>
                <th className="px-4 py-2 font-medium text-fg-muted">Origen</th>
                <th className="px-4 py-2 font-medium text-fg-muted">Procesados</th>
                <th className="px-4 py-2 font-medium text-fg-muted">Estado</th>
              </tr>
            </thead>
            <tbody>
              {imports.map((imp) => (
                <tr key={imp.id} className="border-b border-border/50">
                  <td className="px-4 py-2 text-xs text-fg-muted">{new Date(imp.fecha).toLocaleString()}</td>
                  <td className="px-4 py-2"><code className="text-xs">{imp.source_type}</code> · {imp.filename?.substring(0, 40)}</td>
                  <td className="px-4 py-2 font-mono">{imp.procesados} / {imp.total_filas}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      imp.status === 'completado' ? 'bg-success/10 text-success' :
                      imp.status === 'parcial' ? 'bg-warning/10 text-warning' :
                      imp.status === 'procesando' ? 'bg-info/10 text-info' :
                      'bg-danger/10 text-danger'
                    }`}>{imp.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Templates de descarga */}
      {step === 'config' && (
        <details className="surface p-5">
          <summary className="cursor-pointer font-bold">📄 ¿Necesitás un template de ejemplo?</summary>
          <div className="mt-4 space-y-3">
            <p className="text-sm text-fg-muted">Descargá un template con las columnas correctas:</p>
            <div className="flex gap-3 flex-wrap">
              <a href="/templates/leads-template.csv" download className="btn-ghost text-xs">
                <Download className="w-3 h-3" /> CSV template
              </a>
              <a href="/templates/leads-template.xlsx" download className="btn-ghost text-xs">
                <Download className="w-3 h-3" /> Excel template
              </a>
            </div>
            <div className="bg-bg-overlay/50 rounded p-3 text-xs font-mono">
              <p className="font-bold mb-1">Columnas reconocidas automáticamente:</p>
              <p className="text-fg-muted">handle, nombre, bio, email, telefono, score, mensaje, fuente</p>
              <p className="text-fg-muted mt-1">También se aceptan: username, full_name, biography, descripcion, etc.</p>
            </div>
          </div>
        </details>
      )}
    </div>
  )
}

function ModoCard({ icon: Icon, titulo, desc, activo, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`p-5 rounded-lg border text-left transition-colors ${
        activo ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/50'
      }`}
    >
      <Icon className={`w-8 h-8 mb-2 ${activo ? 'text-gold' : 'text-fg-muted'}`} />
      <p className="font-bold">{titulo}</p>
      <p className="text-xs text-fg-muted">{desc}</p>
    </button>
  )
}

function Stat({ label, value, color = 'default' }: { label: string; value: number; color?: 'default' | 'success' | 'warning' | 'danger' }) {
  const colorClass = color === 'success' ? 'text-success' : color === 'warning' ? 'text-warning' : color === 'danger' ? 'text-danger' : 'text-fg'
  return (
    <div className="surface p-4">
      <p className="text-xs text-fg-subtle uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-serif text-3xl font-bold ${colorClass}`}>{value}</p>
    </div>
  )
}
