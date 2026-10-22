"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const yaml_1 = __importDefault(require("yaml"));
const router = (0, express_1.Router)();
const openapiPath = path_1.default.join(__dirname, '../../openapi.yaml');
let swaggerDocument;
try {
    if (fs_1.default.existsSync(openapiPath)) {
        const file = fs_1.default.readFileSync(openapiPath, 'utf8');
        swaggerDocument = yaml_1.default.parse(file);
    }
}
catch (error) {
    console.warn('No se pudo cargar openapi.yaml:', error);
}
// 10. Swagger UI en GET /docs
if (swaggerDocument) {
    router.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
}
else {
    router.get('/docs', (_req, res) => {
        res.status(503).json({
            type: 'https://api.reservas.frre.utn.edu.ar/errors/documentacion-no-disponible',
            title: 'Documentación no disponible',
            status: 503,
            detail: 'El archivo openapi.yaml no se encuentra disponible.'
        });
    });
}
// Raw YAML contract
router.get('/openapi.yaml', (_req, res) => {
    if (fs_1.default.existsSync(openapiPath)) {
        res.setHeader('Content-Type', 'text/yaml');
        fs_1.default.createReadStream(openapiPath).pipe(res);
    }
    else {
        res.status(404).send('openapi.yaml no encontrado');
    }
});
exports.default = router;
