"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivationController = void 0;
const zod_1 = require("zod");
const activationService_1 = require("../services/activationService");
const DespachoWebhookSchema = zod_1.z.object({
    solicitud_id: zod_1.z.string().min(1, 'solicitud_id es obligatorio'),
    resultado: zod_1.z.enum(['CONFIRMADA', 'VENCIDA'], {
        errorMap: () => ({ message: "resultado debe ser 'CONFIRMADA' o 'VENCIDA'" })
    }),
    fecha: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'fecha debe tener formato ISO 8601 válido'
    })
});
class ActivationController {
    static async activar(req, res, next) {
        try {
            const id = req.params.id;
            const user = req.user;
            const resultado = await activationService_1.ActivationService.activarReserva(id, user, req.id);
            res.status(200).json(resultado);
        }
        catch (error) {
            next(error);
        }
    }
    static async webhookDespacho(req, res, next) {
        try {
            const id = req.params.id;
            const validatedPayload = DespachoWebhookSchema.parse(req.body);
            const resultado = await activationService_1.ActivationService.procesarWebhookDespacho(id, validatedPayload, req.id);
            res.status(200).json(resultado);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ActivationController = ActivationController;
