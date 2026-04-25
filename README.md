# 🚀 ACELERAME SaaS

> Motor de prospección B2B multi-tenant con IA. Instagram, Email y WhatsApp corriendo 24/7.

## Quick start

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# 3. Configurar Supabase
# Ejecutar sql/00_master_schema.sql, 01_crear_schema_cliente.sql, 02_seed_clientes.sql

# 4. Dev server
npm run dev
# → http://localhost:3000

# 5. Build & deploy
npm run build
npm start
```

## Estructura

```
acelerame-saas/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # /login, /registro
│   │   ├── (dashboard)/        # /dashboard, /leads, /bandeja, /campanas, ...
│   │   ├── (onboarding)/       # /bienvenida (wizard 7 pasos)
│   │   └── api/                # API routes
│   ├── components/             # React components
│   ├── lib/                    # Lógica de negocio
│   │   ├── supabase/           # Clientes Supabase (server + browser)
│   │   ├── cliente-db.ts       # BYODB + Managed dual
│   │   ├── apify/              # Scraping
│   │   ├── tron/               # Pagos USDT
│   │   └── onboarding/         # Setup Managed
│   └── middleware.ts           # Auth gate
├── sql/                        # Schemas Supabase
├── n8n/                        # Workflow del motor
├── docs/                       # SETUP.md, ARCHITECTURE.md
├── package.json
├── tailwind.config.ts
└── vercel.json
```

## Decisiones arquitectónicas

- **BYODB + Managed**: cliente puede traer su propia DB o usar la nuestra
- **Schema separado por cliente Managed**: aislamiento sin costo extra de proyectos
- **Apify cobrado como crédito**: 5 cr = 1 lead enriquecido
- **Wizard de 7 pasos**: onboarding completo en 15 min
- **Sin suscripciones**: solo créditos consumidos

Ver `docs/ARCHITECTURE.md` para detalles completos.

## Stack

- Next.js 14 + TypeScript + Tailwind
- Supabase (Auth + Postgres + RLS)
- Apify (scraping IG)
- Claude API (Anthropic)
- n8n (motor 24/7)
- USDT TRON (pagos)
- Resend (emails)

## Licencia

Propietario — © 2026 Leonel Delnevo
