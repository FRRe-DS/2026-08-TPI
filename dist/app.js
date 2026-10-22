"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const requestId_1 = require("./middlewares/requestId");
const errorHandler_1 = require("./middlewares/errorHandler");
const notFoundHandler_1 = require("./middlewares/notFoundHandler");
const healthRoutes_1 = __importDefault(require("./routes/healthRoutes"));
const reservationRoutes_1 = __importDefault(require("./routes/reservationRoutes"));
const docRoutes_1 = __importDefault(require("./routes/docRoutes"));
const createApp = () => {
    const app = (0, express_1.default)();
    // Middlewares globales
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use(requestId_1.requestIdMiddleware);
    // Rutas
    app.use(healthRoutes_1.default);
    app.use(docRoutes_1.default);
    app.use('/reservas', reservationRoutes_1.default);
    // Manejo de 404 y errores RFC 7807
    app.use(notFoundHandler_1.notFoundHandler);
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.createApp = createApp;
exports.default = (0, exports.createApp)();
