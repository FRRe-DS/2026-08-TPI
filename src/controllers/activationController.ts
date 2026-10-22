import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ActivationService } from '../services/activationService';

const DespachoWebhookSchema = z.object({
  solicitud_id: z.string().min(1, 'solicitud_id es obligatorio'),
  resultado: z.enum(['CONFIRMADA', 'VENCIDA'], {
    errorMap: () => ({ message: "resultado debe ser 'CONFIRMADA' o 'VENCIDA'" })
  }),
  fecha: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'fecha debe tener formato ISO 8601 válido'
  })
});

export class ActivationController {
  public static async activar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      const user = req.user!;
      const resultado = await ActivationService.activarReserva(id, user, req.id);
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  }

  public static async webhookDespacho(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      const validatedPayload = DespachoWebhookSchema.parse(req.body);
      const resultado = await ActivationService.procesarWebhookDespacho(id, validatedPayload, req.id);
      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  }
}
