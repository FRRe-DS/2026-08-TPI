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
  - Rama: `devops/ci-pipeline`
  - Archivo agregado: `.github/workflows/ci.yml`
  - PR / Issue: *[Completar con el enlace al Issue/PR una vez publicado en GitHub]*
- **Evidencia (URL, captura o reporte):**
  - *[Completar con el enlace a la ejecución en GitHub Actions y artifacts `jest-coverage` / `semgrep-sast-report` tras el push]*
- **Resultado:** Pipeline de CI y SAST configurado y listo para su validación en GitHub Actions mediante Pull Request.
- **Dificultad o bloqueo:** Los tests de integración se conectan a una instancia real de PostgreSQL pero no inicializan las tablas por sí mismos; se resolvió incorporando un paso previo en el workflow que ejecuta `sql/01_init_schema.sql` contra el contenedor de servicio `postgres:16-alpine`.
- **Siguiente acción:**
  1. Hacer push de `devops/ci-pipeline`, abrir el Pull Request hacia `main` y verificar la ejecución en GitHub Actions.
  2. Acordar con Desarrollo las 3 métricas de negocio de M9 y comenzar la instrumentación con OpenTelemetry + dashboard (Hito 2).

