# Bitácora DevOps — Módulo 9 (M9: Reservas de Viajes)

- **Asignaturas:** DevOps (Cultura, Herramientas y Procesos) & Desarrollo de Software — UTN FRRe 2026
- **Módulo asignado:** M9 — Reservas de Viajes
- **Equipo DevOps:** Grupo 03
- **Equipo Desarrollo de Software:** Grupo 8
- **Repositorio:** https://github.com/FRRe-DS/2026-08-TPI

---

## Registro Cronológico

### Entrada 1 — Semana del 11/11/2026 (Hito 1 y avance de Hito 2: Diagnóstico y CI + SAST)

- **Fecha:** Semana del 11/11/2026
- **Responsable/s:** Equipo DevOps (Grupo 03)
- **Módulo:** M9 — Reservas de Viajes
- **Objetivo:** Realizar el relevamiento técnico del repositorio existente e incorporar un pipeline de Integración Continua (CI) con compilación, pruebas automáticas y análisis estático de seguridad (SAST).
- **Tarea ejecutada:**
  1. **Relevamiento del código y arquitectura:** Se analizó el proyecto en Node.js 24 + TypeScript 5 + Express + PostgreSQL 16 (puerto `8089`). Se identificaron las capas (`routes`, `controllers`, `services`, `repositories`, `clients`, `middlewares`), el esquema SQL (`sql/01_init_schema.sql`), la contenerización (`Dockerfile` multi-stage y `docker-compose.yml`), la suite de pruebas con Jest + Supertest (`tests/unit` y `tests/integration`) y el uso de `USE_EXTERNAL_MOCKS` para aislar integraciones con M2, M4, M5, M7 y M8. Se constató la ausencia previa de pipelines CI, análisis SAST, instrumentación OpenTelemetry y scripts de carga k6.
  2. **Implementación de pipeline CI y SAST:** Se creó la rama `devops/ci-pipeline` y el archivo `.github/workflows/ci.yml` con disparo automático en `pull_request` hacia `main` y `push` a `main` y `devops/**`, incluyendo dos jobs:
     - `build-and-test`: levanta un servicio `postgres:16-alpine` con healthcheck, instala dependencias (`npm ci`), compila TypeScript (`npm run build`), inicializa el esquema `sql/01_init_schema.sql`, ejecuta `npm test -- --coverage` (unitarios e integración/E2E) subiendo el reporte como artifact, y valida la construcción de la imagen Docker (`docker build`).
     - `sast`: ejecuta **Semgrep** con los rulesets `p/typescript`, `p/nodejs` y `p/secrets`, exporta `semgrep-report.json` como artifact y aplica un Quality Gate que falla ante hallazgos de severidad `ERROR`.
- **Decisiones / acuerdos con Desarrollo:**
  - Trabajar sobre ramas dedicadas y validar cada incorporación mediante Pull Requests hacia `main` sin modificar la lógica funcional del módulo.
  - Utilizar Semgrep en GitHub Actions como herramienta SAST para evitar dependencias de configuración externa sobre el repositorio.
  - Acordar como criterio de aceptación (Quality Gate) que ningún PR se mergee si falla la compilación, los tests o si existen hallazgos SAST de severidad `ERROR`.
