-- ==============================================================================
-- ESQUEMA MAESTRO DE SUPABASE (POSTGRESQL) — GESTIÓN DE COBROS & ARRENDAMIENTOS
-- ==============================================================================

-- 1. TABLA DE CONTRATOS E INQUILINOS
CREATE TABLE IF NOT EXISTS public.contratos (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    cedula TEXT,
    rif TEXT,
    telefono TEXT,
    correo TEXT,
    inmueble TEXT NOT NULL,
    ubicacion TEXT,
    unidad TEXT NOT NULL,
    canon_base_usd NUMERIC(12, 2) NOT NULL DEFAULT 0,
    canon_base_eur NUMERIC(12, 2) NOT NULL DEFAULT 0,
    moneda_principal TEXT DEFAULT 'USD',
    dia_pago TEXT DEFAULT 'Del 1 al 5 de cada mes',
    frecuencia_pago TEXT DEFAULT 'Mensual',
    metodo_pago TEXT DEFAULT 'Zelle',
    plan_contingencia_usd NUMERIC(12, 2) DEFAULT 0,
    plan_contingencia_eur NUMERIC(12, 2) DEFAULT 0,
    deposito_total_usd NUMERIC(12, 2) DEFAULT 0,
    deposito_total_eur NUMERIC(12, 2) DEFAULT 0,
    deposito_meses INT DEFAULT 2,
    canon_total_usd NUMERIC(12, 2) DEFAULT 0,
    cargo_mora_usd NUMERIC(12, 2) DEFAULT 3,
    dias_gracia_mora INT DEFAULT 5,
    fecha_inicio_contrato TEXT,
    fecha_vencimiento TEXT,
    status_contrato TEXT DEFAULT 'Vigente', -- 'Vigente', 'Moroso', 'Por Renovar', 'Vencido', 'Inactivo', 'Para Dar de Baja'
    estacionamiento TEXT DEFAULT 'No',
    observaciones TEXT,
    fecha_inicio_relacion TEXT,
    duracion_relacion TEXT DEFAULT '12',
    tipo_relacion TEXT DEFAULT 'Arrendatario Directo',
    tipo_contingencia TEXT DEFAULT 'Mensual',
    canon_vef NUMERIC(14, 2) DEFAULT 0,
    canon_eur_redondeado NUMERIC(12, 2) DEFAULT 0,
    metodo_preferido TEXT DEFAULT 'Zelle',
    es_renovacion_de TEXT,
    credito_disponible NUMERIC(12, 2) DEFAULT 0,
    creado_el TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE PAGOS Y CONTROL DE COBROS
CREATE TABLE IF NOT EXISTS public.pagos (
    id SERIAL PRIMARY KEY,
    inmueble TEXT NOT NULL,
    unidad TEXT,
    arrendatario TEXT NOT NULL,
    canon_base_usd NUMERIC(12, 2) DEFAULT 0,
    plan_contingencia NUMERIC(12, 2) DEFAULT 0,
    deposito_cuota NUMERIC(12, 2) DEFAULT 0,
    canon_total_esperado NUMERIC(12, 2) DEFAULT 0,
    dia_pago TEXT,
    status_cobro TEXT DEFAULT 'Al Día',
    pago_recibido NUMERIC(12, 2) DEFAULT 0,
    fecha_pago TEXT NOT NULL,
    cargo_mora_usd NUMERIC(12, 2) DEFAULT 0,
    total_a_cobrar NUMERIC(12, 2) DEFAULT 0,
    diferencia NUMERIC(12, 2) DEFAULT 0,
    metodo_pago TEXT,
    referencia TEXT,
    gestor TEXT,
    mes_cobro TEXT NOT NULL,
    observaciones TEXT,
    estacionamiento_cobrado NUMERIC(12, 2) DEFAULT 0,
    monto_usd NUMERIC(12, 2) DEFAULT 0,
    monto_eur NUMERIC(12, 2) DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    creado_el TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE AUDITORÍA Y CAMBIOS
CREATE TABLE IF NOT EXISTS public.auditoria (
    id SERIAL PRIMARY KEY,
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL,
    usuario TEXT NOT NULL,
    accion TEXT NOT NULL,
    tabla TEXT NOT NULL,
    id_registro TEXT,
    campo TEXT,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    detalles TEXT,
    creado_el TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE TASAS DE CAMBIO
CREATE TABLE IF NOT EXISTS public.tasas (
    id SERIAL PRIMARY KEY,
    usd NUMERIC(12, 4) NOT NULL,
    eur NUMERIC(12, 4) NOT NULL,
    bcv NUMERIC(12, 4) NOT NULL,
    promedio NUMERIC(12, 4) NOT NULL,
    fuente TEXT DEFAULT 'Binance + BCV',
    fecha TEXT NOT NULL,
    creado_el TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA DE CASOS LEGALES
CREATE TABLE IF NOT EXISTS public.casos_legales (
    id SERIAL PRIMARY KEY,
    n_caso INT NOT NULL,
    cliente TEXT NOT NULL,
    inmueble TEXT NOT NULL,
    unidad TEXT,
    estado TEXT DEFAULT 'Nuevo', -- 'Nuevo', 'En revisión', 'En juzgado', 'Resuelto', 'Descartado'
    severidad TEXT DEFAULT 'Medio', -- 'Bajo', 'Medio', 'Alto', 'Crítico'
    deuda_total NUMERIC(12, 2) DEFAULT 0,
    meses_deuda INT DEFAULT 0,
    fecha_apertura TEXT NOT NULL,
    fecha_cierre TEXT,
    abogado_asignado TEXT,
    notas TEXT,
    creado_el TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA DE COMUNICACIONES LEGALES
CREATE TABLE IF NOT EXISTS public.comunicaciones_legales (
    id SERIAL PRIMARY KEY,
    caso_id INT REFERENCES public.casos_legales(id) ON DELETE CASCADE,
    inquilino TEXT NOT NULL,
    tipo TEXT NOT NULL,
    fecha TEXT NOT NULL,
    contenido TEXT NOT NULL,
    gestor TEXT,
    creado_el TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA DE REPORTES DE BUGS
CREATE TABLE IF NOT EXISTS public.reportes_bugs (
    id SERIAL PRIMARY KEY,
    numero INT NOT NULL,
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL,
    usuario TEXT NOT NULL,
    email TEXT,
    rol TEXT DEFAULT 'operador',
    seccion TEXT NOT NULL,
    tipo_elemento TEXT,
    elemento TEXT,
    severidad TEXT DEFAULT 'Medio',
    esperado TEXT,
    real TEXT NOT NULL,
    pasos TEXT,
    estado TEXT DEFAULT 'Nuevo', -- 'Nuevo', 'En revisión', 'Resuelto', 'Descartado'
    dispositivo TEXT,
    notas_resolucion TEXT,
    creado_el TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA DE USUARIOS DEL SISTEMA
CREATE TABLE IF NOT EXISTS public.usuarios (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    rol TEXT DEFAULT 'gestor', -- 'admin', 'gestor', 'cobranzas', 'observador'
    activo BOOLEAN DEFAULT TRUE,
    creado_el TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLA DE CONFIGURACIÓN
CREATE TABLE IF NOT EXISTS public.configuracion (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
);

-- 10. TABLA DE RATE LIMITING ANTI-FUERZA BRUTA
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    intentos INT NOT NULL DEFAULT 1,
    primer_intento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ultimo_intento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    bloqueado_hasta TIMESTAMPTZ,
    creado_el TIMESTAMPTZ DEFAULT NOW()
);

-- RPC Rate Limiting
CREATE OR REPLACE FUNCTION public.fn_check_login_rate_limit(
    p_identifier TEXT,
    p_max_intentos INT DEFAULT 5,
    p_ventana_minutos INT DEFAULT 15,
    p_bloqueo_minutos INT DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ahora TIMESTAMPTZ := NOW();
    v_registro RECORD;
    v_ventana INTERVAL := (p_ventana_minutos || ' minutes')::INTERVAL;
    v_bloqueo INTERVAL := (p_bloqueo_minutos || ' minutes')::INTERVAL;
    v_resultado JSONB;
BEGIN
    SELECT * INTO v_registro
    FROM public.login_attempts
    WHERE identifier = p_identifier
    ORDER BY ultimo_intento DESC
    LIMIT 1;

    IF NOT FOUND THEN
        INSERT INTO public.login_attempts (identifier, intentos, primer_intento, ultimo_intento)
        VALUES (p_identifier, 1, v_ahora, v_ahora);

        RETURN jsonb_build_object(
            'permitido', true,
            'intentos_restantes', p_max_intentos - 1,
            'minutos_bloqueo', 0
        );
    END IF;

    IF v_registro.bloqueado_hasta IS NOT NULL AND v_ahora < v_registro.bloqueado_hasta THEN
        v_resultado := jsonb_build_object(
            'permitido', false,
            'intentos_restantes', 0,
            'minutos_bloqueo', EXTRACT(EPOCH FROM (v_registro.bloqueado_hasta - v_ahora)) / 60
        );
        RETURN v_resultado;
    END IF;

    IF (v_ahora - v_registro.primer_intento) > v_ventana THEN
        UPDATE public.login_attempts
        SET intentos = 1,
            primer_intento = v_ahora,
            ultimo_intento = v_ahora,
            bloqueado_hasta = NULL
        WHERE id = v_registro.id;

        RETURN jsonb_build_object(
            'permitido', true,
            'intentos_restantes', p_max_intentos - 1,
            'minutos_bloqueo', 0
        );
    END IF;

    UPDATE public.login_attempts
    SET intentos = intentos + 1,
        ultimo_intento = v_ahora
    WHERE id = v_registro.id;

    IF (v_registro.intentos + 1) >= p_max_intentos THEN
        UPDATE public.login_attempts
        SET bloqueado_hasta = v_ahora + v_bloqueo
        WHERE id = v_registro.id;

        v_resultado := jsonb_build_object(
            'permitido', false,
            'intentos_restantes', 0,
            'minutos_bloqueo', p_bloqueo_minutos
        );
    ELSE
        v_resultado := jsonb_build_object(
            'permitido', true,
            'intentos_restantes', p_max_intentos - (v_registro.intentos + 1),
            'minutos_bloqueo', 0
        );
    END IF;

    RETURN v_resultado;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_clear_login_attempts(p_identifier TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.login_attempts WHERE identifier = p_identifier;
END;
$$;

-- ==============================================================================
-- 11. HABILITACIÓN DE RLS EN TODAS LAS TABLAS
-- ==============================================================================
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casos_legales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicaciones_legales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes_bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
DO $$
DECLARE
    tbl TEXT;
    tablas_app TEXT[] := ARRAY[
        'contratos', 'pagos', 'auditoria', 'tasas', 
        'casos_legales', 'comunicaciones_legales', 
        'reportes_bugs', 'usuarios', 'configuracion'
    ];
BEGIN
    FOREACH tbl IN ARRAY tablas_app
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_ops_%s" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "allow_all_ops_%s" ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl, tbl);
    END LOOP;
END $$;

-- ==============================================================================
-- 12. DATOS INICIALES Y FICTICIOS (SEED)
-- ==============================================================================

-- Configuración Base
INSERT INTO public.configuracion (clave, valor) VALUES
('PIN_SEGURIDAD', '0905'),
('TELEGRAM_TOKEN', ''),
('TELEGRAM_CHAT_ID', '')
ON CONFLICT (clave) DO NOTHING;

-- Tasas Iniciales
INSERT INTO public.tasas (usd, eur, bcv, promedio, fuente, fecha) VALUES
(415.50, 442.20, 395.80, 405.65, 'Binance P2P + BCV Oficial', '26/08/2026 14:00:00');

-- Usuario Administrador Inicial
INSERT INTO public.usuarios (email, nombre, password_hash, rol, activo) VALUES
('admin@gestioncobros.com', 'Yeckson González', 'admin123', 'admin', true),
('gestor@gestioncobros.com', 'Gestor Cobranzas', 'gestor123', 'gestor', true)
ON CONFLICT (email) DO NOTHING;

-- Contratos e Inquilinos Ficticios Realistas
INSERT INTO public.contratos (
    nombre, cedula, rif, telefono, correo, inmueble, ubicacion, unidad,
    canon_base_usd, canon_base_eur, dia_pago, metodo_pago,
    plan_contingencia_usd, deposito_total_usd, fecha_inicio_contrato,
    fecha_vencimiento, status_contrato, estacionamiento, observaciones,
    canon_total_usd, cargo_mora_usd, dias_gracia_mora
) VALUES
('Darwin Ramón Piña', 'V-18341397', 'J-12345678', '+58412-1630270', 'darwin.pina@ficticio.com', 'Federación', 'Piso 1', '1-A', 180.00, 195.00, 'Del 1 al 5 de cada mes', 'Zelle', 5.00, 360.00, '01/01/2026', '31/12/2026', 'Vigente', 'Si', 'Inquilino puntual', 185.00, 3.00, 5),
('Carlos Alberto Pérez', 'V-12345678', 'J-87654321', '+58414-9876543', 'carlos.perez@ficticio.com', 'Miko', 'Piso 2', '2-B', 160.00, 175.00, 'Del 1 al 5 de cada mes', 'Pago Móvil', 5.00, 320.00, '01/02/2026', '31/01/2027', 'Moroso', 'No', 'Pendiente mes actual', 165.00, 3.00, 5),
('Ana Gabriela Gómez', 'V-20111222', 'J-99887766', '+58424-5554433', 'ana.gomez@ficticio.com', 'Miko', 'Piso 1', '1-C', 200.00, 215.00, 'Del 1 al 5 de cada mes', 'Zelle', 10.00, 400.00, '01/03/2026', '28/02/2027', 'Vigente', 'Si', 'Local comercial', 210.00, 3.00, 5),
('Luis Fernando Torres', 'V-15444333', 'J-55443322', '+58416-2223344', 'luis.torres@ficticio.com', 'Federación', 'Piso 2', '2-A', 150.00, 160.00, 'Del 1 al 5 de cada mes', 'Efectivo USD', 0.00, 300.00, '01/09/2025', '31/08/2026', 'Por Renovar', 'No', 'Contrato próximo a vencer', 150.00, 3.00, 5),
('María Elena Rivas', 'V-19888777', 'J-11223344', '+58412-8889900', 'maria.rivas@ficticio.com', 'La Candelaria', 'Piso 3', '3-A', 220.00, 235.00, 'Del 1 al 5 de cada mes', 'Transferencia BFC', 10.00, 440.00, '15/01/2026', '14/01/2027', 'Vigente', 'Si', 'Oficina administrativa', 230.00, 3.00, 5),
('Roberto José Mendoza', 'V-14555666', 'J-33445566', '+58414-1112233', 'roberto.mendoza@ficticio.com', 'Tulipanes', 'Planta Baja', 'PB-1', 140.00, 150.00, 'Del 1 al 5 de cada mes', 'Pago Móvil', 0.00, 280.00, '01/01/2026', '31/12/2026', 'Vigente', 'No', 'Depósito al día', 140.00, 3.00, 5),
('Valeria Sofía Castro', 'V-23999888', 'J-77889900', '+58424-7778899', 'valeria.castro@ficticio.com', 'El Morro', 'Piso 1', '1-B', 175.00, 190.00, 'Del 1 al 5 de cada mes', 'Zelle', 5.00, 350.00, '01/04/2026', '31/03/2027', 'Vigente', 'Si', 'Apartamento residencial', 180.00, 3.00, 5);

-- Pagos Iniciales Históricos
INSERT INTO public.pagos (
    inmueble, unidad, arrendatario, canon_base_usd, plan_contingencia,
    deposito_cuota, canon_total_esperado, dia_pago, status_cobro,
    pago_recibido, fecha_pago, cargo_mora_usd, total_a_cobrar,
    diferencia, metodo_pago, referencia, gestor, mes_cobro,
    observaciones, estacionamiento_cobrado, monto_usd, monto_eur, activo
) VALUES
('Federación', '1-A', 'Darwin Ramón Piña', 180.00, 5.00, 0.00, 185.00, 'Del 1 al 5 de cada mes', 'Al Día', 185.00, '03/08/2026', 0.00, 185.00, 0.00, 'Zelle', 'ZEL-9921', 'admin@gestioncobros.com', 'Agosto 2026', 'Pago puntual', 0.00, 185.00, 0.00, true),
('Miko', '1-C', 'Ana Gabriela Gómez', 200.00, 10.00, 0.00, 210.00, 'Del 1 al 5 de cada mes', 'Al Día', 210.00, '04/08/2026', 0.00, 210.00, 0.00, 'Zelle', 'ZEL-8834', 'admin@gestioncobros.com', 'Agosto 2026', 'Pago de canon mensual', 0.00, 210.00, 0.00, true),
('La Candelaria', '3-A', 'María Elena Rivas', 220.00, 10.00, 0.00, 230.00, 'Del 1 al 5 de cada mes', 'Al Día', 230.00, '05/08/2026', 0.00, 230.00, 0.00, 'Transferencia BFC', 'BFC-7721', 'admin@gestioncobros.com', 'Agosto 2026', 'Transferencia verificada', 0.00, 230.00, 0.00, true),
('Tulipanes', 'PB-1', 'Roberto José Mendoza', 140.00, 0.00, 0.00, 140.00, 'Del 1 al 5 de cada mes', 'Al Día', 140.00, '02/08/2026', 0.00, 140.00, 0.00, 'Pago Móvil', 'PM-5512', 'admin@gestioncobros.com', 'Agosto 2026', 'Pago móvil al BCV', 0.00, 140.00, 0.00, true),
('El Morro', '1-B', 'Valeria Sofía Castro', 175.00, 5.00, 0.00, 180.00, 'Del 1 al 5 de cada mes', 'Al Día', 180.00, '05/08/2026', 0.00, 180.00, 0.00, 'Zelle', 'ZEL-1122', 'admin@gestioncobros.com', 'Agosto 2026', 'Canon pagado', 0.00, 180.00, 0.00, true);

-- Auditoría Inicial
INSERT INTO public.auditoria (fecha, hora, usuario, accion, tabla, id_registro, campo, valor_anterior, valor_nuevo, detalles) VALUES
('26/08/2026', '14:00:00', 'admin@gestioncobros.com', 'Migración Supabase', 'Sistema', 'Setup', 'Database', 'Google Sheets', 'Supabase PostgreSQL', 'Migración exitosa a base de datos de alta velocidad');
