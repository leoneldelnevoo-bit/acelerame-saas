# 🚀 ACELERAME SaaS - Bundle v2 (Sesión 25/04 - parte 2)

Este bundle incluye **14 archivos** con:

## ✅ Lo nuevo en este bundle

### 1. UI de Integraciones completa
- `/integraciones` reescrita con **8 conectores agrupados** por sección:
  - 🗄️ Base de datos (BYODB / Managed)
  - 🔍 Apify Scraping (configurar targets)
  - 📸 Instagram (cuentas + sessionid)
  - 🤖 Claude IA (estado del API key)
  - ⚙️ n8n Motor (estado del workflow)
  - 📧 Email Resend (próximamente)
  - 💬 WhatsApp Business (próximamente)
  - 🤖 ManyChat (próximamente)
  - 📅 Calendly (próximamente)

### 2. Páginas funcionales nuevas
- `/integraciones/setup-managed` — flow para crear schema Managed (botón → 2 seg → listo)
- `/integraciones/conectar-supabase` — flow BYODB con form + test conexión
- `/integraciones/instagram` — gestión de cuentas IG con instrucciones para sessionid
- `/integraciones/apify` — configurar targets de scraping con costos estimados

### 3. APIs corregidas
- `/api/onboarding/setup-managed` — usa RPC `crear_schema_cliente`
- `/api/onboarding/instagram` — usa RPCs para Managed
- `/api/onboarding/scraping-config` — usa RPCs para Managed
- `/api/integraciones/apify-scraping` — registra eventos en master.eventos_clientes

### 4. Páginas dashboard actualizadas
- `/leads` — soporta BYODB y Managed (via `listarLeads`)
- `/bandeja` — soporta BYODB y Managed (via `listarConversaciones` + `listarAgendados`)

### 5. `cliente-db.ts` reescrito
Con funciones helper que usan RPCs en master.* para acceder a schemas dinámicos.

## 📋 Cómo aplicar (3 comandos)

```bash
cd ~/Downloads/acelerame-final
unzip -o ~/Downloads/acelerame-fix-bundle-v2.zip -d /tmp/fix
cp -r /tmp/fix/acelerame-fix-bundle/* .
git add -A
git commit -m "feat: integraciones UI completa + páginas instagram/apify"
git push
```

Vercel redeploya automáticamente en ~3 min.

## 🎯 Cómo testearlo después del deploy

1. Login con `leo@acelerame.com` / `teclado`
2. Ir a `/integraciones`
3. Vas a ver las 8 secciones de conectores
4. Click en "Cargar cuenta" en Instagram → carga form
5. Click en "Configurar targets" en Apify → carga form

## ✅ Backend (NO TOCAR — ya está aplicado)

- Función `master.crear_schema_cliente` 
- 8 funciones RPC helper en master
- PostgREST con `master` expuesto
- Schemas `cliente_leo` y `cliente_good` listos
- Tabla `master.eventos_clientes`

## 🛡️ acelerame.online — INTACTO

Verificado: solo se borraron proyectos huérfanos.
- ✅ `acelerame-app` (acelerame.online) — INTACTO
- ✅ `acelerame-sas` (el SaaS) — INTACTO

## 🚧 Pendientes

1. Cargar `ANTHROPIC_API_KEY` en Vercel
2. Cargar anon key Sukhafé para Poncho
3. Conectar motor n8n al multi-tenant
4. Domain custom (cuando quieras)
