# Módulo 9 (M9 - Reservas de Viajes)
**Trabajo Práctico 1 (TP1) - Desarrollo de Software - UTN FRRe**  
**Grupo 8**

---

## 📋 Descripción del Proyecto
El **Módulo 9 (Reservas de Viajes)** gestiona el ciclo de vida completo de viajes programados (con reserva anticipada). Implementa la lógica de negocio, validaciones de anticipación, interoperabilidad con los módulos del sistema (M2, M4, M5, M7, M8), trazabilidad y auditoría histórica no destructiva.

---

## 🛠️ Stack Tecnológico y Arquitectura
- **Lenguaje / Runtime**: Node.js v24 (LTS) & TypeScript 5.
- **Framework Web**: Express.js con arquitectura limpia en capas (Controladores, Servicios, Repositorios, Clientes de Integración, Middlewares).
- **Base de Datos**: PostgreSQL 16 con pool de conexiones y migraciones DDL idempotentes (`./sql/01_init_schema.sql`).
- **Seguridad**: JWT (HS256) con clave compartida de desarrollo y control de acceso basado en roles (`CLIENTE`, `CONDUCTOR`, `OPERADOR`, `SERVICIO`).
- **Formato de Errores**: RFC 7807 (`application/problem+json`).
- **Trazabilidad**: Encabezado `X-Request-Id` (UUID v4) propagado y generado en cada petición.
- **Documentación de API**: OpenAPI 3.0.3 (`openapi.yaml`) y Swagger UI accesible en `GET /docs`.
- **Contenerización**: Docker (multi-stage build) y Docker Compose.
- **Testing**: Jest + Supertest (pruebas unitarias y de integración).

---

## 🌐 Endpoints de la API (Puerto 8089)

| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Público | Comprueba estado del servicio y conectividad con PostgreSQL. |
| `GET` | `/docs` | Público | Documentación interactiva de la API con Swagger UI. |
| `GET` | `/openapi.yaml` | Público | Contrato de la API en formato OpenAPI 3.0 raw. |
| `POST` | `/reservas` | `CLIENTE`, `OPERADOR`, `SERVICIO` | Crea una reserva programada con validación e idempotencia. |
| `GET` | `/reservas?clienteId=...` | `CLIENTE`, `OPERADOR`, `SERVICIO` | Lista las reservas de un cliente. |
| `GET` | `/reservas/:id` | `CLIENTE`, `CONDUCTOR`, `OPERADOR`, `SERVICIO` | Consulta el detalle de una reserva por su UUID. |
| `PATCH` | `/reservas/:id` | `CLIENTE`, `OPERADOR`, `SERVICIO` | Modifica datos o reprograma reserva en estado permitido. |
| `POST` | `/reservas/:id/cancelar` | `CLIENTE`, `OPERADOR`, `SERVICIO` | Cancela reserva activa indicando motivo (mín. 3 caracteres). |
| `GET` | `/reservas/:id/historial` | `CLIENTE`, `OPERADOR`, `SERVICIO` | Consulta el historial de auditoría de la reserva (RF-9.12). |
| `POST` | `/reservas/:id/activar` | `OPERADOR`, `SERVICIO` | Activa la reserva hacia M5 con `Idempotency-Key` (RF-9.9/9.10). |
| `POST` | `/reservas/:id/despacho` | `SERVICIO` | Webhook callback recibido desde M5 con el resultado. |

---

## 🚀 Puesta en Marcha

### Opción 1: Ejecución con Docker Compose (Recomendada)
Para levantar PostgreSQL y la aplicación M9 en un solo comando:

```bash
docker compose up --build -d
```

- Swagger UI: [http://localhost:8089/docs](http://localhost:8089/docs)
- Healthcheck: [http://localhost:8089/health](http://localhost:8089/health)
- PostgreSQL: `localhost:5432` (Base de datos: `m9_reservas`, usuario: `postgres`, contraseña: `postgres`)

Para ver los logs en tiempo real:
```bash
docker compose logs -f m9-reservas
```

Para detener los contenedores:
```bash
docker compose down -v
```

---

### Opción 2: Ejecución Local en Desarrollo

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno (copiar `.env.example` a `.env`):
```bash
cp .env.example .env
```

3. Iniciar el servidor en modo desarrollo:
```bash
npm run dev
```

4. Compilar para producción:
```bash
npm run build
npm start
```

---

## 🧪 Ejecución de Pruebas Automatizadas

La suite incluye pruebas unitarias para validaciones de esquemas y ventanas de anticipación, así como pruebas de integración de punta a punta con Supertest:

```bash
npm test
```

Salida esperada:
```text
Test Suites: 5 passed, 5 total
Tests:       35 passed, 35 total
Snapshots:   0 total
```

---

## 🔒 Autenticación y Tokens JWT de Prueba

El sistema utiliza JWT firmado con algoritmo `HS256` y la clave `clave-secreta-desarrollo-compartida-utn-frre-m9`.

### Estructura del Payload JWT
```json
{
  "iss": "utn-frre-arquitectura",
  "aud": "utn-frre-ecosistema",
  "sub": "0b7e2d4a-5c1f-4e8a-9d3b-2f6a1c8e7b40",
  "roles": ["CLIENTE"]
}
```

### Generación rápida de Token para pruebas con Node:
```bash
node -e '
const jwt = require("jsonwebtoken");
const token = jwt.sign(
  { iss: "utn-frre-arquitectura", aud: "utn-frre-ecosistema", sub: "cliente-01", roles: ["CLIENTE"] },
  "clave-secreta-desarrollo-compartida-utn-frre-m9",
  { algorithm: "HS256", expiresIn: "24h" }
);
console.log(token);
'
```

---

## 🔄 Integración con Otros Módulos

- **M2 (Clientes)**: Valida que la cuenta del cliente no esté `BLOQUEADO`.
- **M4 (Ubicación)**: Valida que origen y destino estén dentro de la cobertura geográfica y calcula distancia (km) y tiempo estimado (min).
- **M7 (Tarifas y Pagos)**: Estima la tarifa del viaje en función de distancia, tiempo y tipo de vehículo.
- **M5 (Solicitud y Despacho)**: Envío de activación con encabezado `Idempotency-Key` (UUID) para evitar duplicación. Recibe webhook de confirmación (`ACTIVADA`) o vencimiento (`VENCIDA`).
- **M8 (Notificaciones)**: Notificación asíncrona de eventos del ciclo de vida (`RESERVA_CREADA`, `RESERVA_CONFIRMADA`, `RESERVA_MODIFICADA`, `RESERVA_CANCELADA`, `RESERVA_ACTIVADA`, `RESERVA_VENCIDA`). Resiliente ante caídas.
