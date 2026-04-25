# n8n Workflow Multi-Tenant — ACELERAME

Este workflow es el **motor** de ACELERAME. Corre cada 10 minutos y procesa todos los clientes con `motor_activo = true`.

## Arquitectura

```
Schedule Trigger (cada 10 min)
   │
   ├─→ HTTP Request: GET master.clientes WHERE motor_activo=true
   │
   ├─→ Loop sobre cada cliente:
   │     │
   │     ├─→ Obtener config (BYODB url+key | Managed schema_db)
   │     │
   │     ├─→ Construir cliente Supabase dinámico
   │     │
   │     ├─→ Para cada lead pendiente (etapa < 12):
   │     │     │
   │     │     ├─→ Si etapa=0: scrapear si Managed (Apify)
   │     │     ├─→ Si etapa=0: enviar apertura (Apify DM actor)
   │     │     ├─→ Si respuesta_lead != null: generar reply con Claude
   │     │     └─→ Avanzar etapa
   │     │
   │     └─→ Descontar créditos via master.descontar_creditos()
   │
   └─→ Si saldo=0: pausar motor + email alerta
```

## Variables de entorno necesarias en n8n

```
SUPABASE_MASTER_URL=https://nulxpixgcdviuwfnxbqc.supabase.co
SUPABASE_MASTER_SERVICE_KEY=<service role key>
APIFY_TOKEN=<token>
APIFY_SCRAPER_ACTOR=steady_sprinkles~ig-scraper
APIFY_DM_ACTOR=steady_sprinkles~my-actor
ANTHROPIC_API_KEY=<key>
RESEND_API_KEY=<key>
APP_BASE_URL=https://app.acelerame.online
```

## Workflow JSON

`workflow_motor_v2.json` — importarlo en tu instancia de n8n.

NOTA: el JSON del workflow se completa después del primer test E2E con un cliente real.
Por ahora el motor mono-tenant existente de Sukhafé sigue funcionando como referencia.
