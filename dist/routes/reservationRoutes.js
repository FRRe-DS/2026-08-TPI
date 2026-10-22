"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reservationController_1 = require("../controllers/reservationController");
const activationController_1 = require("../controllers/activationController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Todas las rutas de reservas requieren autenticación previa
router.use(auth_1.authenticateToken);
// 2. Crear reserva
router.post('/', (0, auth_1.requireRoles)(['CLIENTE', 'OPERADOR', 'SERVICIO']), reservationController_1.ReservationController.crear);
// 3. Listar reservas por cliente
router.get('/', (0, auth_1.requireRoles)(['CLIENTE', 'OPERADOR', 'SERVICIO']), reservationController_1.ReservationController.listar);
// 4. Consultar reserva por ID
router.get('/:id', (0, auth_1.requireRoles)(['CLIENTE', 'CONDUCTOR', 'OPERADOR', 'SERVICIO']), reservationController_1.ReservationController.obtenerPorId);
// 5. Modificar reserva activa
router.patch('/:id', (0, auth_1.requireRoles)(['CLIENTE', 'OPERADOR', 'SERVICIO']), reservationController_1.ReservationController.modificar);
// 6. Cancelar reserva
router.post('/:id/cancelar', (0, auth_1.requireRoles)(['CLIENTE', 'OPERADOR', 'SERVICIO']), reservationController_1.ReservationController.cancelar);
// 7. Consultar historial de eventos
router.get('/:id/historial', (0, auth_1.requireRoles)(['CLIENTE', 'OPERADOR', 'SERVICIO']), reservationController_1.ReservationController.historial);
// 8. Activar reserva hacia Solicitud y Despacho (M5)
router.post('/:id/activar', (0, auth_1.requireRoles)(['OPERADOR', 'SERVICIO']), activationController_1.ActivationController.activar);
// 9. Webhook callback recibido desde M5 (Despacho)
router.post('/:id/despacho', (0, auth_1.requireRoles)(['SERVICIO']), activationController_1.ActivationController.webhookDespacho);
exports.default = router;
