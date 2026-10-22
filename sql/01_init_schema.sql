-- ============================================================================
-- Esquema de Base de Datos para Módulo 9 (M9 - Reservas de Viajes)
-- UTN FRRe - TP1 - Grupo 8
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla principal de Reservas
CREATE TABLE IF NOT EXISTS reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave_idempotencia VARCHAR(255) UNIQUE NOT NULL,
    cliente_id VARCHAR(64) NOT NULL,
    
    -- Dirección de Origen
    origen_direccion TEXT NOT NULL,
    origen_latitud DOUBLE PRECISION NOT NULL,
    origen_longitud DOUBLE PRECISION NOT NULL,
    origen_alias VARCHAR(100),
    origen_piso VARCHAR(20),
    origen_indicaciones TEXT,
    
    -- Dirección de Destino
    destino_direccion TEXT NOT NULL,
    destino_latitud DOUBLE PRECISION NOT NULL,
    destino_longitud DOUBLE PRECISION NOT NULL,
    destino_alias VARCHAR(100),
    destino_piso VARCHAR(20),
    destino_indicaciones TEXT,
    
    -- Parámetros del viaje
    tipo_vehiculo VARCHAR(10) NOT NULL CHECK (tipo_vehiculo IN ('AUTO', 'MOTO')),
    fecha_hora TIMESTAMPTZ NOT NULL,
    zona_horaria VARCHAR(100) NOT NULL,
    
    -- Estado del ciclo de vida
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('PENDIENTE', 'CONFIRMADA', 'ACTIVADA', 'CANCELADA', 'VENCIDA')),
    
    -- Tarifa estimada (M7)
    tarifa_estimada NUMERIC(10, 2),
    moneda VARCHAR(5) DEFAULT 'ARS',
    condiciones_tarifa TEXT,
    
    -- Solicitud de Despacho (M5)
    solicitud_despacho_id VARCHAR(100) UNIQUE,
    
    -- Cancelación
    motivo_cancelacion TEXT,
    
    -- Auditoría temporal
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de consulta frecuente para Reservas
CREATE INDEX IF NOT EXISTS idx_reservas_cliente_id ON reservas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_reservas_estado ON reservas(estado);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha_hora ON reservas(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_reservas_solicitud_despacho ON reservas(solicitud_despacho_id);

-- Tabla de Auditoría / Historial de Reservas (RF-9.12)
CREATE TABLE IF NOT EXISTS historial_reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reserva_id UUID NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
    tipo_evento VARCHAR(50) NOT NULL,
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20) NOT NULL,
    actor VARCHAR(100),
    detalles JSONB,
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historial_reserva_id ON historial_reservas(reserva_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha_hora ON historial_reservas(fecha_hora);

-- Tabla para Idempotencia de peticiones HTTP (RF-9.10)
CREATE TABLE IF NOT EXISTS registro_idempotencia (
    clave VARCHAR(255) PRIMARY KEY,
    ruta VARCHAR(255) NOT NULL,
    codigo_estado INT NOT NULL,
    cuerpo_respuesta JSONB NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_idempotencia_creado_en ON registro_idempotencia(creado_en);
