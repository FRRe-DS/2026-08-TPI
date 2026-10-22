"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationRepository = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../config/database");
class ReservationRepository {
    static inMemoryReservas = new Map();
    static async crear(data) {
        const id = (0, uuid_1.v4)();
        try {
            const res = await database_1.db.query(`INSERT INTO reservas (
          id, clave_idempotencia, cliente_id,
          origen_direccion, origen_latitud, origen_longitud, origen_alias, origen_piso, origen_indicaciones,
          destino_direccion, destino_latitud, destino_longitud, destino_alias, destino_piso, destino_indicaciones,
          tipo_vehiculo, fecha_hora, zona_horaria, estado, tarifa_estimada, moneda, condiciones_tarifa,
          creado_en, actualizado_en
        ) VALUES (
          $1, $2, $3,
          $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22,
          NOW(), NOW()
        ) RETURNING *`, [
                id,
                data.claveIdempotencia,
                data.clienteId,
                data.origen.direccion,
                data.origen.latitud,
                data.origen.longitud,
                data.origen.alias || null,
                data.origen.piso || null,
                data.origen.indicaciones || null,
                data.destino.direccion,
                data.destino.latitud,
                data.destino.longitud,
                data.destino.alias || null,
                data.destino.piso || null,
                data.destino.indicaciones || null,
                data.tipoVehiculo,
                data.fechaHora,
                data.zonaHoraria,
                data.estado,
                data.tarifaEstimada,
                data.moneda,
                data.condicionesTarifa
            ]);
            return this.mapEntityToDTO(this.mapRowToEntity(res.rows[0]));
        }
        catch {
            // Fallback in-memory
            const now = new Date();
            const entity = {
                id,
                clave_idempotencia: data.claveIdempotencia,
                cliente_id: data.clienteId,
                origen_direccion: data.origen.direccion,
                origen_latitud: data.origen.latitud,
                origen_longitud: data.origen.longitud,
                origen_alias: data.origen.alias || null,
                origen_piso: data.origen.piso || null,
                origen_indicaciones: data.origen.indicaciones || null,
                destino_direccion: data.destino.direccion,
                destino_latitud: data.destino.latitud,
                destino_longitud: data.destino.longitud,
                destino_alias: data.destino.alias || null,
                destino_piso: data.destino.piso || null,
                destino_indicaciones: data.destino.indicaciones || null,
                tipo_vehiculo: data.tipoVehiculo,
                fecha_hora: new Date(data.fechaHora),
                zona_horaria: data.zonaHoraria,
                estado: data.estado,
                tarifa_estimada: data.tarifaEstimada,
                moneda: data.moneda,
                condiciones_tarifa: data.condicionesTarifa,
                solicitud_despacho_id: null,
                motivo_cancelacion: null,
                creado_en: now,
                actualizado_en: now
            };
            this.inMemoryReservas.set(id, entity);
            return this.mapEntityToDTO(entity);
        }
    }
    static async obtenerPorId(id) {
        try {
            const res = await database_1.db.query('SELECT * FROM reservas WHERE id = $1', [id]);
            if (res.rows.length === 0)
                return null;
            return this.mapEntityToDTO(this.mapRowToEntity(res.rows[0]));
        }
        catch {
            const entity = this.inMemoryReservas.get(id);
            return entity ? this.mapEntityToDTO(entity) : null;
        }
    }
    static async obtenerPorClaveIdempotencia(clave) {
        try {
            const res = await database_1.db.query('SELECT * FROM reservas WHERE clave_idempotencia = $1', [clave]);
            if (res.rows.length === 0)
                return null;
            return this.mapEntityToDTO(this.mapRowToEntity(res.rows[0]));
        }
        catch {
            for (const entity of this.inMemoryReservas.values()) {
                if (entity.clave_idempotencia === clave) {
                    return this.mapEntityToDTO(entity);
                }
            }
            return null;
        }
    }
    static async listarPorCliente(clienteId) {
        try {
            const res = await database_1.db.query('SELECT * FROM reservas WHERE cliente_id = $1 ORDER BY fecha_hora DESC', [clienteId]);
            return res.rows.map((row) => this.mapEntityToDTO(this.mapRowToEntity(row)));
        }
        catch {
            const list = [];
            for (const entity of this.inMemoryReservas.values()) {
                if (entity.cliente_id === clienteId) {
                    list.push(entity);
                }
            }
            return list
                .sort((a, b) => b.fecha_hora.getTime() - a.fecha_hora.getTime())
                .map((e) => this.mapEntityToDTO(e));
        }
    }
    static async actualizar(id, updates) {
        const fields = Object.keys(updates);
        if (fields.length === 0)
            return this.obtenerPorId(id);
        try {
            const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
            const values = fields.map((f) => updates[f]);
            const res = await database_1.db.query(`UPDATE reservas SET ${setClauses}, actualizado_en = NOW() WHERE id = $1 RETURNING *`, [id, ...values]);
            if (res.rows.length === 0)
                return null;
            return this.mapEntityToDTO(this.mapRowToEntity(res.rows[0]));
        }
        catch {
            const entity = this.inMemoryReservas.get(id);
            if (!entity)
                return null;
            const updatedEntity = {
                ...entity,
                ...updates,
                fecha_hora: updates.fecha_hora ? new Date(updates.fecha_hora) : entity.fecha_hora,
                actualizado_en: new Date()
            };
            this.inMemoryReservas.set(id, updatedEntity);
            return this.mapEntityToDTO(updatedEntity);
        }
    }
    static clearMemory() {
        this.inMemoryReservas.clear();
    }
    static mapRowToEntity(row) {
        return {
            id: row.id,
            clave_idempotencia: row.clave_idempotencia,
            cliente_id: row.cliente_id,
            origen_direccion: row.origen_direccion,
            origen_latitud: parseFloat(row.origen_latitud),
            origen_longitud: parseFloat(row.origen_longitud),
            origen_alias: row.origen_alias,
            origen_piso: row.origen_piso,
            origen_indicaciones: row.origen_indicaciones,
            destino_direccion: row.destino_direccion,
            destino_latitud: parseFloat(row.destino_latitud),
            destino_longitud: parseFloat(row.destino_longitud),
            destino_alias: row.destino_alias,
            destino_piso: row.destino_piso,
            destino_indicaciones: row.destino_indicaciones,
            tipo_vehiculo: row.tipo_vehiculo,
            fecha_hora: new Date(row.fecha_hora),
            zona_horaria: row.zona_horaria,
            estado: row.estado,
            tarifa_estimada: row.tarifa_estimada ? parseFloat(row.tarifa_estimada) : null,
            moneda: row.moneda,
            condiciones_tarifa: row.condiciones_tarifa,
            solicitud_despacho_id: row.solicitud_despacho_id,
            motivo_cancelacion: row.motivo_cancelacion,
            creado_en: new Date(row.creado_en),
            actualizado_en: new Date(row.actualizado_en)
        };
    }
    static mapEntityToDTO(entity) {
        return {
            id: entity.id,
            claveIdempotencia: entity.clave_idempotencia,
            clienteId: entity.cliente_id,
            origen: {
                direccion: entity.origen_direccion,
                latitud: entity.origen_latitud,
                longitud: entity.origen_longitud,
                alias: entity.origen_alias,
                piso: entity.origen_piso,
                indicaciones: entity.origen_indicaciones
            },
            destino: {
                direccion: entity.destino_direccion,
                latitud: entity.destino_latitud,
                longitud: entity.destino_longitud,
                alias: entity.destino_alias,
                piso: entity.destino_piso,
                indicaciones: entity.destino_indicaciones
            },
            tipoVehiculo: entity.tipo_vehiculo,
            fechaHora: entity.fecha_hora.toISOString(),
            zonaHoraria: entity.zona_horaria,
            estado: entity.estado,
            tarifaEstimada: entity.tarifa_estimada,
            moneda: entity.moneda,
            condicionesTarifa: entity.condiciones_tarifa,
            solicitudDespachoId: entity.solicitud_despacho_id,
            motivoCancelacion: entity.motivo_cancelacion,
            creadoEn: entity.creado_en.toISOString(),
            actualizadoEn: entity.actualizado_en.toISOString()
        };
    }
}
exports.ReservationRepository = ReservationRepository;
