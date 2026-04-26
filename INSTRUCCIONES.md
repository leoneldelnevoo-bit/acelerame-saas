# 🚀 ACELERAME SaaS - Fix Bundle (Sesión 25/04)

Este bundle contiene los **9 archivos** modificados/nuevos para arreglar:
- ✅ APIs de onboarding (Instagram, Scraping Config, Setup Managed)
- ✅ APIs de integraciones (Apify Scraping)
- ✅ Páginas de dashboard (Leads, Bandeja) con soporte BYODB + Managed
- ✅ Páginas nuevas: `/integraciones/setup-managed` y `/integraciones/conectar-supabase`
- ✅ `cliente-db.ts` reescrito con funciones helper que usan RPCs

## 📋 Cómo aplicar (3 pasos)

### Paso 1: Descomprimir sobre tu repo

```bash
cd ~/Downloads/acelerame-final
unzip -o ~/Downloads/acelerame-fix-bundle.zip
```

Esto sobrescribe los archivos viejos con los nuevos. **Importante**: usar `-o` para sobrescribir sin preguntar.

### Paso 2: Verificar TypeScript

```bash
npx tsc --noEmit
```

Debería pasar sin errores.

### Paso 3: Commit + push

```bash
git add -A
git commit -m "fix: APIs use master RPCs for Managed schemas + setup pages"
git push
```

Vercel va a redeployar automáticamente en ~3 minutos.

## ✅ Lo que ya está hecho en Supabase (NO TOCAR)

- Función `master.crear_schema_cliente` aplicada
- 8 funciones RPC helper en master (contar_leads, listar_leads, etc.)
- PostgREST configurado con `master` en `pgrst.db_schemas`
- Schemas `cliente_leo` y `cliente_good` ya creados con tablas
- Tabla `master.eventos_clientes` para tracking
- Vistas conflictivas en `public.*` borradas

## 🎯 Cómo testearlo después del deploy

1. Login con `leo@acelerame.com` / `teclado`
2. Ir a `/integraciones`
3. Como Leo ya tiene Managed creado, debería verse "Conectado"
4. Click en "Cargar cuenta IG" o lo que muestre — debería funcionar el insert via RPC

Para Poncho falta cargar el anon key de Sukhafé en `master.clientes`.
Para que la IA mande mensajes falta cargar `ANTHROPIC_API_KEY` en Vercel env vars.
