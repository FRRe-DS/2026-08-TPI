import { Router, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

const router = Router();

const openapiPath = path.join(__dirname, '../../openapi.yaml');

let swaggerDocument: any;
try {
  if (fs.existsSync(openapiPath)) {
    const file = fs.readFileSync(openapiPath, 'utf8');
    swaggerDocument = YAML.parse(file);
  }
} catch (error) {
  console.warn('No se pudo cargar openapi.yaml:', error);
}

// 10. Swagger UI en GET /docs
if (swaggerDocument) {
  router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} else {
  router.get('/docs', (_req: Request, res: Response) => {
    res.status(503).json({
      type: 'https://api.reservas.frre.utn.edu.ar/errors/documentacion-no-disponible',
      title: 'Documentación no disponible',
      status: 503,
      detail: 'El archivo openapi.yaml no se encuentra disponible.'
    });
  });
}

// Raw YAML contract
router.get('/openapi.yaml', (_req: Request, res: Response) => {
  if (fs.existsSync(openapiPath)) {
    res.setHeader('Content-Type', 'text/yaml');
    fs.createReadStream(openapiPath).pipe(res);
  } else {
    res.status(404).send('openapi.yaml no encontrado');
  }
});

export default router;