- **Repositorio / Issue / PR:**
  - Rama: `devops/ci-pipeline` (mergeada en `main`)
  - Archivo agregado: `.github/workflows/ci.yml`
  - PR / Issue: *[https://github.com/FRRe-DS/2026-08-TPI/pull/48]*
- **Evidencia (URL, captura o reporte):**
  - *[https://github.com/FRRe-DS/2026-08-TPI/actions/runs/43795001363]*
- **Resultado:** Pipeline de CI y SAST ejecutado con éxito sobre el Pull Request (compilación, tests unitarios/integración con PostgreSQL 16, build Docker y Semgrep en verde) y mergeado a `main`.
- **Dificultad o bloqueo:** Los tests de integración se conectan a una instancia real de PostgreSQL pero no inicializan las tablas por sí mismos; se resolvió incorporando un paso previo en el workflow que ejecuta `sql/01_init_schema.sql` contra el contenedor de servicio `postgres:16-alpine`.
- **Siguiente acción:**
  1. Actualizar la rama `main` local (`git pull origin main`) y crear una nueva rama para observabilidad.
  2. Acordar con Desarrollo las 3 métricas de negocio de M9 e implementar la instrumentación con OpenTelemetry + dashboard (Hito 2).

---

### Entrada 2 — 16/11/2026 (Hito 1 y avance de Hito 3: Propuesta de métricas y pruebas locales de k6 en Docker)

- **Fecha:** 16/11/2026
- **Responsable/s:** Equipo DevOps (Grupo 03)
- **Módulo:** M9 — Reservas de Viajes
- **Objetivo:** Formalizar la propuesta de métricas y flujo de carga para acordar con Desarrollo, e implementar y validar el entorno local de pruebas de carga con Grafana k6 en Docker.
- **Tarea ejecutada:**
  1. **Propuesta de métricas y escenario de carga:** Se elaboró el documento `Propuesta_Metricas_M9_DevOps.pdf` detallando las 3 métricas de negocio propuestas para M9 (`reservas.creadas.total`, `reservas.activaciones.total` / `reservas.activacion.duracion_ms`, `reservas.cancelaciones.total` / `reservas.modificaciones.total`), los indicadores técnicos complementarios y el flujo de 4 pasos para k6.
  2. **Entorno local de Grafana k6 en Docker:** Se creó la rama `devops/k6-local` incorporando:
     - `k6/jwks-mock.js`: servidor liviano en Node.js que emula el endpoint JWKS de Keycloak y emite tokens RS256 válidos para aislar las pruebas locales.
     - `k6/reservas-load.js`: script de carga que ejecuta el flujo completo (`GET /health` → `POST /reservas` → `GET /reservas/:id` → `POST /reservas/:id/cancelar`).
     - `docker-compose.k6.yml`: orquesta `db-k6` (PostgreSQL 16 con `sql/01_init_schema.sql`), `jwks-mock`, `api-k6` (con `USE_EXTERNAL_MOCKS="true"`) y `grafana/k6`.
  3. **Prueba de humo local (10 VUs · 15s):** Se ejecutó `docker compose -f docker-compose.k6.yml --profile run run --rm k6` obteniendo **1250/1250 checks exitosos (100%)**, **0.00% de errores** sobre 1010 requests (`65.56 req/s`), latencia promedio de `26.15 ms` y `p95 = 71.9 ms`.
- **Decisiones / acuerdos con Desarrollo:**
  - Enviar el documento de métricas al equipo de Desarrollo para su validación antes de instrumentar OpenTelemetry.
  - Utilizar `USE_EXTERNAL_MOCKS="true"` y un mock JWKS local para validar el rendimiento aislado de M9 sin depender de otros módulos ni de Keycloak externo en esta etapa.
- **Repositorio / Issue / PR:**
  - Rama: `devops/k6-local`
  - Archivos agregados: `k6/reservas-load.js`, `k6/jwks-mock.js`, `docker-compose.k6.yml`
  - PR / Issue: *[Pendiente: abrir PR hacia `main` y completar enlace]*
- **Evidencia (URL, captura o reporte):**
  - Salida local de Grafana k6 (10 VUs, 15s): `1250/1250` checks OK, `0.00%` `http_req_failed`, `65.56 req/s`, `avg=26.15ms`, `p95=71.9ms`.
- **Resultado:** Entorno local de k6 en Docker operativo y verificado al 100% sobre la API de M9.
- **Dificultad o bloqueo:** El middleware de autenticación (`src/middlewares/auth.ts`) exige JWT RS256 validado contra Keycloak JWKS; se resolvió agregando `k6/jwks-mock.js` en el compose de pruebas para generar claves RSA y firmar tokens en local.
- **Siguiente acción:**
  1. Confirmar las 3 métricas con el equipo de Desarrollo.
  2. Instrumentar OpenTelemetry + dashboard en plataforma APM (Hito 2) y preparar el despliegue cloud para los escenarios de 50, 100, 500 y 1000 VUs (Hito 3).

