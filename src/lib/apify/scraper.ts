/**
 * Integración con Apify para scraping de leads.
 * Usado por clientes Managed que NO traen su propia base.
 */

const APIFY_TOKEN = process.env.APIFY_TOKEN!
const SCRAPER_ACTOR = process.env.APIFY_SCRAPER_ACTOR ?? 'steady_sprinkles~ig-scraper'
const DM_ACTOR = process.env.APIFY_DM_ACTOR ?? 'steady_sprinkles~my-actor'

export type ScrapingTarget = {
  tipo: 'hashtag' | 'cuenta_seguidores' | 'cuenta_comentarios' | 'keyword'
  valor: string
}

export type ScrapedProfile = {
  username: string
  full_name: string
  biography: string
  follower_count: number
  following_count: number
  media_count: number
  is_business: boolean
  external_url: string | null
  category: string | null
  source_type: string
  source_value: string
}

/**
 * Dispara un run de scraping en Apify.
 * Returns el datasetId para luego leer los resultados.
 */
export async function dispararScraping(params: {
  sessionid: string
  targets: ScrapingTarget[]
  limitPerTarget?: number
}): Promise<{ runId: string; datasetId: string } | { error: string }> {
  const { sessionid, targets, limitPerTarget = 20 } = params

  // Agrupar por tipo
  const hashtags: string[] = []
  const accounts: string[] = []
  const keywords: string[] = []
  for (const t of targets) {
    if (t.tipo === 'hashtag') hashtags.push(t.valor)
    else if (t.tipo === 'cuenta_seguidores' || t.tipo === 'cuenta_comentarios') accounts.push(t.valor)
    else if (t.tipo === 'keyword') keywords.push(t.valor)
  }

  // Determinar action según los targets
  let action = 'hashtags'
  let payload: any = { sessionid, limitPerTag: limitPerTarget }
  if (hashtags.length > 0) {
    action = 'hashtags'
    payload.hashtags = hashtags
    payload.limitPerTag = limitPerTarget
  } else if (accounts.length > 0) {
    action = 'followers'
    payload.accounts = accounts
    payload.limitPerAccount = limitPerTarget
  } else if (keywords.length > 0) {
    action = 'search'
    payload.keywords = keywords
    payload.limitPerKeyword = limitPerTarget
  }
  payload.action = action

  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${SCRAPER_ACTOR}/runs?token=${APIFY_TOKEN}&waitForFinish=300`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    if (!res.ok) {
      const text = await res.text()
      return { error: `Apify error ${res.status}: ${text.substring(0, 200)}` }
    }

    const data = await res.json()
    const runId = data?.data?.id ?? ''
    const datasetId = data?.data?.defaultDatasetId ?? ''

    if (!datasetId) return { error: 'No datasetId in response' }

    return { runId, datasetId }
  } catch (e: any) {
    return { error: e?.message ?? 'Unknown error' }
  }
}

/**
 * Lee los resultados de un dataset de Apify
 */
export async function leerResultadosScraping(datasetId: string): Promise<ScrapedProfile[]> {
  try {
    const res = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`
    )
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Error leyendo dataset:', e)
    return []
  }
}

/**
 * Costo en créditos del scraping
 * Cada lead enriquecido cuesta 5 créditos (ver master.precios_acciones)
 */
export const COSTO_LEAD_ENRIQUECIDO = 5
