'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Play, Pause, AlertCircle } from 'lucide-react'

export function MotorToggle({ initial }: { initial: boolean }) {
  const router = useRouter()
  const [activo, setActivo] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const toggle = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/campanas/motor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !activo }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Error')
      } else {
        setActivo(data.motor_activo)
        router.refresh()
      }
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={toggle}
        disabled={loading}
        className={activo ? 'btn-secondary w-full py-3' : 'btn-primary w-full py-3'}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : activo ? (
          <><Pause className="w-5 h-5" /> Pausar motor</>
        ) : (
          <><Play className="w-5 h-5" /> Iniciar motor</>
        )}
      </button>
      {errorMsg && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-danger">{errorMsg}</p>
        </div>
      )}
    </div>
  )
}
