-- ============================================================
-- Seed: clientes iniciales
-- Ejecutar DESPUÉS de 00_master_schema.sql y 01_crear_schema_cliente.sql
-- ============================================================

-- 1. Poncho (Sukhafé) - founder con BYODB
INSERT INTO master.clientes (
  id, slug, nombre_completo, email, empresa, estado, es_founder, motor_activo,
  db_modalidad, supabase_url, supabase_anon_key, schema_db, supabase_test_status,
  onboarding_completado, onboarding_paso, nicho, tono_mensajes
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'sukhafe',
  'Poncho (Sukhafé)',
  'poncho@sukhafe.com',
  'Sukhafé',
  'activo', true, false,
  'byodb',
  'https://ntmoehzdqvbvcgnoxxpp.supabase.co',
  'COMPLETAR_CON_ANON_KEY_SUKHAFE',
  'public',
  'ok',
  true, 8,
  'cafe',
  'mexicano'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email, nombre_completo = EXCLUDED.nombre_completo;

INSERT INTO master.creditos_saldo (cliente_id, creditos_actuales, creditos_comprados_total)
VALUES ('a0000000-0000-0000-0000-000000000001', 2666, 2666)
ON CONFLICT (cliente_id) DO NOTHING;

-- 2. Ariel (trial sin DB)
INSERT INTO master.clientes (
  id, slug, nombre_completo, email, empresa, estado, es_founder, motor_activo,
  onboarding_completado, onboarding_paso
) VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'ariel',
  'Ariel',
  'ariel@example.com',
  NULL,
  'trial', false, false,
  false, 1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO master.creditos_saldo (cliente_id, creditos_actuales)
VALUES ('a0000000-0000-0000-0000-000000000002', 0)
ON CONFLICT (cliente_id) DO NOTHING;

-- 3. Leo (admin/founder)
INSERT INTO master.clientes (
  id, slug, nombre_completo, email, empresa, estado, es_founder, motor_activo,
  db_modalidad, supabase_url, schema_db, supabase_test_status,
  onboarding_completado, onboarding_paso, nicho, tono_mensajes
) VALUES (
  'a0000000-0000-0000-0000-000000000099',
  'leo',
  'Leonel Delnevo',
  'leoneldelnevoo@gmail.com',
  'ACELERAME',
  'activo', true, false,
  'managed',
  'https://nulxpixgcdviuwfnxbqc.supabase.co',
  'public', -- usa el schema public por ser admin
  'ok',
  true, 8,
  'coaching',
  'argentino'
) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

INSERT INTO master.creditos_saldo (cliente_id, creditos_actuales, creditos_comprados_total)
VALUES ('a0000000-0000-0000-0000-000000000099', 10000, 10000)
ON CONFLICT (cliente_id) DO NOTHING;

-- Mensaje de éxito
DO $$ BEGIN
  RAISE NOTICE '✅ Seed completado. Recordá:';
  RAISE NOTICE '   1. Crear los usuarios en auth.users desde Supabase Auth UI:';
  RAISE NOTICE '      - poncho@sukhafe.com / Sukhafe2026!';
  RAISE NOTICE '      - leoneldelnevoo@gmail.com / Acelerame2026!';
  RAISE NOTICE '   2. Reemplazar COMPLETAR_CON_ANON_KEY_SUKHAFE con la anon key real de Sukhafé';
END $$;
