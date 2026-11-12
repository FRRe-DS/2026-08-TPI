 import { Router } from 'express';

import { ReservationController } from '../controllers/reservationController';

import { ActivationController } from '../controllers/activationController';

import { authenticateToken, requireRoles } from '../middlewares/auth';


const router = Router();


// Todas las rutas de reservas requieren autenticación previa

router.use(authenticateToken);


// 2. Crear reserva
router.post(
  '/',
  requireRoles(['CLIENTE', 'OPERADOR', 'SERVICIO', 'reservas-be', 'clientes-be']),
  ReservationController.crear
);

// 3. Listar reservas por cliente
router.get(
  '/',
  requireRoles(['CLIENTE', 'OPERADOR', 'SERVICIO', 'reservas-be', 'clientes-be']),
  ReservationController.listar
);

// 4. Consultar reserva por ID
router.get(
  '/:id',
  requireRoles([
    'CLIENTE',
    'CONDUCTOR',
    'OPERADOR',
    'SERVICIO',
    'reservas-be',
    'clientes-be',
    'solicitud-be'
  ]),
  ReservationController.obtenerPorId
);

// 5. Modificar reserva activa
router.patch(
  '/:id',
  requireRoles(['CLIENTE', 'OPERADOR', 'SERVICIO', 'reservas-be', 'clientes-be']),
  ReservationController.modificar
);

// 6. Cancelar reserva
router.post(
  '/:id/cancelar',
  requireRoles(['CLIENTE', 'OPERADOR', 'SERVICIO', 'reservas-be', 'clientes-be']),
  ReservationController.cancelar
);

// 7. Consultar historial de eventos
router.get(
  '/:id/historial',
  requireRoles(['CLIENTE', 'OPERADOR', 'SERVICIO', 'reservas-be', 'clientes-be']),
  ReservationController.historial
);

// 8. Activar reserva hacia Solicitud y Despacho (M5)
router.post(
  '/:id/activar',
  requireRoles(['OPERADOR', 'SERVICIO', 'reservas-be', 'solicitud-be']),
  ActivationController.activar
);

// 9. Webhook callback recibido desde M5 (Despacho)
router.post(
  '/:id/despacho',
  requireRoles(['SERVICIO', 'solicitud-be', 'reservas-be']),
  ActivationController.webhookDespacho
);


export default router; 
