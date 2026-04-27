# 🚀 Bundle v3 — Personalización IA

## ✅ Lo nuevo

### Página /configuracion completamente reescrita
4 tabs:
- **Cuenta** — info read-only de la cuenta
- **Producto** — qué vendés, propuesta de valor, link de agenda
- **Buyer Persona** — nicho, dolor, objeciones, criterios calificación
- **Tu voz / Tono** — región (AR/MX/ES/etc), palabras prohibidas, ejemplos

### API /api/configuracion
- GET: trae config actual
- PUT: upsert con sanitización de campos

### /integraciones
Nueva card "Personalización IA" en la sección "IA y automatización" que:
- Muestra estado: Conectado (si completaste config) / Sin conectar
- Muestra producto + nicho cuando está completo
- Linkea a /configuracion

## 🗄️ Backend (ya aplicado en Supabase, no toques)

- Tabla `master.cliente_config` con 17 columnas (producto, buyer persona, voz, criterios)
- Función `master.get_cliente_config(p_cliente_id)` para que el motor n8n lea config rápido
- Trigger `updated_at` automático

## 📋 Cómo aplicar (3 comandos)

```bash
cd ~/Downloads/acelerame-final
unzip -o ~/Downloads/acelerame-fix-bundle-v3.zip -d /tmp/fix
cp -r /tmp/fix/acelerame-fix-bundle/* .
git add -A
git commit -m "feat: configuracion IA con tabs (producto/buyer/voz)"
git push
```

Vercel redeploya automáticamente en ~2 min.

## 🎯 Después del deploy

1. Login con `leo@acelerame.com`
2. Ir a `/configuracion`
3. Cargar info en las 3 tabs (Producto / Buyer / Voz)
4. Guardar
5. Volver a `/integraciones` → ver el card "Personalización IA" en verde "Conectado"

## 🔜 Próximos pasos (próxima sesión)

1. **Onboardear Poncho** con su Supabase BYODB (cuando me pases URL + anon_key)
2. **Acreditar 2,000 créditos** en su cuenta ($200 USD)
3. **Modificar motor n8n** para que lea `master.cliente_config` y personalice prompts
4. **Multi-tenant en n8n** con loop por clientes activos
5. **Sistema de descuento de créditos** por acción
