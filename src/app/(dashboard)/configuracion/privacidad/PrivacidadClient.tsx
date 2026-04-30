'use client'

import { useState } from 'react'
import { Shield, Download, Trash2, AlertTriangle, CheckCircle2, Lock, FileText, Loader2, Eye } from 'lucide-react'

export default function PrivacidadClient({ cliente, stats, auditPreview }: any) {
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  async function exportar() {
    setDownloading(true)
    try {
      const res = await fetch('/api/cliente/export')
      if (!res.ok) {
        alert('Error en el export. Probá de nuevo.')
        setDownloading(false)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `acelerame-export-${cliente.slug}-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  async function eliminarCuenta() {
    if (confirmText !== 'ELIMINAR') {
      alert('Tenés que escribir ELIMINAR exactamente para confirmar.')
      return
    }
    setDeleting(true)
    try {
      const res = await fetch('/api/cliente/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmacion: 'ELIMINAR' }),
      })
      const data = await res.json()
      if (res.ok) {
        alert(`✓ ${data.mensaje}\nFecha de purga definitiva: ${new Date(data.fecha_purga).toLocaleDateString()}`)
        window.location.href = '/login'
      } else {
        alert(`Error: ${data.error}`)
      }
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-serif text-3xl font-bold flex items-center gap-3">
          <Shield className="w-7 h-7 text-gold" />
          Privacidad y datos
        </h1>
        <p className="text-fg-muted mt-1">
          Tu data es tuya. Acá podés verla, exportarla o eliminarla cuando quieras.
        </p>
      </div>

      {/* === Resumen de tu data === */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="surface p-5">
          <p className="text-xs uppercase text-fg-muted mb-1">Leads</p>
          <p className="font-serif text-3xl font-bold">{stats.leads.toLocaleString()}</p>
        </div>
        <div className="surface p-5">
          <p className="text-xs uppercase text-fg-muted mb-1">Conversaciones</p>
          <p className="font-serif text-3xl font-bold">{stats.conversaciones.toLocaleString()}</p>
        </div>
        <div className="surface p-5">
          <p className="text-xs uppercase text-fg-muted mb-1">Modalidad de DB</p>
          <p className="font-serif text-3xl font-bold">{cliente.db_modalidad === 'managed' ? 'Managed' : 'BYODB'}</p>
        </div>
      </div>

      {/* === Cómo se protege tu data === */}
      <div className="surface p-6 space-y-4">
        <h2 className="font-serif text-xl font-bold flex items-center gap-2">
          <Lock className="w-5 h-5 text-success" />
          Cómo protegemos tu información
        </h2>

        <div className="space-y-3">
          <ItemSeguridad
            ok
            titulo="Cifrado AES de secretos"
            desc="Tu sessionid de Instagram y tus API keys (Claude, Resend) están cifrados con AES-128. Ni siquiera el equipo de ACELERAME puede leerlos directamente."
          />
          <ItemSeguridad
            ok
            titulo="Aislamiento por cliente"
            desc="Cada cliente tiene su cliente_id único. Las queries del sistema filtran automáticamente por ese ID. Tu data nunca se mezcla con la de otros."
          />
          <ItemSeguridad
            ok
            titulo="Row Level Security (RLS)"
            desc="A nivel de base de datos, tenés políticas que solo permiten leer/escribir filas que te pertenecen."
          />
          <ItemSeguridad
            ok
            titulo="Headers de seguridad HTTP"
            desc="Toda comunicación con el sistema usa HTTPS forzado, CSP, X-Frame-Options y HSTS."
          />
          <ItemSeguridad
            ok
            titulo="Audit log de accesos"
            desc="Cada acción importante en tu cuenta queda registrada. Podés consultar el log abajo."
          />
          <ItemSeguridad
            warn
            titulo="Tu data vive en infraestructura ACELERAME"
            desc={`Modalidad actual: ${cliente.db_modalidad === 'byodb' ? 'BYODB - tu data está en TU Supabase' : 'Managed - tu data está en infraestructura compartida de ACELERAME, separada por cliente_id'}. Si querés control físico total, escribinos para migrar a BYODB.`}
          />
        </div>
      </div>

      {/* === Acciones del cliente === */}
      <div className="surface p-6 space-y-4">
        <h2 className="font-serif text-xl font-bold">Tus derechos sobre tu data</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Exportar */}
          <div className="bg-bg-overlay/30 rounded-lg p-5 border border-border">
            <div className="flex items-start gap-3 mb-3">
              <Download className="w-6 h-6 text-info shrink-0" />
              <div>
                <h3 className="font-bold">Exportar todo</h3>
                <p className="text-sm text-fg-muted">
                  Descargá un JSON con TODOS tus datos: leads, conversaciones, configuración, créditos.
                </p>
              </div>
            </div>
            <button onClick={exportar} disabled={downloading} className="btn-primary w-full">
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading ? 'Generando...' : 'Descargar mi data'}
            </button>
            <p className="text-xs text-fg-muted mt-2">
              📌 Las API keys y sessionids no se incluyen por seguridad (son tuyos, no se exportan).
            </p>
          </div>

          {/* Eliminar */}
          <div className="bg-danger/5 rounded-lg p-5 border border-danger/30">
            <div className="flex items-start gap-3 mb-3">
              <Trash2 className="w-6 h-6 text-danger shrink-0" />
              <div>
                <h3 className="font-bold text-danger">Eliminar cuenta</h3>
                <p className="text-sm text-fg-muted">
                  Detención inmediata del motor + purga total en 30 días. Reversible escribiendo a soporte.
                </p>
              </div>
            </div>
            {!showDeleteModal ? (
              <button onClick={() => setShowDeleteModal(true)} className="btn-ghost w-full text-danger border-danger/30">
                Solicitar eliminación
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-danger font-bold">
                  Escribí ELIMINAR para confirmar:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="input w-full"
                  placeholder="ELIMINAR"
                />
                <div className="flex gap-2">
                  <button onClick={() => { setShowDeleteModal(false); setConfirmText('') }} className="btn-ghost text-xs flex-1">
                    Cancelar
                  </button>
                  <button
                    onClick={eliminarCuenta}
                    disabled={confirmText !== 'ELIMINAR' || deleting}
                    className="btn-primary bg-danger hover:bg-danger/90 text-xs flex-1"
                  >
                    {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === Audit log === */}
      <div className="surface overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Eye className="w-5 h-5 text-gold" />
          <h2 className="font-serif text-xl font-bold">Auditoría de tu cuenta</h2>
        </div>
        <p className="text-sm text-fg-muted px-4 pt-3">
          Cada cambio importante queda registrado acá. Si alguna vez sospechás de un acceso no autorizado, este log te lo muestra.
        </p>
        {auditPreview.length === 0 ? (
          <div className="p-8 text-center text-fg-muted">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
            Sin actividad registrada todavía.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-overlay">
              <tr className="text-left">
                <th className="px-4 py-2 font-medium text-fg-muted">Fecha</th>
                <th className="px-4 py-2 font-medium text-fg-muted">Acción</th>
                <th className="px-4 py-2 font-medium text-fg-muted">IP</th>
              </tr>
            </thead>
            <tbody>
              {auditPreview.map((entry: any) => (
                <tr key={entry.id} className="border-b border-border/50">
                  <td className="px-4 py-2 text-xs text-fg-muted">{new Date(entry.fecha).toLocaleString()}</td>
                  <td className="px-4 py-2 font-mono text-xs">{entry.accion}</td>
                  <td className="px-4 py-2 font-mono text-xs text-fg-subtle">{entry.ip_address ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* === Te interesa BYODB? === */}
      <div className="surface p-6 border-info/30 bg-info/5">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5 text-info" />
          ¿Querés control 100% de tu infraestructura?
        </h3>
        <p className="text-sm text-fg-muted mb-3">
          Con la modalidad <strong>BYODB</strong> traés tu propio Supabase. Tu data nunca toca infraestructura ACELERAME.
          Si nos dejás de usar, te quedás con todo.
        </p>
        <a href="mailto:hola@acelerame.online?subject=Migrar a BYODB" className="btn-ghost text-xs inline-flex items-center gap-2">
          Hablar con soporte sobre BYODB →
        </a>
      </div>
    </div>
  )
}

function ItemSeguridad({ ok, warn, titulo, desc }: { ok?: boolean; warn?: boolean; titulo: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded bg-bg-overlay/30">
      {ok && <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />}
      {warn && <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />}
      <div>
        <p className="font-bold text-sm">{titulo}</p>
        <p className="text-sm text-fg-muted">{desc}</p>
      </div>
    </div>
  )
}
