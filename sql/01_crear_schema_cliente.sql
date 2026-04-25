-- ============================================================
-- Función master.crear_schema_cliente
-- Crea un schema dedicado para un cliente Managed con todas las tablas
-- necesarias para correr el motor de prospección.
-- ============================================================

CREATE OR REPLACE FUNCTION master.crear_schema_cliente(
  p_cliente_id uuid,
  p_schema_name text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sql text;
BEGIN
  -- 1. Crear schema
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_schema_name);

  -- 2. Crear tabla prospeccion_leads
  v_sql := format($f$
    CREATE TABLE IF NOT EXISTS %I.prospeccion_leads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      handle text UNIQUE NOT NULL,
      nombre text,
      bio text,
      seguidores int,
      siguiendo int,
      posts int,
      es_business boolean DEFAULT false,
      url_externa text,
      categoria text,
      etapa int DEFAULT 0,
      score numeric(3,1),
      respuesta_lead text,
      historial_conversacion text,
      fecha_ultima_respuesta timestamptz,
      ultimo_contacto timestamptz,
      proxima_accion_at timestamptz,
      source_type text,
      source_value text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    )
  $f$, p_schema_name);
  EXECUTE v_sql;

  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_leads_etapa_%I ON %I.prospeccion_leads(etapa)', p_schema_name, p_schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_leads_score_%I ON %I.prospeccion_leads(score DESC NULLS LAST)', p_schema_name, p_schema_name);

  -- 3. Crear tabla instagram_cuentas
  v_sql := format($f$
    CREATE TABLE IF NOT EXISTS %I.instagram_cuentas (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      cliente_id uuid,
      handle text UNIQUE NOT NULL,
      sessionid text NOT NULL,
      activo boolean DEFAULT true,
      ultima_validacion timestamptz,
      mensajes_hoy int DEFAULT 0,
      mensajes_total int DEFAULT 0,
      created_at timestamptz DEFAULT now()
    )
  $f$, p_schema_name);
  EXECUTE v_sql;

  -- 4. Crear tabla scraping_config
  v_sql := format($f$
    CREATE TABLE IF NOT EXISTS %I.scraping_config (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tipo text NOT NULL,
      valor text NOT NULL,
      limit_per_target int DEFAULT 20,
      activo boolean DEFAULT true,
      ultimo_scraping timestamptz,
      total_leads_obtenidos int DEFAULT 0,
      created_at timestamptz DEFAULT now()
    )
  $f$, p_schema_name);
  EXECUTE v_sql;

  -- 5. Crear tabla email_templates (para mensajes pre-cargados por nicho)
  v_sql := format($f$
    CREATE TABLE IF NOT EXISTS %I.mensajes_templates (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      etapa int NOT NULL,
      nombre text,
      contenido text NOT NULL,
      activo boolean DEFAULT true,
      created_at timestamptz DEFAULT now()
    )
  $f$, p_schema_name);
  EXECUTE v_sql;

  -- 6. Permitir acceso al service_role
  EXECUTE format('GRANT USAGE ON SCHEMA %I TO service_role', p_schema_name);
  EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA %I TO service_role', p_schema_name);
  EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON TABLES TO service_role', p_schema_name);

  -- 7. Actualizar master.clientes
  UPDATE master.clientes SET
    db_modalidad = 'managed',
    schema_db = p_schema_name,
    supabase_test_status = 'ok',
    supabase_test_at = now()
  WHERE id = p_cliente_id;

  RETURN jsonb_build_object('ok', true, 'schema', p_schema_name);
END;
$$;

GRANT EXECUTE ON FUNCTION master.crear_schema_cliente TO service_role;
