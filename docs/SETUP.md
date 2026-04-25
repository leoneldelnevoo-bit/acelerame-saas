# 🚀 ACELERAME SaaS — Setup Guide

## Prerrequisitos

- Node.js 20+
- Cuenta Supabase (proyecto master)
- Cuenta Apify (con actors `ig-scraper` y `my-actor` ya creados)
- Cuenta Anthropic (API Claude)
- Cuenta Resend (para emails)
- Wallet TRON para recibir USDT

## Pasos de instalación

### 1. Variables de entorno

Copiar `.env.example` a `.env.local` y completar todos los valores.

### 2. SQL — Configurar Supabase Master

En el SQL Editor del Supabase master ejecutar **en este orden**:

1. `sql/00_master_schema.sql` — crea schema master + 8 tablas + funciones
2. `sql/01_crear_schema_cliente.sql` — función para clientes Managed
3. `sql/02_seed_clientes.sql` — 3 clientes iniciales

### 3. Crear usuarios en Supabase Auth

En el panel de Authentication → Users → Add user:

- `poncho@sukhafe.com` / contraseña: `Sukhafe2026!`
- `leoneldelnevoo@gmail.com` / contraseña: `Acelerame2026!`

(Confirmar email automáticamente en Auth Settings)

### 4. Deploy

#### Opción A — Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
# Configurar variables de entorno en el dashboard
```

#### Opción B — Railway
```bash
npm install -g @railway/cli
railway login
railway init
railway up
# Configurar variables en Settings → Variables
```

#### Opción C — Cualquier hosting con Node.js
```bash
npm install
npm run build
npm start
```

### 5. Configurar dominio

Apuntar `app.acelerame.online` (o el subdominio que elijas) al deploy.

### 6. Cron job

Si usás Vercel: el cron de `/api/cron/verify-usdt` (cada 3 min) ya está en `vercel.json`.

Si usás otro hosting, configurar cron externo (ej: cron-job.org):
```
*/3 * * * * curl -H "Authorization: Bearer ${CRON_SECRET}" https://app.acelerame.online/api/cron/verify-usdt
```

### 7. n8n workflow

Importar `n8n/workflow_motor_v2.json` en tu instancia n8n.

Configurar variables de entorno de n8n (ver `n8n/README.md`).

## Test E2E

1. Ir a `https://app.acelerame.online`
2. Crear cuenta nueva
3. Completar wizard de onboarding (7 pasos)
4. Cargar créditos vía USDT
5. Verificar que el cron confirma el pago
6. Activar motor desde `/campanas`
7. Verificar que n8n procesa leads
