import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getClienteContext, clienteTieneDB, listarCuentasIG } from '@/lib/cliente-db'
import { ArrowLeft, Instagram } from 'lucide-react'
import { CuentasIGForm } from './form'

export const revalidate = 0
export const metadata = { title: 'Instagram · ACELERAME' }

export default async function InstagramPage() {
  const cliente = await getClienteContext()
  if (!cliente) redirect('/login')
  if (!clienteTieneDB(cliente)) redirect('/integraciones')

  const cuentas = await listarCuentasIG(cliente)

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/integraciones" className="text-fg-muted hover:text-gold inline-flex items-center gap-2 text-sm">
        <ArrowLeft className="w-4 h-4" /> Volver a Integraciones
      </Link>

      <div className="surface p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
            <Instagram className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold">Instagram — Cuentas para enviar DMs</h1>
            <p className="text-fg-muted text-sm">Las cuentas IG que el motor usará para mandar mensajes.</p>
          </div>
        </div>

        {/* Listado actual */}
        {cuentas.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm uppercase tracking-wider text-fg-muted font-medium mb-3">
              Cuentas conectadas ({cuentas.length})
            </h3>
            <div className="space-y-2">
              {cuentas.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between bg-bg-overlay/50 border border-border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold">
                      {c.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-mono font-medium">@{c.username}</p>
                      <p className="text-xs text-fg-subtle">
                        {c.mensajes_total ?? 0} mensajes enviados · estado {c.estado}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success border border-success/30">
                    {c.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form para agregar */}
        <h3 className="text-sm uppercase tracking-wider text-fg-muted font-medium mb-3">
          {cuentas.length > 0 ? 'Agregar otra cuenta' : 'Cargar tu primera cuenta'}
        </h3>

        <div className="bg-bg-overlay/30 border border-border rounded-lg p-4 mb-4 text-sm text-fg-muted">
          <p className="font-medium text-fg mb-2">📋 ¿Cómo conseguir el sessionid?</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Abrí Instagram en Chrome con la cuenta que querés usar</li>
            <li>Apretá <code className="text-gold">F12</code> → Application → Cookies → instagram.com</li>
            <li>Buscá la cookie llamada <code className="text-gold">sessionid</code></li>
            <li>Copiá su valor (un texto largo) y pegalo abajo</li>
          </ol>
          <p className="mt-2 text-xs text-warning">
            ⚠️ El sessionid es una credencial sensible. Lo guardamos cifrado en la DB.
          </p>
        </div>

        <CuentasIGForm />
      </div>
    </div>
  )
}
