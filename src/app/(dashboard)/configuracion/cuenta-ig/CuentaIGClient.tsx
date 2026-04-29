'use client'

import { useState } from 'react'
import { Instagram, Plus, Trash2, AlertTriangle, Eye, EyeOff, ExternalLink } from 'lucide-react'

type Cuenta = {
  id: number
  username: string
  tipo: string
  estado: string
  sessionid: string | null
  dms_hoy: number
  ultimo_dm: string | null
  score_min: number | null
  score_max: number | null
}

export default function CuentaIGClient({ clienteId, cuentas }: { clienteId: string; cuentas: Cuenta[] }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newCuenta, setNewCuenta] = useState({
    username: '',
    sessionid: '',
    tipo: 'principal',
    score_min: 7,
    score_max: 10,
  })
  const [showSessionId, setShowSessionId] = useState<Record<number, boolean>>({})
  const [saving, setSaving] = useState(false)

  async function addCuenta() {
    if (!newCuenta.username.trim() || !newCuenta.sessionid.trim()) {
      alert('Username y sessionid son obligatorios')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/cliente/cuenta-ig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCuenta),
      })
      if (res.ok) {
        setShowAdd(false)
        setNewCuenta({ username: '', sessionid: '', tipo: 'principal', score_min: 7, score_max: 10 })
        window.location.reload()
      } else {
        const err = await res.json()
        alert(`Error: ${err.error || 'desconocido'}`)
      }
    } finally {
      setSaving(false)
    }
  }

  async function toggleEstado(id: number, estado: string) {
    const nuevoEstado = estado === 'activa' ? 'pausada' : 'activa'
    await fetch(`/api/cliente/cuenta-ig/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    })
    window.location.reload()
  }

  async function deleteCuenta(id: number) {
    if (!confirm('¿Eliminar esta cuenta? Esta acción no se puede deshacer.')) return
    await fetch(`/api/cliente/cuenta-ig/${id}`, { method: 'DELETE' })
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold flex items-center gap-3">
          <Instagram className="w-7 h-7 text-gold" />
          Cuenta Instagram
        </h1>
        <p className="text-fg-muted mt-1">Las cuentas IG que el motor usa para mandar DMs y/o scrapear leads.</p>
      </div>

      {/* Aviso sessionid */}
      <div className="surface p-4 border-warning/40 bg-warning/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-warning">Cómo conseguir tu sessionid</p>
            <ol className="list-decimal list-inside text-fg-muted mt-1 space-y-1">
              <li>Abrí Instagram en una pestaña incógnito</li>
              <li>Logueate normalmente</li>
              <li>Apretá F12 → pestaña "Application" → Cookies → instagram.com</li>
              <li>Copiá el valor de <code className="text-gold">sessionid</code></li>
              <li>Pegalo abajo</li>
            </ol>
            <p className="text-xs text-fg-muted mt-2">
              ⚠️ El sessionid es como tu contraseña. Lo guardamos cifrado y solo lo usa el motor.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de cuentas */}
      <div className="space-y-3">
        {cuentas.length === 0 && (
          <div className="surface p-8 text-center text-fg-muted">
            No tenés cuentas IG cargadas todavía.
          </div>
        )}
        {cuentas.map((c) => (
          <div key={c.id} className="surface p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold font-mono">@{c.username}</span>
                  <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${
                    c.tipo === 'principal' ? 'bg-gold/20 text-gold' : 'bg-info/10 text-info'
                  }`}>{c.tipo}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    c.estado === 'activa' ? 'bg-success/10 text-success' :
                    c.estado === 'cooldown' ? 'bg-warning/10 text-warning' :
                    'bg-fg-muted/20 text-fg-muted'
                  }`}>{c.estado}</span>
                </div>
                <p className="text-xs text-fg-muted mt-1">
                  DMs hoy: <span className="text-fg">{c.dms_hoy ?? 0}</span>
                  {c.ultimo_dm && (
                    <> · Último DM: <span className="text-fg">{new Date(c.ultimo_dm).toLocaleString()}</span></>
                  )}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-fg-muted">SessionID:</span>
                  <code className="text-xs text-gold bg-bg-overlay px-2 py-0.5 rounded font-mono">
                    {showSessionId[c.id] ? c.sessionid : '••••••••••••' + (c.sessionid?.slice(-4) ?? '')}
                  </code>
                  <button
                    onClick={() => setShowSessionId({ ...showSessionId, [c.id]: !showSessionId[c.id] })}
                    className="text-fg-muted hover:text-fg"
                  >
                    {showSessionId[c.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleEstado(c.id, c.estado)}
                  className="btn-ghost text-xs"
                >
                  {c.estado === 'activa' ? 'Pausar' : 'Activar'}
                </button>
                <button
                  onClick={() => deleteCuenta(c.id)}
                  className="p-1 text-fg-muted hover:text-danger"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botón agregar */}
      {!showAdd && (
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Agregar cuenta
        </button>
      )}

      {showAdd && (
        <div className="surface p-6 space-y-4 border-gold/30">
          <h3 className="font-serif text-lg font-bold">Nueva cuenta Instagram</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">Username (sin @)</label>
              <input
                value={newCuenta.username}
                onChange={(e) => setNewCuenta({ ...newCuenta, username: e.target.value.replace('@', '') })}
                placeholder="MiCuenta"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Tipo</label>
              <select value={newCuenta.tipo} onChange={(e) => setNewCuenta({ ...newCuenta, tipo: e.target.value })} className="input w-full">
                <option value="principal">Principal (envía DMs)</option>
                <option value="scraping">Scraping (busca leads)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Session ID</label>
            <input
              type="password"
              value={newCuenta.sessionid}
              onChange={(e) => setNewCuenta({ ...newCuenta, sessionid: e.target.value })}
              placeholder="Tu sessionid de Instagram"
              className="input w-full font-mono"
            />
            <p className="text-xs text-fg-muted mt-1">Ver instrucciones arriba para obtenerlo.</p>
          </div>

          {newCuenta.tipo === 'principal' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">Score mínimo</label>
                <input type="number" min={1} max={10} value={newCuenta.score_min} onChange={(e) => setNewCuenta({ ...newCuenta, score_min: parseInt(e.target.value) || 7 })} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Score máximo</label>
                <input type="number" min={1} max={10} value={newCuenta.score_max} onChange={(e) => setNewCuenta({ ...newCuenta, score_max: parseInt(e.target.value) || 10 })} className="input w-full" />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button onClick={addCuenta} disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : 'Agregar cuenta'}
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
