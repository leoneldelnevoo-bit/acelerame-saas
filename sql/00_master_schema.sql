-- ============================================================
-- ACELERAME SaaS - Master Schema
-- Ejecutar en Supabase SQL Editor del proyecto master
-- (nulxpixgcdviuwfnxbqc)
-- ============================================================

-- 1. Crear schema master si no existe
CREATE SCHEMA IF NOT EXISTS master;

-- 2. TABLAS

-- master.clientes
CREATE TABLE IF NOT EXISTS master.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  nombre_completo text NOT NULL,
  email text UNIQUE NOT NULL,
  empresa text,
  estado text DEFAULT 'trial' CHECK (estado IN ('trial', 'activo', 'pausado', 'cancelado')),
  es_founder boolean DEFAULT false,
  motor_activo boolean DEFAULT false,
  -- Modalidad de DB
  db_modalidad text CHECK (db_modalidad IN ('byodb', 'managed') OR db_modalidad IS NULL),
  -- BYODB
  supabase_url text,
  supabase_anon_key text,
  supabase_project_id text,
  schema_db text DEFAULT 'public',
  supabase_test_status text,
  supabase_test_at timestamptz,
  -- Onboarding
  onboarding_completado boolean DEFAULT false,
  onboarding_paso int DEFAULT 1,
  -- Configuración del nicho
  nicho text,
  tono_mensajes text DEFAULT 'profesional',
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clientes_email ON master.clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_motor_activo ON master.clientes(motor_activo) WHERE motor_activo = true;

-- master.creditos_saldo
CREATE TABLE IF NOT EXISTS master.creditos_saldo (
  cliente_id uuid PRIMARY KEY REFERENCES master.clientes(id) ON DELETE CASCADE,
  creditos_actuales numeric(12,2) DEFAULT 0,
  creditos_comprados_total numeric(12,2) DEFAULT 0,
  creditos_gastados_total numeric(12,2) DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- master.creditos_consumo (log de cada gasto)
CREATE TABLE IF NOT EXISTS master.creditos_consumo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES master.clientes(id) ON DELETE CASCADE,
  accion text NOT NULL,
  cantidad int DEFAULT 1,
  creditos_consumidos numeric(8,3) NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creditos_consumo_cliente ON master.creditos_consumo(cliente_id, created_at DESC);

-- master.creditos_compras (log de cada recarga)
CREATE TABLE IF NOT EXISTS master.creditos_compras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES master.clientes(id) ON DELETE CASCADE,
  paquete_codigo text,
  paquete_nombre text,
  creditos numeric(12,2) NOT NULL,
  precio_usd numeric(8,2) NOT NULL,
  metodo_pago text DEFAULT 'usdt_tron',
  txid text,
  estado text DEFAULT 'pendiente',
  created_at timestamptz DEFAULT now(),
  confirmed_at timestamptz
);

-- master.pagos_usdt_pendientes
CREATE TABLE IF NOT EXISTS master.pagos_usdt_pendientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES master.clientes(id) ON DELETE CASCADE,
  paquete_codigo text NOT NULL,
  monto_usd_unico numeric(8,3) NOT NULL,
  estado text DEFAULT 'pendiente',
  txid text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pagos_usdt_estado ON master.pagos_usdt_pendientes(estado);

-- master.precios_acciones
CREATE TABLE IF NOT EXISTS master.precios_acciones (
  accion text PRIMARY KEY,
  creditos_costo numeric(8,3) NOT NULL,
  descripcion text
);

-- master.paquetes_credito
CREATE TABLE IF NOT EXISTS master.paquetes_credito (
  codigo text PRIMARY KEY,
  nombre text NOT NULL,
  creditos numeric(12,2) NOT NULL,
  precio_usd numeric(8,2) NOT NULL,
  destacado boolean DEFAULT false,
  activo boolean DEFAULT true,
  orden int DEFAULT 0
);

