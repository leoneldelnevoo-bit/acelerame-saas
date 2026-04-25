/**
 * Cliente para verificar pagos USDT en blockchain TRON
 * Usa TronGrid API (gratuita)
 */

const WALLET = process.env.NEXT_PUBLIC_TRON_WALLET ?? 'TDzkBiQiMc8EnxWZ5f1wVBi4hSx5aRfHWy'
const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' // USDT TRC20

export type TronTransaction = {
  txid: string
  from_address: string
  to_address: string
  amount_usd: number
  timestamp: number
}

/**
 * Obtiene las últimas transacciones USDT recibidas en la wallet
 */
export async function obtenerTransaccionesUSDT(minutosAtras: number = 60): Promise<TronTransaction[]> {
  const ahora = Date.now()
  const desde = ahora - minutosAtras * 60 * 1000

  try {
    const url = `https://api.trongrid.io/v1/accounts/${WALLET}/transactions/trc20?contract_address=${USDT_CONTRACT}&min_timestamp=${desde}&only_to=true&limit=50`
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      console.error('TronGrid error:', res.status)
      return []
    }

    const data = await res.json()
    if (!Array.isArray(data?.data)) return []

    return data.data.map((tx: any) => ({
      txid: tx.transaction_id,
      from_address: tx.from,
      to_address: tx.to,
      amount_usd: parseFloat(tx.value) / 1e6, // USDT TRC20 has 6 decimals
      timestamp: tx.block_timestamp,
    }))
  } catch (e) {
    console.error('Error fetching TRON transactions:', e)
    return []
  }
}
