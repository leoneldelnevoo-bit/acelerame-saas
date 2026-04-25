# 🏗️ Arquitectura ACELERAME SaaS

## Visión general

ACELERAME es un motor de prospección B2B multi-tenant que combina:

- **Frontend**: Next.js 14 App Router (este repo)
- **Auth + Master DB**: Supabase (schema `master`)
- **Cliente DBs**: BYODB (Supabase del cliente) o Managed (schema dedicado en nuestro Supabase)
- **Scraping**: Apify (steady_sprinkles actors)
- **IA**: Claude API (scoring + generación mensajes)
- **Motor 24/7**: n8n workflow corriendo cada 10 min
- **DMs Instagram**: Apify DM actor
- **Pagos**: USDT/TRON con verificación blockchain
- **Emails**: Resend

## Modalidades de DB

### BYODB
Cliente trae su propio Supabase. Conecta URL + anon key.
- Datos viven con el cliente
- Sin lock-in
- Schema = `public`
- Usuario técnico

### Managed
Le creamos un schema dedicado en nuestro Supabase.
- Schema = `cliente_<slug>` (ej: `cliente_poncho`)
- 4 tablas: `prospeccion_leads`, `instagram_cuentas`, `scraping_config`, `mensajes_templates`
- Apify scraping cobrado como crédito (5 cr = 1 lead enriquecido)
- Usuario sin conocimientos técnicos

## Modelo de cobro

**Sin suscripciones.** 1 crédito = $0.10 USD.

| Acción | Costo |
|--------|-------|
| DM Instagram | 1 cr |
| Email cold | 0.3 cr |
| WhatsApp | 3 cr |
| Mensaje IA (Claude) | 2 cr |
| Lead enriquecido (Apify) | 5 cr |

Paquetes:
- Starter: $50 → 500 cr
- Growth: $150 → 2.000 cr ⭐
- Pro: $400 → 6.000 cr

## Flujo end-to-end

```
1. Cliente crea cuenta → /api/onboarding/setup-managed (POST)
2. Wizard 7 pasos → /api/onboarding/setup-managed (PUT) crea schema si Managed
3. Carga créditos → /recargar/{paquete} → orden USDT con monto único
4. Cron verifica blockchain cada 3 min → /api/cron/verify-usdt
5. Cliente activa motor → /api/campanas/motor
6. n8n cada 10 min:
   - Lee master.clientes WHERE motor_activo
   - Para cada cliente, conecta a su DB (BYODB o Managed)
   - Procesa leads pendientes
   - Descuenta créditos
7. Si saldo = 0: motor se pausa + email alerta
```

## Pipeline de etapas (motor)

| Etapa | Acción | Trigger |
|-------|--------|---------|
| 0 | Sin contactar | Lead creado por scraping |
| 1 | Apertura enviada | Motor envía DM inicial |
| 2 | Respondió | Webhook ManyChat |
| 3 | Calificando | Claude genera reply |
| 4 | Respondió 2 | Webhook |
| ... | ... | ... |
| 10 | Aceptó llamada | Claude detecta intención |
| 11 | Link agenda enviado | Motor manda link Cal.com |
| 12 | Agendado | Webhook Cal.com |
| 99 | Descartado | Score bajo o "no interesado" |

## Seguridad

- Auth: Supabase Auth con JWT
- RLS habilitado en todas las tablas master
- Service role key solo en backend (API routes)
- Sessionid IG encriptado en DB del cliente
- Cron protegido con `CRON_SECRET`