-- master.configuracion (key-value store)
CREATE TABLE IF NOT EXISTS master.configuracion (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. FUNCIONES
-- ============================================================

-- Descontar créditos atómicamente
CREATE OR REPLACE FUNCTION master.descontar_creditos(
  p_cliente_id uuid,
  p_accion text,
  p_cantidad int DEFAULT 1,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_costo_unitario numeric;
  v_costo_total numeric;
  v_saldo_actual numeric;
BEGIN
  SELECT creditos_costo INTO v_costo_unitario
  FROM master.precios_acciones WHERE accion = p_accion;

  IF v_costo_unitario IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'accion_desconocida');
  END IF;

  v_costo_total := v_costo_unitario * p_cantidad;

  SELECT creditos_actuales INTO v_saldo_actual
  FROM master.creditos_saldo WHERE cliente_id = p_cliente_id FOR UPDATE;

  IF v_saldo_actual IS NULL OR v_saldo_actual < v_costo_total THEN
    RETURN jsonb_build_object('ok', false, 'error', 'saldo_insuficiente', 'requerido', v_costo_total, 'disponible', COALESCE(v_saldo_actual, 0));
  END IF;

  UPDATE master.creditos_saldo
  SET creditos_actuales = creditos_actuales - v_costo_total,
      creditos_gastados_total = creditos_gastados_total + v_costo_total,
      updated_at = now()
  WHERE cliente_id = p_cliente_id;

  INSERT INTO master.creditos_consumo (cliente_id, accion, cantidad, creditos_consumidos, metadata)
  VALUES (p_cliente_id, p_accion, p_cantidad, v_costo_total, p_metadata);

  RETURN jsonb_build_object('ok', true, 'consumido', v_costo_total, 'saldo_nuevo', v_saldo_actual - v_costo_total);
END;
$$;

-- Agregar créditos
CREATE OR REPLACE FUNCTION master.agregar_creditos(
  p_cliente_id uuid,
  p_creditos numeric,
  p_paquete_codigo text DEFAULT NULL,
  p_precio_usd numeric DEFAULT NULL,
  p_txid text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_paquete master.paquetes_credito;
BEGIN
  IF p_paquete_codigo IS NOT NULL THEN
    SELECT * INTO v_paquete FROM master.paquetes_credito WHERE codigo = p_paquete_codigo;
  END IF;

  INSERT INTO master.creditos_saldo (cliente_id, creditos_actuales, creditos_comprados_total)
  VALUES (p_cliente_id, p_creditos, p_creditos)
  ON CONFLICT (cliente_id) DO UPDATE SET
    creditos_actuales = master.creditos_saldo.creditos_actuales + p_creditos,
    creditos_comprados_total = master.creditos_saldo.creditos_comprados_total + p_creditos,
    updated_at = now();

  INSERT INTO master.creditos_compras (
    cliente_id, paquete_codigo, paquete_nombre, creditos, precio_usd, metodo_pago, txid, estado, confirmed_at
  ) VALUES (
    p_cliente_id, p_paquete_codigo, COALESCE(v_paquete.nombre, 'manual'), p_creditos,
    COALESCE(p_precio_usd, v_paquete.precio_usd, 0), 'usdt_tron', p_txid, 'confirmado', now()
  );

  RETURN jsonb_build_object('ok', true, 'creditos_agregados', p_creditos);
END;
$$;

-- Crear orden de pago USDT con monto único
CREATE OR REPLACE FUNCTION master.crear_orden_pago_usdt(
  p_cliente_id uuid,
  p_paquete_codigo text
) RETURNS SETOF master.pagos_usdt_pendientes
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_paquete master.paquetes_credito;
  v_centavos_extra numeric;
  v_monto_unico numeric;
  v_orden master.pagos_usdt_pendientes;
BEGIN
  SELECT * INTO v_paquete FROM master.paquetes_credito WHERE codigo = p_paquete_codigo;
  IF v_paquete IS NULL THEN RAISE EXCEPTION 'paquete_no_encontrado'; END IF;

  -- Generar centavos únicos (last 3 digits del UUID hash)
  v_centavos_extra := (abs(hashtext(p_cliente_id::text || now()::text)) % 999) / 1000.0;
  v_monto_unico := v_paquete.precio_usd + v_centavos_extra;

  INSERT INTO master.pagos_usdt_pendientes (
    cliente_id, paquete_codigo, monto_usd_unico, expires_at
  ) VALUES (
    p_cliente_id, p_paquete_codigo, v_monto_unico, now() + interval '24 hours'
  ) RETURNING * INTO v_orden;

  RETURN NEXT v_orden;
END;
$$;

-- Confirmar pago USDT (llamado por cron)
CREATE OR REPLACE FUNCTION master.confirmar_pago_usdt(
  p_orden_id uuid,
  p_txid text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_orden master.pagos_usdt_pendientes;
  v_paquete master.paquetes_credito;
BEGIN
  SELECT * INTO v_orden FROM master.pagos_usdt_pendientes WHERE id = p_orden_id AND estado = 'pendiente';
  IF v_orden IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'orden_no_encontrada'); END IF;

  SELECT * INTO v_paquete FROM master.paquetes_credito WHERE codigo = v_orden.paquete_codigo;

  UPDATE master.pagos_usdt_pendientes SET estado = 'confirmado', txid = p_txid WHERE id = p_orden_id;

  PERFORM master.agregar_creditos(v_orden.cliente_id, v_paquete.creditos, v_paquete.codigo, v_paquete.precio_usd, p_txid);

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Expirar órdenes viejas
CREATE OR REPLACE FUNCTION master.expirar_ordenes_viejas() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE master.pagos_usdt_pendientes
  SET estado = 'expirado'
  WHERE estado = 'pendiente' AND expires_at < now();
END;
$$;

-- ============================================================
-- 4. SEED DE DATOS
-- ============================================================

INSERT INTO master.precios_acciones (accion, creditos_costo, descripcion) VALUES
  ('dm_ig', 1.0, 'Enviar DM Instagram'),
  ('email', 0.3, 'Enviar email'),
  ('wa', 3.0, 'Mensaje WhatsApp'),
  ('ia_mensaje', 2.0, 'Generar mensaje con Claude'),
  ('enriquecimiento', 5.0, 'Lead enriquecido con Apify')
ON CONFLICT (accion) DO UPDATE SET creditos_costo = EXCLUDED.creditos_costo;

INSERT INTO master.paquetes_credito (codigo, nombre, creditos, precio_usd, destacado, orden) VALUES
  ('starter', 'Starter', 500, 50.00, false, 1),
  ('growth', 'Growth', 2000, 150.00, true, 2),
  ('pro', 'Pro', 6000, 400.00, false, 3)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, creditos = EXCLUDED.creditos, precio_usd = EXCLUDED.precio_usd;

GRANT USAGE ON SCHEMA master TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA master TO service_role;
GRANT SELECT ON master.paquetes_credito, master.precios_acciones TO authenticated;
