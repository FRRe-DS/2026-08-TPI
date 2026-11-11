# Universidad Tecnológica Nacional — Facultad Regional Resistencia
## Cátedra de Desarrollo de Software (Ciclo Lectivo 2026 — 2° Cuatrimestre)
### Trabajo Práctico de Investigación y Aplicación de Conceptos de Ingeniería de Software

---

# INFORME FINAL DE INVESTIGACIÓN Y DEMOSTRACIÓN TÉCNICA INTEGRADA
## Ejes Temáticos Asignados:
* **Tema 11: Patrón Saga y Transacciones Distribuidas (Eje Consistencia)**
* **Tema 12: Base de Datos por Servicio y Propiedad de los Datos (Eje Persistencia)**

---

### **Información del Equipo de Trabajo:**
* **Grupo Asignado:** Grupo N° 8
* **Módulo Asignado en el Trabajo Práctico Integrador (TPI):** Módulo 9 (M9 — Reservas de Viajes)
* **Ecosistema del TPI:** Plataforma Distribuida de Movilidad Urbana y Transporte de Pasajeros
* **Nómina Oficial de Integrantes (10 Integrantes):**
  1. **Alcaraz, Fabricio Nahuel**
  2. **Benítez, Agustín Nicolás**
  3. **Fernández D'Elia, Sol**
  4. **López, Gustavo Javier**
  5. **López, Mateo Jeremías**
  6. **Machuca, Avril Micaela**
  7. **Maciel Sánchez, Gabriel Ángel**
  8. **Rosin, Gianna Florencia**
  9. **Salas, Milagros Nadir**
  10. **Sanabria Cayré, Ernesto Pablo**

---

## Tabla de Contenidos General

1. [Resumen Ejecutivo e Introducción](#1-resumen-ejecutivo-e-introducción)
   - 1.1. Contexto de la Evolución Arquitectónica: Del Monolito a los Microservicios
   - 1.2. El Gran Desafío Distribuido: Persistencia Fragmentada y Ruptura de ACID
   - 1.3. Articulación de los Dos Ejes de Investigación
   - 1.4. Objetivos y Alcance del Trabajo
2. [Sección I: Investigación Conceptual Exhaustiva](#2-sección-i-investigación-conceptual-exhaustiva)
   - 2.1. Eje Persistencia: Base de Datos por Servicio y Propiedad de los Datos (*Data Ownership*)
     - 2.1.1. El Antipatrón de la Base de Datos Compartida (*Shared Database*) y el "Monolito Distribuido"
     - 2.1.2. Definición Formal y Principios Fundamentales de *Database per Service*
     - 2.1.3. *Data Ownership* y Contextos Delimitados (*Bounded Contexts* de Eric Evans / DDD)
     - 2.1.4. Persistencia Políglota (*Polyglot Persistence*): Justificación y Clasificación Tecnológica
     - 2.1.5. Estrategias de Consulta Inter-Servicio: Composición de APIs, *Event-Carried State Transfer* y CQRS
     - 2.1.6. Beneficios, Limitaciones y Retos Operativos del Aislamiento de Persistencia
     - 2.1.7. Bajada a Tierra: La Analogía Cotidiana de la Propiedad de Datos
   - 2.2. Eje Consistencia: Patrón Saga y Transacciones Distribuidas
     - 2.2.1. El Colapso de las Transacciones ACID Clásicas en Sistemas Distribuidos
     - 2.2.2. El Teorema CAP (Brewer) y el Teorema PACELC en la Práctica
     - 2.2.3. Análisis Crítico y Limitaciones del Protocolo *Two-Phase Commit* (2PC / XA)
     - 2.2.4. Definición Formal del Patrón Saga: De Garcia-Molina y Salem (1987) a Chris Richardson
     - 2.2.5. Taxonomía Rigurosa de Transacciones en una Saga: Compensables ($T_c$), Pivotantes ($T_p$) y Reintentables ($T_r$)
     - 2.2.6. Consistencia Eventual y el Desafío de la Falta de Aislamiento (Anomalías y Técnicas de Mitigación)
     - 2.2.7. Estrategias de Coordinación: Coreografía (*Choreography*) vs. Orquestación (*Orchestration*)
     - 2.2.8. Bajada a Tierra: La Analogía Cotidiana del Patrón Saga
3. [Sección II: Relación y Aplicación con el Trabajo Práctico Integrador (TPI)](#3-sección-ii-relación-y-aplicación-con-el-trabajo-práctico-integrador-tpi)
   - 3.1. Ecosistema de Movilidad Urbana: Módulos, Responsabilidades y Contratos OpenAPI 3.0
   - 3.2. Módulo Asignado: M9 (Reservas de Viajes) y sus Requisitos Funcionales Clave
   - 3.3. Aplicación de *Database per Service* en M9: Aislamiento Físico y Ausencia de Claves Foráneas
   - 3.4. Aplicación de la Saga Orquestada en el Flujo Crítico de Activación y Despacho
     - 3.4.1. Mapeo Formal de Pasos: $T_1$, $T_2$, $T_3$, $T_r$
     - 3.4.2. Circuito de Rollback Lógico y Acciones Compensatorias Inversas: $C_2 \to C_1$
   - 3.5. Resiliencia, Idempotencia (RF-9.10), Auditoría Inmutable (RF-9.12) y Trazabilidad Distribuida
4. [Sección III: Criterios de Utilización y Análisis Crítico de Decisiones Técnicas](#4-sección-iii-criterios-de-utilización-y-análisis-crítico-de-decisiones-técnicas)
   - 4.1. Matriz de Decisión: Cuándo SÍ y Cuándo NO Utilizar Cada Patrón
   - 4.2. Evaluación Multidimensional de Factores de Ingeniería (Trade-offs)
     - 4.2.1. Complejidad Arquitectónica y Sobrecarga Cognitiva
     - 4.2.2. Costos de Infraestructura y Operación
     - 4.2.3. Rendimiento, Throughput y Latencia de Red
     - 4.2.4. Mantenibilidad y Radio de Explosión de Fallas (*Blast Radius*)
   - 4.3. Tabla Comparativa de Alternativas Tecnológicas (Monolito ACID vs. 2PC vs. Saga Coreografiada vs. Saga Orquestada)
5. [Sección IV: Implementación Práctica Integrada y Evidencias Técnicas de la Demo](#5-sección-iv-implementación-práctica-integrada-y-evidencias-técnicas-de-la-demo)
   - 5.1. Stack Tecnológico Elegido y Justificación de Ingeniería
   - 5.2. Arquitectura de Carpetas y Componentes del Código Fuente
   - 5.3. Modelo Físico de Persistencia Aislada (SQLite Nativo `node:sqlite`)
     - 5.3.1. Base de Datos Exclusiva de M9 (`data/m9_reservas.db`)
     - 5.3.2. Base de Datos Exclusiva de M7 (`data/m7_pagos.db`)
     - 5.3.3. Base de Datos Exclusiva de M5 (`data/m5_despacho.db`)
   - 5.4. Lógica del Orquestador de Saga (`ActivationSagaOrchestrator.ts`)
   - 5.5. Demostración Práctica: Análisis Paso a Paso de los Escenarios Ejecutados
     - 5.5.1. Escenario 1: Flujo Exitoso de Activación y Despacho ($T_1 \to T_2 \to T_3 \to T_r$)
     - 5.5.2. Escenario 2: Flujo con Falla en Pivotante y Compensación Inversa ($T_1 \to T_2 \to T_3[\text{Fallo}] \to C_2 \to C_1 \to T_r$)
     - 5.5.3. Evidencia 3: Auditoría Inmutable No Destructiva (`historial_reservas`)
     - 5.5.4. Evidencia 4: Idempotencia Estricta con `Idempotency-Key` (Deduplicación en 1 ms)
   - 5.6. Procedimiento de Ejecución y Pruebas Automatizadas (`npm run demo`, `npm run test:all`)
6. [Sección VI: Bibliografía y Referencias Académicas](#7-sección-vi-bibliografía-y-referencias-académicas)

---

# 1. Resumen Ejecutivo e Introducción

### 1.1. Contexto de la Evolución Arquitectónica: Del Monolito a los Microservicios
Durante décadas, el desarrollo de sistemas empresariales estuvo dominado por el paradigma arquitectónico monolítico. En este modelo, todos los módulos funcionales del negocio —autenticación, gestión de clientes, procesamiento de cobros, logística y notificaciones— coexisten dentro del mismo proceso en tiempo de ejecución y comparten un único motor de base de datos relacional. 

Si bien este enfoque simplifica las fases iniciales de desarrollo (otorgando un entorno unificado para depuración local, refactorizaciones y transacciones ACID inmediatas), a medida que las organizaciones y los sistemas crecen surgen barreras críticas:
* **Acoplamiento de despliegue:** Cualquier modificación mínima en un módulo periférico exige compilar, empaquetar y re-desplegar la totalidad del artefacto de software.
* **Falta de escalabilidad granular:** Si un componente particular (por ejemplo, el rastreo satelital o la cotización de tarifas) experimenta picos de demanda, debe escalarse la totalidad del monolito, incrementando exponencialmente los costos computacionales.
* **Monolito de datos:** Una base de datos compartida concentra toda la carga de transacciones, convirtiéndose en el cuello de botella central del sistema y en un punto único de falla (*Single Point of Failure - SPOF*).

Para resolver estas limitaciones, la industria del software adoptó de forma masiva la **Arquitectura de Microservicios**. En este paradigma, el sistema se descompone en un conjunto de servicios autónomos, modulares y débilmente acoplados, donde cada uno asume la responsabilidad exclusiva sobre un subdominio de negocio bien delimitado (*Bounded Context*). Los microservicios se despliegan de forma independiente, pueden ser desarrollados por equipos multidisciplinarios autónomos y se comunican entre sí a través de la red mediante protocolos estandarizados (HTTP/REST, gRPC) o mediante mensajería asíncrona basada en eventos (*Event-Driven Architecture*).

### 1.2. El Gran Desafío Distribuido: Persistencia Fragmentada y Ruptura de ACID
A pesar de las ventajas innegables en agilidad, tolerancia a fallos parciales y escalabilidad, la descentralización introduce una transformación drástica en la capa de persistencia y en las garantías transaccionales:
1. **Pérdida de la base de datos única:** Para que un microservicio sea verdaderamente autónomo, no puede depender del esquema relacional ni del motor de datos de otro componente. Por lo tanto, el almacenamiento debe fragmentarse físicamente, otorgando a cada microservicio una base de datos privada (*Database per Service*).
2. **Imposibilidad de Transacciones ACID Globales:** En un monolito, la integridad transaccional entre múltiples entidades se resuelve trivialmente abriendo una transacción atómica local:
   $$\text{BEGIN TRANSACTION} \longrightarrow \text{INSERT/UPDATE} \longrightarrow \text{COMMIT}$$
   Si un paso falla, el motor ejecuta un `ROLLBACK` y el sistema regresa a su estado anterior. En cambio, cuando los datos residen en servidores de bases de datos físicamente separados a través de una red no confiable, **la primitiva de un COMMIT atómico universal desaparece**.

### 1.3. Articulación de los Dos Ejes de Investigación
El presente trabajo de investigación aborda de forma profunda y coordinada los dos pilares técnicos que resuelven esta problemática:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA DISTRIBUIDA RESILIENTE                             │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│ EJE PERSISTENCIA (Tema 12)                │ EJE CONSISTENCIA (Tema 11)                 │
│ "Database per Service & Data Ownership"   │ "Patrón Saga & Transacciones Distribuidas" │
├───────────────────────────────────────────┼────────────────────────────────────────────┤
│ • Aislamiento físico de datos.            │ • Secuencia de transacciones locales.      │
│ • Prohibición de accesos SQL directos.    │ • Reversión mediante compensaciones (C_k). │
│ • Contratos públicos e inmutables.        │ • Máquina de estados y orquestación.       │
│ • Persistencia políglota y DDD.           │ • Consistencia Eventual y resiliencia.     │
└───────────────────────────────────────────┴────────────────────────────────────────────┘
```

Ambos patrones representan dos caras de la misma moneda de ingeniería:
* **El patrón Database per Service (Tema 12) destruye las transacciones ACID distribuidas** para maximizar la autonomía de los equipos, el aislamiento de fallas y la escalabilidad de almacenamiento.
* **El patrón Saga (Tema 11) restituye la consistencia del negocio** mediante una secuencia coordinada de transacciones locales y rollbacks semánticos (acciones compensatorias), garantizando que el sistema converja eventualmente a un estado coherente sin bloquear recursos.

### 1.4. Objetivos y Alcance del Trabajo
Los objetivos formales del presente trabajo son:
1. **Fundamentación Teórica Rigurosa:** Investigar los principios conceptuales, matemáticos y formales de ambos temas utilizando bibliografía académica e industrial confiable (Garcia-Molina & Salem, Eric Evans, Martin Fowler, Sam Newman, Chris Richardson).
2. **Vinculación con el Trabajo Práctico Integrador (TPI):** Demostrar cómo se aplican ambos patrones en la **plataforma distribuida de movilidad urbana** de la asignatura, focalizándose en el **Módulo 9 (M9 — Reservas de Viajes)** y su interacción con los módulos de Clientes (M2), Despacho (M5), Tarifas/Pagos (M7) y Notificaciones (M8).
3. **Análisis Crítico de Decisiones de Diseño:** Justificar exhaustivamente cuándo es conveniente aplicar cada patrón y cuándo debe evitarse, evaluando trade-offs en rendimiento, latencia, costos operativos, mantenibilidad y complejidad cognitiva.
4. **Implementación Práctica Integrada:** Documentar y analizar la solución funcional implementada por el Grupo 8 en Node.js v24 y TypeScript 5, la cual simula el aislamiento físico de 3 motores SQLite independientes (`data/m9_reservas.db`, `data/m7_pagos.db`, `data/m5_despacho.db`) y ejecuta un Orquestador de Saga capaz de resolver tanto flujos exitosos como compensaciones automáticas ante fallas de matching de conductores, respaldado por auditoría inmutable e idempotencia estricta.

---

# 2. Sección I: Investigación Conceptual Exhaustiva

## 2.1. Eje Persistencia: Base de Datos por Servicio y Propiedad de los Datos (*Data Ownership*)

### 2.1.1. El Antipatrón de la Base de Datos Compartida (*Shared Database*) y el "Monolito Distribuido"
En muchas organizaciones que intentan adoptar microservicios, el equipo de desarrollo divide la capa de código en múltiples contenedores o procesos, pero mantiene todas las aplicaciones conectadas a un único motor de base de datos relacional centralizado. A este enfoque se lo conoce en la literatura como el antipatrón de la **Base de Datos Compartida** (*Shared Database*), el cual genera un **Monolito Distribuido**: la peor combinación posible, pues suma la complejidad operativa de la red a la rigidez del monolito.

```
       ANTIPATRÓN: BASE DE DATOS COMPARTIDA (SHARED DATABASE)
   
     [ Microservicio A ]     [ Microservicio B ]     [ Microservicio C ]
             │                       │                       │
             │ (SQL SELECT/JOIN)     │ (SQL UPDATE)          │ (SQL ALTER)
             ▼                       ▼                       ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │          BASE DE DATOS RELACIONAL ÚNICA Y COMPARTIDA            │
    │  • Acoplamiento férreo de esquemas.                             │
    │  • Bloqueos cruzados y efecto "Vecindario Ruidoso".             │
    │  • Ruptura del principio de despliegue independiente.           │
    │  • Punto Único de Falla (SPOF) en toda la organización.        │
    └─────────────────────────────────────────────────────────────────┘
```

Las consecuencias destructivas de este antipatrón son:
1. **Acoplamiento Férreo de Esquemas:** Si el equipo responsable del Microservicio A decide modificar el tipo de dato de una columna o renombrar una tabla para satisfacer una nueva regla de negocio, puede romper de manera silenciosa e impredecible las consultas ejecutadas por los Microservicios B y C. Esto anula la autonomía de desarrollo y obliga a coordinar despliegues sincronizados entre equipos.
2. **Contención de Recursos y Bloqueos Cruzados:** Consultas analíticas pesadas, reportes mensuales o transacciones mal indexadas disparadas por un microservicio secundario pueden bloquear tablas compartidas, agotando el pool de conexiones y degradando el rendimiento de los servicios transaccionales críticos.
3. **Efecto del Vecindario Ruidoso (*Noisy Neighbor*):** El consumo excesivo de memoria, CPU o I/O de disco por parte de un servicio monopoliza los recursos del servidor de base de datos, perjudicando la disponibilidad global de la plataforma.
4. **Punto Único de Falla Global:** Si el servidor de base de datos sufre una caída de hardware, corrupción de datos o saturación de red, toda la plataforma queda fuera de servicio simultáneamente.

### 2.1.2. Definición Formal y Principios Fundamentales de *Database per Service*
Para superar estas limitaciones, Sam Newman (*Building Microservices*, 2021) y Chris Richardson (*Microservices Patterns*, 2018) formalizaron el patrón **Database per Service** (Base de Datos por Servicio):

> *"Cada microservicio debe poseer su propio almacén de datos persistente. Ningún otro servicio tiene permitido conectarse directamente al repositorio interno de otro mediante sentencias SQL, consultas o drivers directos. Toda interacción con los datos debe realizarse exclusivamente a través de los contratos públicos de la API del servicio dueño."*

```
          PATRÓN CORRECTO: DATABASE PER SERVICE & DATA OWNERSHIP
   
     [ Microservicio A ]                      [ Microservicio B ]
             │                                        │
             │ (API Privada / Repositorio)            │ (API Privada / Repositorio)
             ▼                                        ▼
    ┌─────────────────┐                      ┌─────────────────┐
    │  BD Privada A   │                      │  BD Privada B   │
    │ (PostgreSQL)    │                      │ (Redis / NoSQL) │
    └─────────────────┘                      └─────────────────┘
             ▲                                        ▲
             └──────────────── ❌ PROHIBIDO ──────────┘
                         (JOIN / SELECT Directo)
```

Este patrón se rige por tres postulados fundamentales:
1. **Encapsulamiento y Ocultamiento de la Información:** El esquema físico, las tablas, las claves primarias, los índices y los procedimientos almacenados constituyen un detalle de implementación interno del microservicio.
2. **Interacción Exclusiva por Contratos de Integración:** Las aplicaciones externas solo pueden consultar o mutar información invocando endpoints REST, interfaces gRPC o consumiendo eventos asíncronos publicados por el microservicio dueño de los datos.
3. **Independencia del Ciclo de Vida y Despliegue:** El equipo propietario de un servicio tiene plena libertad para aplicar migraciones de esquema, optimizar índices, cambiar el ORM o refactorizar tablas sin requerir autorización ni sincronización con otros equipos.

### 2.1.3. *Data Ownership* y Contextos Delimitados (*Bounded Contexts* de Eric Evans / DDD)
El fundamento teórico más sólido del patrón reside en el **Diseño Guiado por el Dominio** (*Domain-Driven Design - DDD*), introducido por Eric Evans (2003). Evans demostró que en sistemas complejos no existe un "Modelo de Datos Único Universal" que satisfaga adecuadamente a toda la organización.

En su lugar, el dominio se divide en **Contextos Delimitados (*Bounded Contexts*)**, donde cada término posee un significado inequívoco y un modelo de datos optimizado para su propósito:
* En el contexto de **Clientes (M2)**, un "Usuario" es una entidad con credenciales de acceso, métodos de pago, historial crediticio y estado de habilitación.
* En el contexto de **Despacho (M5)**, un "Usuario" es simplemente una coordenada de geolocalización de recogida ($lat, lon$).
* En el contexto de **Reservas (M9)**, el cliente se representa exclusivamente mediante un identificador escalar (`cliente_id: UUID`), prescindiendo de los detalles personales o financieros.

El principio de **Propiedad de los Datos (*Data Ownership*)** garantiza que cada Bounded Context mantenga la soberanía sobre sus entidades de negocio, evitando que entidades gigantescas y sobrecargadas contaminen la arquitectura.

### 2.1.4. Persistencia Políglota (*Polyglot Persistence*): Justificación y Clasificación Tecnológica
Uno de los mayores beneficios de la base de datos por servicio es la **Persistencia Políglota** (*Polyglot Persistence*): la capacidad de seleccionar el motor de almacenamiento cuya estructura interna y características de rendimiento mejor resuelvan el problema específico de cada microservicio:

| Paradigma de BD | Tecnologías Ejemplares | Casos de Uso en Arquitecturas Distribuidas | Módulo Ejemplar en Movilidad Urbana |
| :--- | :--- | :--- | :--- |
| **Relacional (RDBMS / SQL)** | PostgreSQL, MySQL, CockroachDB | Consistencia transaccional ACID local, integridad referencial interna, estados financieros y reservas. | M9 (Reservas), M7 (Pagos/Tarifas) |
| **Documental (NoSQL)** | MongoDB, Couchbase, Amazon DocumentDB | Esquemas dinámicos, documentos jerárquicos desnormalizados, catálogo de promociones y perfiles. | M2 (Clientes / Preferencias) |
| **En Memoria / Clave-Valor** | Redis, Dragonfly, Memcached | Caché distribuido de ultra baja latencia, tokens de sesión y ventanas temporales de geolocalización. | M4 (Ubicación / Geocaché) |
| **Series Temporales (Time-Series)** | TimescaleDB, InfluxDB, Prometheus | Ingesta masiva y continua de telemetría de odómetro, tracking GPS y velocidades. | M6 (Viajes / Telemetría vehicular) |
| **Orientadas a Grafos** | Neo4j, Amazon Neptune | Relaciones complejas de redes viales, conectividad topológica y detección de fraudes en anillos. | M4 (Rutas / Topología de red) |

### 2.1.5. Estrategias de Consulta Inter-Servicio: Composición de APIs, *Event-Carried State Transfer* y CQRS
Al eliminar la posibilidad de ejecutar sentencias `JOIN` a nivel de base de datos relacional, ¿cómo resuelve un sistema distribuido los escenarios donde una pantalla de usuario o un reporte requiere combinar datos de múltiples servicios? La literatura técnica establece tres patrones arquitectónicos:

1. **Composición de API (*API Composition*):**
   Un componente especializado (que puede ser un servicio agregador o un *API Gateway*) recibe la solicitud del cliente, ejecuta consultas en paralelo o secuenciales contra las APIs REST/gRPC de los servicios dueños y fusiona las respuestas en memoria dentro de un DTO compuesto.
   * *Ventaja:* Sencillo de implementar, sin replicación de datos.
   * *Desventaja:* Penalización en latencia de red (múltiples saltos HTTP) y menor disponibilidad (si un servicio consultado falla, la composición puede degradarse).

2. **Transferencia de Estado Guiada por Eventos (*Event-Carried State Transfer - ECST*):**
   Los servicios que modifican entidades publican eventos ricos en información (por ejemplo, `ConductorHabilitadoEvent { conductorId, nombre, calificacion }`). Los servicios consumidores escuchan estos eventos y mantienen una copia local de sólo lectura con los atributos estrictamente necesarios para su operación.
   * *Ventaja:* Consultas locales ultrarrápidas sin llamadas de red síncronas.
   * *Desventaja:* Duplicación de datos y consistencia eventual entre la fuente original y las réplicas.

3. **Segregación de Responsabilidades de Consulta y Comando (*CQRS - Command Query Responsibility Segregation*):**
   Formalizado por Greg Young y Martin Fowler, este patrón separa el modelo de escritura (optimizado para transacciones locales y validaciones de negocio en cada microservicio) del modelo de lectura. A través de flujos asíncronos de eventos (impulsados por Kafka o Debezium con *Change Data Capture*), se alimenta una base de datos centralizada de lectura (como Elasticsearch o una vista materializada relacional) diseñada exclusivamente para responder consultas y reportes complejos de alta velocidad.

### 2.1.6. Beneficios, Limitaciones y Retos Operativos del Aislamiento de Persistencia

#### Beneficios Clave:
* **Autonomía Absoluta de Equipos:** Permite la integración continua y el despliegue continuo (CI/CD) sin fricciones inter-departamentales.
* **Aislamiento de Fallas (*Fault Isolation*):** La saturación o caída de la base de un servicio periférico no arrastra al resto del sistema.
* **Escalabilidad Elástica e Independiente:** Permite asignar recursos computacionales (CPU, memoria, IOPS de disco) únicamente a los repositorios que experimentan alta demanda.

#### Limitaciones y Desafíos Operativos:
* **Sobrecarga de Infraestructura:** Administrar, monitorear, respaldar y securizar decenas de bases de datos individuales incrementa los costos operativos y exige herramientas avanzadas de observabilidad.
* **Pérdida de Integridad Referencial Física:** El motor de base de datos ya no puede verificar la existencia de un registro foráneo mediante `REFERENCES`. La integridad referencial debe ser garantizada por la lógica de la aplicación o por eventos de dominio.
* **Eliminación de Transacciones Atómicas Globales:** Impide la ejecución de transacciones ACID distribuidas convencionales, obligando a implementar patrones de consistencia eventual como la **Saga**.

### 2.1.7. Bajada a Tierra: La Analogía Cotidiana de la Propiedad de Datos
> *"Pensemos en los departamentos de un edificio de propiedad horizontal. Cada vecino tiene su propia vivienda, su propia llave y su propia alacena privada. Si un vecino necesita un poco de azúcar para cocinar, no agarra una ganzúa para forzar la cerradura de tu puerta y ponerse a revisar tus cajones mientras dormís (hacer eso sería el equivalente a ejecutar un `SELECT *` arbitrario en la base de datos de otro microservicio).*
> 
> *Lo que hace el vecino educado es pararse en el pasillo, tocar el timbre en tu puerta (invocar la API REST pública del servicio) y pedir: '¿Me facilitás una taza de azúcar?'. Vos vas a tu cocina, buscás el azúcar en el frasco que más te convenga y se la entregás en la mano. El vecino no tiene la menor idea de si guardás el azúcar en un pote de vidrio, en una caja de cartón o si ayer decidiste reorganizar toda la cocina (cambio de esquema interno). La puerta y el timbre son el único contrato que importa."*

---

## 2.2. Eje Consistencia: Patrón Saga y Transacciones Distribuidas

### 2.2.1. El Colapso de las Transacciones ACID Clásicas en Sistemas Distribuidos
En las arquitecturas centralizadas, la coherencia de la información reposa en las cuatro propiedades **ACID**:
* **Atomicidad:** Todas las mutaciones de la transacción se ejecutan con éxito o ninguna se aplica.
* **Consistencia:** La transacción traslada a la base de datos de un estado válido a otro, preservando invariantes e integridad relacional.
* **Aislamiento (*Isolation*):** Las operaciones concurrentes no interfieren entre sí ni visualizan estados intermedios.
* **Durabilidad:** Una vez que la transacción hace `COMMIT`, los cambios persisten de manera irreversible ante cualquier corte de energía.

Cuando las operaciones cruzan múltiples microservicios con bases de datos físicamente distribuidas a través de una red, estas garantías colapsan. No existe un reloj global unificado ni una memoria compartida, y la red es intrínsecamente falible: sufre retardos variables, reordenamiento de paquetes, particiones de conectividad y caídas transitorias (las conocidas *Falacias de la Computación Distribuida* formuladas por L. Peter Deutsch).

### 2.2.2. El Teorema CAP (Brewer) y el Teorema PACELC en la Práctica
El **Teorema CAP**, formalizado por Eric Brewer y demostrado rigurosamente por Seth Gilbert y Nancy Lynch (2002), estipula que en cualquier sistema de datos distribuido es imposible garantizar simultáneamente más de dos de las siguientes tres propiedades frente a un incidente de red:
1. **Consistencia (C):** Cada operación de lectura devuelve la escritura más reciente o un error.
2. **Disponibilidad (A):** Cada petición que no falle recibe una respuesta no errónea, aunque no garantice contener la escritura más reciente.
3. **Tolerancia a Particiones (P):** El sistema continúa operando a pesar de la pérdida o retraso arbitrario de mensajes en la red.

Dado que en las redes físicas reales las particiones (P) son inevitables debido a fluctuaciones de hardware, switches, enlaces satelitales o caídas de enlaces, **los arquitectos de software se ven forzados a elegir entre Consistencia Estricta (CP) o Alta Disponibilidad (AP)**.

Para complementar esta visión en regímenes de operación normal (sin fallas de red), Daniel Abadi formuló el modelo **PACELC**:
$$\text{Si hay Partición (P), elegir entre Disponibilidad (A) o Consistencia (C); ELSE (E), elegir entre Latencia (L) o Consistencia (C)}.$$

En aplicaciones masivas de movilidad urbana (como la plataforma del TPI), optar por la consistencia estricta instantánea degradaría la disponibilidad y elevaría la latencia a niveles inaceptables para los usuarios móviles. Por ello, la arquitectura debe abrazar la **Consistencia Eventual** (*Eventual Consistency*).

### 2.2.3. Análisis Crítico y Limitaciones del Protocolo *Two-Phase Commit* (2PC / XA)
Durante años, el estándar para transacciones distribuidas fue el protocolo **Two-Phase Commit (2PC)** y las especificaciones XA:
* **Fase 1 (Preparación):** Un coordinador central envía un mensaje `PREPARE` a todos los nodos participantes. Cada nodo adquiere bloqueos de lectura/escritura en sus tablas locales, escribe en su log transaccional y responde `READY`.
* **Fase 2 (Confirmación):** Si todos respondieron afirmativamente, el coordinador emite `COMMIT`. Si al menos uno falló o no respondió a tiempo, el coordinador emite `ABORT` a todos.

```
       PROTOCOLO TWO-PHASE COMMIT (2PC) - PROTOCOLO DE BLOQUEO
   
     [ Coordinador 2PC ]
       │            │
       │ (1. PREPARE)
       ▼            ▼
   [ Nodo A ]   [ Nodo B ]  <── Bloquean registros y retienen conexiones
       │            │            hasta que el coordinador responda.
       │ (READY)    │ (READY)
       ▼            ▼
     [ Coordinador 2PC ]
       │            │
       │ (2. COMMIT)│
       ▼            ▼
   [ Nodo A ]   [ Nodo B ]  <── Liberan bloqueos.
   
   ⚠️ CRÍTICA EN MICROSERVICIOS:
   • Si el Coordinador cae entre Fase 1 y 2 -> Los nodos quedan "In-Doubt" bloqueados.
   • Incompatible con APIs externas (Stripe, Twilio, WhatsApp).
   • Latencia prohibitiva y nula escalabilidad horizontal.
```

A pesar de su elegancia teórica, el 2PC es ampliamente desaconsejado en arquitecturas de microservicios modernas por las siguientes razones:
1. **Protocolo de Bloqueo Síncrono (*Blocking Protocol*):** Mientras dura el intercambio de red, los registros en las bases de datos de todos los participantes quedan retenidos con candados exclusivos. Si la latencia de red se incrementa, el *throughput* del sistema se desploma en picada.
2. **Punto Único de Falla y Estado de Incertidumbre (*In-Doubt State*):** Si el coordinador colapsa luego de que los participantes votaron `READY` pero antes de enviar el comando `COMMIT`, los nodos participantes quedan bloqueados indefinidamente sin poder abortar ni confirmar localmente.
3. **Incompatibilidad con el Ecosistema Moderno:** Una pasarela de pago como Mercado Pago o Stripe, o una API de mensajería como Twilio, no implementan la interfaz XA ni permiten que un sistema externo mantenga una transacción abierta en sus servidores.

### 2.2.4. Definición Formal del Patrón Saga: De Garcia-Molina y Salem (1987) a Chris Richardson
Para solucionar el problema de las transacciones de larga duración (*Long-Lived Transactions - LLT*), Hector Garcia-Molina y Kenneth Salem publicaron en 1987 un trabajo seminal en el simposio ACM SIGMOD titulado *"Sagas"*. Décadas más tarde, Chris Richardson (*Microservices Patterns*, 2018) adaptó y popularizó este concepto para la arquitectura de microservicios.

Una **Saga** es una secuencia de **transacciones locales**:
$$S = \{T_1, T_2, T_3, \dots, T_n\}$$

Donde cada transacción $T_i$ actualiza la base de datos privada de un único microservicio mediante un commit ACID local inmediato y dispara la ejecución del paso siguiente (mediante la invocación de un comando o la publicación de un evento de dominio).

Si en cualquier punto de la secuencia una transacción local $T_k$ fracasa debido a una violación de reglas de negocio, falta de recursos o caída técnica, la Saga no puede realizar un `ROLLBACK` de base de datos tradicional, porque las transacciones anteriores ($T_1, \dots, T_{k-1}$) ya realizaron un commit definitivo en sus respectivos esquemas.

En su lugar, la Saga garantiza la consistencia del sistema ejecutando una secuencia ordenada de **Transacciones Compensatorias**:
$$C = \{C_{k-1}, C_{k-2}, \dots, C_1\}$$

Donde cada acción compensatoria $C_i$ aplica un **rollback semántico**: una operación de negocio con efecto inverso que neutraliza los cambios provocados por la transacción $T_i$.

```
FLUJO EXITOSO DE UNA SAGA:
  T1 (Local) ───► T2 (Compensable) ───► T3 (Pivotante) ───► Tr (Reintentable) ───► FIN EXITOSO

FLUJO CON FALLO EN PIVOTANTE Y COMPENSACIÓN INVERSA:
  T1 (Local) ───► T2 (Compensable) ───► T3 [FALLO]
                                           │
                                           ▼ (Disparo del Rollback Lógico)
  C1 (Compensado) ◄── C2 (Compensado) ◄────┘
```

### 2.2.5. Taxonomía Rigurosa de Transacciones en una Saga: Compensables ($T_c$), Pivotantes ($T_p$) y Reintentables ($T_r$)
Chris Richardson estableció una clasificación formal de las transacciones dentro de una Saga, la cual resulta indispensable para estructurar flujos consistentes:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                    TAXONOMÍA FORMAL DE TRANSACCIONES EN UNA SAGA                       │
├─────────────────────┬──────────────┬───────────────────────────────────────────────────┤
│ Tipo de Transacción │ Símbolo      │ Comportamiento y Rol en el Flujo                  │
├─────────────────────┼──────────────┼───────────────────────────────────────────────────┤
│ Transacciones       │ $T_c$        │ Transacciones que ocurren ANTES de la pivotante.  │
│ Compensables        │              │ Pueden deshacerse semánticamente ejecutando una   │
│                     │              │ acción compensatoria $C_i$ si la saga falla luego.│
├─────────────────────┼──────────────┼───────────────────────────────────────────────────┤
│ Transacción         │ $T_p$        │ Es el PUNTO DE NO RETORNO de la Saga.             │
│ Pivotante           │              │ • Si $T_p$ tiene éxito, la Saga culminará sí o sí.│
│                     │              │ • Si $T_p$ fracasa, la Saga aborta y ejecuta      │
│                     │              │   las compensaciones $\{C_{k-1}, \dots, C_1\}$.   │
├─────────────────────┼──────────────┼───────────────────────────────────────────────────┤
│ Transacciones       │ $T_r$        │ Ocurren DESPUÉS de la transacción pivotante.      │
│ Reintentables       │              │ Tienen garantía de éxito eventual. Si fallan por  │
│                     │              │ red, se reintentan hasta completarse con éxito.   │
└─────────────────────┴──────────────┴───────────────────────────────────────────────────┘
```

### 2.2.6. Consistencia Eventual y el Desafío de la Falta de Aislamiento (Anomalías y Técnicas de Mitigación)
El mayor costo teórico de una Saga es la **ausencia de Aislamiento** (la letra 'I' de ACID). Debido a que cada transacción local $T_i$ hace un commit inmediato y visible en su base de datos, otros procesos concurrentes del sistema pueden leer datos generados por una Saga que todavía no finalizó y que potencialmente podría terminar en compensación.

Esto expone al sistema a anomalías clásicas de concurrencia:
* **Lecturas Sucias (*Dirty Reads*):** Un microservicio lee un registro actualizado por $T_1$, pero la transacción $T_2$ fracasa y $T_1$ es compensada por $C_1$, dejando al lector con datos ficticios.
* **Actualizaciones Perdidas (*Lost Updates*):** Dos sagas concurrentes actualizan el mismo registro sin sincronización, y la compensación de una de ellas sobreescribe ciegamente los cambios válidos de la otra.

Para blindar el sistema contra estas anomalías, los arquitectos aplican patrones de contramedidas:
1. **Bandera Semántica de Estado (*Semantic Lock*):** Los registros modificados se marcan explícitamente con estados intermedios temporales (por ejemplo, `EN_PROCESO_DESPACHO` o `PENDIENTE_PAGO`). Cualquier otro flujo concurrente que intente operar sobre el registro detecta el estado transitorio y espera o rechaza la solicitud.
2. **Actualizaciones Pesimistas / Conmutativas:** Diseñar las operaciones de forma que el orden de ejecución no altere el resultado final (ejecutar débitos y créditos en cuentas auxiliares).
3. **Auditoría Inmutable (*Append-Only History*):** En lugar de sobreescribir destructivamente filas en una tabla, cada transición de la Saga se graba como un evento inmutable en un historial cronológico.

### 2.2.7. Estrategias de Coordinación: Coreografía (*Choreography*) vs. Orquestación (*Orchestration*)
Existen dos formas fundamentales de implementar y coordinar una Saga:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        COREOGRAFÍA vs. ORQUESTACIÓN DE SAGAS                           │
├───────────────────────┬────────────────────────────┬───────────────────────────────────┤
│ Criterio de Análisis  │ Saga Coreografiada         │ Saga Orquestada                   │
├───────────────────────┼────────────────────────────┼───────────────────────────────────┤
│ **Mecanismo**         │ Descentralizado. Cada      │ Centralizado. Un componente       │
│                       │ servicio publica y escucha │ coordinador (*Saga Coordinator*)  │
│                       │ eventos reactivamente.     │ envía comandos a los servicios.   │
├───────────────────────┼────────────────────────────┼───────────────────────────────────┤
│ **Acoplamiento**      │ Bajo acoplamiento a nivel  │ Los participantes desconocen la   │
│                       │ de transporte, pero alto   │ existencia de la Saga; sólo       │
│                       │ acoplamiento semántico.    │ exponen APIs / contratos limpios. │
├───────────────────────┼────────────────────────────┼───────────────────────────────────┤
│ **Visibilidad del     │ Dispersa entre múltiples   │ Totalmente centralizada en una    │
│ Flujo**               │ manejadores de eventos.    │ máquina de estados explícita.     │
├───────────────────────┼────────────────────────────┼───────────────────────────────────┤
│ **Depuración /        │ Muy compleja. Rastrear un  │ Simple y predecible. El estado se │
│ Observabilidad**      │ fallo requiere correlar    │ consulta en un único componente.  │
│                       │ múltiples colas de log.    │                                   │
├───────────────────────┼────────────────────────────┼───────────────────────────────────┤
│ **Riesgo Principal**  │ Dependencias cíclicas de   │ Tendencia a sobrecargar de lógica │
│                       │ eventos ("infierno de      │ al orquestador (*God Object*).    │
│                       │ mensajes").                │                                   │
├───────────────────────┼────────────────────────────┼───────────────────────────────────┤
│ **Escenario Óptimo**  │ Flujos sencillos lineales  │ Procesos de negocio complejos, con│
│                       │ de 2 o 3 participantes.    │ múltiples validaciones y reglas.  │
└───────────────────────┴────────────────────────────┴───────────────────────────────────┘
```

### 2.2.8. Bajada a Tierra: La Analogía Cotidiana del Patrón Saga
> *"Imaginemos que queremos organizar unas vacaciones familiares por nuestra cuenta: necesitamos reservar el hotel en la montaña, comprar los pasajes de avión y alquilar un vehículo en el aeropuerto de destino.*
> 
> *En un mundo monolítico ideal con transacciones ACID, existiría un operador mágico que congelaría el tiempo en todo el planeta: si el alquiler del auto se queda sin stock en el último segundo, el tiempo vuelve atrás instantáneamente y es como si nunca hubieras intentado hacer nada.*
> 
> *En el mundo real (que es distribuido), hacés las cosas paso a paso: primero entrás al sitio de la aerolínea y pagás los pasajes (transacción local $T_1$ confirmada). Luego reservás la cabaña (transacción local $T_2$ confirmada). Pero cuando vas a la rentadora de autos, te avisan que no hay vehículos disponibles (fallo en la transacción pivotante $T_3$).*
> 
> *No podés 'deshacer el universo' mágicamente con un chasquido de dedos. Lo que hacés es ejecutar acciones compensatorias: llamás a la cabaña para cancelar la reserva (acción compensatoria $C_2$) y solicitás a la aerolínea la devolución del dinero del pasaje o la cancelación del vuelo (acción compensatoria $C_1$). Cada participante vuelve a quedar en un estado coherente. Eso es exactamente una Saga: hacer las cosas paso a paso y tener previsto el protocolo exacto para disculparse y compensar lo hecho si algún eslabón crítico se rompe."*

---

# 3. Sección II: Relación y Aplicación con el Trabajo Práctico Integrador (TPI)

## 3.1. Ecosistema de Movilidad Urbana: Módulos, Responsabilidades y Contratos OpenAPI 3.0
La plataforma distribuida de transporte y movilidad urbana desarrollada a lo largo del Trabajo Práctico Integrador de la asignatura se descompone en 9 módulos o microservicios autónomos, cuyos límites funcionales fueron definidos respetando el Diseño Guiado por el Dominio (DDD):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│              ECOSISTEMA DISTRIBUIDO DEL TPI (MOVILIDAD URBANA - 9 MÓDULOS)             │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • M1: Autenticación, Usuarios y Seguridad Centralizada                                 │
│ • M2: Gestión de Clientes / Pasajeros (Identidad, Estado de Cuenta y Bloqueos)         │
│ • M3: Gestión de Conductores (Padrón, Vehículos, Documentación y Calificaciones)       │
│ • M4: Ubicación, Cobertura y Ruteo Geoespacial (Distancias y Límites Operativos)       │
│ • M5: Solicitud y Despacho en Tiempo Real (Matching entre Pasajeros y Choferes)        │
│ • M6: Ejecución y Monitoreo de Viajes en Curso (Odómetro, GPS y Tarifas Reales)        │
│ • M7: Gestión Financiera, Tarifas y Cobros (Tarifas Dinámicas y Pre-autorizaciones)    │
│ • M8: Notificaciones y Comunicaciones Multicanal (Push, SMS, Correo Electrónico)      │
│ • M9: Reservas Anticipadas de Viajes (Ciclo de Vida de Viajes Programados)             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

La integración técnica entre los microservicios se materializa a través de contratos formales basados en la especificación **OpenAPI 3.0**, asegurando que cada módulo exponga exclusivamente sus endpoints REST con esquemas JSON inmutables.

## 3.2. Módulo Asignado: M9 (Reservas de Viajes) y sus Requisitos Funcionales Clave
Al **Grupo 8** le correspondió la titularidad del **Módulo 9 (M9 — Reservas de Viajes)**. La misión de negocio de M9 es gestionar las solicitudes de viajes que los pasajeros programan con antelación temporal.

Sus requerimientos funcionales más exigentes incluyen:
* **RF-9.6 (Ventana Temporal de Antelación Mínima):** Las reservas solo pueden crearse con al menos 2 horas de anticipación respecto al horario fijado para el viaje.
* **RF-9.7 (Ciclo de Vida de Estados de la Reserva):** La reserva evoluciona a través de los estados:
  $$\text{PENDIENTE} \longrightarrow \text{CONFIRMADA} \longrightarrow \text{EN\_PROCESO\_DESPACHO} \longrightarrow \text{ACTIVADA} \ (\text{o } \text{VENCIDA} / \text{CANCELADA})$$
* **RF-9.10 (Garantía de Idempotencia):** Toda mutación crítica de estado debe soportar la recepción de la cabecera HTTP `Idempotency-Key`, evitando efectos colaterales ante reintentos de red.
* **RF-9.12 (Auditoría Histórica No Destructiva):** Cada cambio de estado debe registrarse de manera inmutable en una tabla de auditoría cronológica, almacenando estado anterior, estado nuevo, actor responsable, motivo y marca temporal.

## 3.3. Aplicación de *Database per Service* en M9: Aislamiento Físico y Ausencia de Claves Foráneas
En cumplimiento estricto del patrón Database per Service, M9 posee la propiedad absoluta sobre su almacenamiento persistente.

### Aislamiento de Esquema y Almacenamiento:
En nuestra implementación, M9 gestiona exclusivamente tres tablas dentro de su repositorio privado (`data/m9_reservas.db`):
1. `reservas`: contiene los datos del viaje programado (`id`, `cliente_id`, `origen`, `destino`, `tarifa_estimada`, `estado`, `solicitud_despacho_id`, `conductor_id`, `clave_idempotencia`, `creado_en`, `actualizado_en`).
2. `historial_reservas`: registro de auditoría append-only para trazabilidad no destructiva (RF-9.12).
3. `idempotencia`: almacena el hash de la clave de idempotencia, el código de estado HTTP y el cuerpo de respuesta ya procesado (RF-9.10).

### Prohibición Explícita de Claves Foráneas (*Foreign Keys*):
A diferencia de un diseño monolítico relacional tradicional, la tabla `reservas` **no contiene ninguna Foreign Key** hacia otros módulos:
* El campo `cliente_id TEXT NOT NULL` almacena un escalar de tipo UUID; no existe un `REFERENCES m2_clientes(id)`.
* El campo `conductor_id TEXT` almacena el UUID del chofer; no existe un `REFERENCES m3_conductores(id)` ni `REFERENCES m5_conductores(id)`.

Si M9 necesita validar si un cliente está habilitado para programar un viaje, no ejecuta un `SELECT` sobre tablas ajenas. En su lugar, consume el cliente desacoplado `M2Client.verificarEstadoCuenta(clienteId)`, invocando el endpoint REST `/clientes/:id/estado` del Módulo 2. Si el equipo del Módulo 2 decide migrar sus tablas de PostgreSQL a MongoDB o renombrar columnas internas, M9 no sufre ninguna alteración en su código ni en su base de datos.

## 3.4. Aplicación de la Saga Orquestada en el Flujo Crítico de Activación y Despacho
El escenario de negocio más complejo e importante de M9 ocurre cuando una reserva programada ingresa en su **Ventana de Activación** (entre 15 y 30 minutos antes de la hora fijada para el viaje). En ese momento, la reserva ya no es un registro pasivo en una agenda: debe convertirse en un viaje real en la calle.

Para lograrlo de manera consistente entre múltiples servicios independientes, M9 asume el rol de **Saga Coordinator (Orquestador de Saga)** a través del componente `ActivationSagaOrchestrator`.

```
========================================================================================
            CIRCUITO DE LA SAGA ORQUESTADA EN EL MÓDULO 9 (GRUPO 8)
========================================================================================

                 [ SAGA COORDINATOR: M9 ActivationSagaOrchestrator ]
                     │                   │                   │
  (Paso 1: T1)       │                   │                   │
  Transacción Local  │                   │                   │
  EN_PROCESO_DESPACHO│                   │                   │
  en db_m9           │                   │                   │
                     ▼ (Paso 2: T2)      │                   │
               [ M7: Pagos ]             │                   │
               Pre-autoriza fondos       │                   │
               en db_pagos ($3.500)      │                   │
                     │                   ▼ (Paso 3: T3 - PIVOTANTE)
                     │             [ M5: Despacho ]
                     │             Asignación de chofer en tiempo real
                     │             en db_despacho
                     │                   │
                     │                   ├───────────────────────┐
                     │                   ▼ (ÉXITO)               ▼ (FALLO: Sin Chofer)
                     │             Reserva pasa a ACTIVADA  Disparo Rollback Lógico
                     │             y M8 notifica al usuario ┌───────────────────────────┐
                     │                                      │ C2: M7 libera fondos      │
                     │                                      │ C1: M9 pasa a VENCIDA     │
                     │                                      │ Tr: M8 notifica disculpas │
                     │                                      └───────────────────────────┘
```

### 3.4.1. Mapeo Formal de Pasos: $T_1$, $T_2$, $T_3$, $T_r$

1. **$T_1$ (Transacción Local M9):**
   * *Acción:* M9 actualiza la reserva en `data/m9_reservas.db` pasando su estado de `CONFIRMADA` a `EN_PROCESO_DESPACHO`.
   * *Auditoría:* Se inserta un registro inmutable en `historial_reservas` con `tipo_evento: 'ACTIVACION_INICIADA'` y `actor: 'SAGA_ORCHESTRATOR'`.
   * *Propósito:* Actúa como un *Semantic Lock*, impidiendo que otros procesos intenten activar o cancelar la misma reserva en paralelo.

2. **$T_2$ (Transacción Compensable $T_c$ en M7):**
   * *Acción:* M9 invoca a `M7Client.preAutorizarPago()`. El Módulo 7 inserta un registro en su base de datos `data/m7_pagos.db` en la tabla `transacciones`, reteniendo temporalmente el monto estimado del viaje (ej. \$3.500) con estado `PRE_AUTORIZADO`.
   * *Clasificación:* Es compensable porque una llamada opuesta puede anular la retención sin costo financiero para el pasajero.

3. **$T_3$ (Transacción Pivotante $T_p$ en M5 — ¡Punto de No Retorno!):**
   * *Acción:* M9 invoca a `M5Client.solicitarDespacho()`. El Módulo 5 busca conductores disponibles en su tabla interna `conductores` dentro de `data/m5_despacho.db` y asigna a un chofer disponible (ej. 'Hernán Fernández').
   * *Clasificación:* Es la transacción pivotante. Si M5 responde afirmativamente asignando un chofer, la Saga culmina con éxito. La reserva se transiciona a `ACTIVADA` y ya no es reversible mediante compensaciones automáticas ordinarias.

4. **$T_r$ (Transacción Reintentable en M8):**
   * *Acción:* M9 invoca a `M8Client.enviarNotificacion()` para despachar una notificación multicanal al cliente informándole que su conductor está en camino con los datos del vehículo.
   * *Clasificación:* Reintentable. Si la llamada de red a M8 experimenta un timeout, se reintenta hasta el éxito, pues no compromete la consistencia del viaje.

### 3.4.2. Circuito de Rollback Lógico y Acciones Compensatorias Inversas: $C_2 \to C_1$
¿Qué sucede si en el Paso 3 ($T_3$) el Módulo 5 no encuentra ningún conductor disponible en el radio de cercanía o si ocurre un fallo técnico?

Dado que las bases de datos están desacopladas, M9 no puede invocar una sentencia `ROLLBACK` de SQL global. En su lugar, el bloque `catch` del orquestador toma el control y dispara el protocolo de **Rollback Lógico**, ejecutando las compensaciones en orden estrictamente inverso:

* **Compensación $C_2$ sobre M7 (Liberación Financiera):**
  M9 invoca inmediatamente a `M7Client.liberarPreAutorizacion()`. El Módulo 7 actualiza la transacción en `data/m7_pagos.db` pasando su estado a `LIBERADO` y restableciendo el saldo retenido a \$0.
* **Compensación $C_1$ sobre M9 (Compensación de Estado Local):**
  M9 actualiza el estado de la reserva en `data/m9_reservas.db` transicionándola a `VENCIDA`. Simultáneamente, inserta en `historial_reservas` un evento con `tipo_evento: 'RESERVA_VENCIDA'`, `actor: 'SAGA_COMPENSATION_C1'` y el detalle del motivo: *"Compensación lógica por indisponibilidad de chofer en M5"*.
* **Notificación de Disculpa ($T_r$ sobre M8):**
  Se envía un mensaje al pasajero avisándole que no se encontraron conductores disponibles en la zona y asegurándole que no se realizó ningún cargo monetario en su tarjeta.

El resultado final es **Consistencia Eventual Garantizada**: el usuario no perdió un solo centavo, no existen conductores asignados erróneamente en M5 y cada una de las 3 bases de datos refleja de forma fidedigna y auditable la realidad del negocio.

## 3.5. Resiliencia, Idempotencia (RF-9.10), Auditoría Inmutable (RF-9.12) y Trazabilidad Distribuida
Una Saga distribuida que se comunique a través de redes HTTP no puede considerarse lista para producción si no incluye salvaguardas contra fallos de red. Nuestra implementación incorpora tres mecanismos de grado industrial:

1. **Idempotencia Estricta con `Idempotency-Key` (RF-9.10):**
   En redes distribuidas, un cliente puede enviar una solicitud de activación, el servidor procesarla con éxito, pero la respuesta de red perderse en el camino de regreso. Ante la falta de respuesta, el cliente reintenta la misma petición. Si el backend no es idempotente, ejecutaría una segunda pre-autorización en M7 y un segundo despacho en M5 (generando el desastre del "doble cobro").
   En M9, cada llamada a `POST /reservas/:id/activar-saga` exige la cabecera `Idempotency-Key`. El método consulta `IdempotencyRepository`: si la clave ya existe en `data/m9_reservas.db`, devuelve la respuesta en caché en menos de 1 milisegundo sin re-ejecutar pagos ni despachos.

2. **Webhooks Idempotentes en Comunicación Asíncrona:**
   En `WebhookController.ts`, cuando M5 envía una notificación asíncrona de asignación de chofer (`POST /reservas/:id/despacho`), M9 verifica el estado actual en la base de datos. Si la reserva ya se encuentra en estado `ACTIVADA`, el controlador retorna inmediatamente `HTTP 200 OK` reconociendo el mensaje sin generar duplicaciones en el historial de auditoría.

3. **Auditoría Inmutable No Destructiva (RF-9.12):**
   La tabla `historial_reservas` opera bajo el principio de sólo inserción (*Append-Only*). Ningún registro histórico es jamás modificado (`UPDATE`) ni eliminado (`DELETE`). Esto provee un rastro forense completo de cada transición de la Saga, permitiendo responder con certeza técnica a cualquier reclamo de usuarios o auditorías de la cátedra.

4. **Trazabilidad Distribuida con `X-Request-Id`:**
   El middleware global de la aplicación intercepta cada solicitud entrante, generando o propagando un identificador universal único (UUID v4) en la cabecera `X-Request-Id`. Este identificador se estampa en cada línea de log generada por el orquestador, los repositorios y los clientes HTTP, facilitando la correlación de eventos en entornos distribuidos.

---

# 4. Sección III: Criterios de Utilización y Análisis Crítico de Decisiones Técnicas

## 4.1. Matriz de Decisión: Cuándo SÍ y Cuándo NO Utilizar Cada Patrón

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                      MATRIZ DE DECISIÓN DE INGENIERÍA DE SOFTWARE                      │
├─────────────────────┬───────────────────────────────┬──────────────────────────────────┤
│ Patrón              │ Cuándo SÍ Utilizarlo          │ Cuándo NO Utilizarlo             │
├─────────────────────┼───────────────────────────────┼──────────────────────────────────┤
│ **Patrón Saga**     │ • Transacciones que cruzan    │ • Operaciones confinadas dentro  │
│                     │   múltiples microservicios    │   del límite de un único         │
│                     │   autónomos con persistencia  │   servicio (una transacción ACID │
│                     │   separada.                   │   local resuelve el problema).   │
│                     │ • Procesos asíncronos o de    │ • Sistemas que demandan          │
│                     │   larga duración (*Long-      │   Consistencia Inmediata y       │
│                     │   Running Actions*).          │   estricta (bursátiles o trading)│
│                     │ • Interacción con pasarelas   │ • Cuando las acciones ejecutadas │
│                     │   de pago o APIs de terceros  │   no admiten compensación lógica │
│                     │   sin soporte transaccional.  │   física (envío masivo de SMS).  │
├─────────────────────┼───────────────────────────────┼──────────────────────────────────┤
│ **Database per**    │ • Equipos de desarrollo       │ • Aplicaciones monolíticas chicas│
│ **Service**         │   autónomos que buscan CI/CD  │   o MVPs donde la sobrecarga de  │
│                     │   y despliegues independientes│   gestión de red es inviable.    │
│                     │ • Requisitos de Persistencia  │ • Sistemas altamente analíticos  │
│                     │   Políglota heterogénea.      │   donde la gran mayoría de las   │
│                     │ • Necesidad de acotar el      │   consultas requiere JOINs       │
│                     │   radio de explosión de fallas│   masivos en tiempo real entre   │
│                     │   (*Blast Radius*).           │   todas las tablas.              │
└─────────────────────┴───────────────────────────────┴──────────────────────────────────┘
```

## 4.2. Evaluación Multidimensional de Factores de Ingeniería (Trade-offs)
En la ingeniería de software no existen "soluciones mágicas"; toda decisión arquitectónica representa un compromiso explícito (*trade-off*). A continuación se analizan los factores de compromiso derivados de nuestra elección:

### 4.2.1. Complejidad Arquitectónica y Sobrecarga Cognitiva
* *Impacto:* Muy Alto.
* *Análisis:* La adopción de Sagas y bases de datos aisladas traslada la complejidad desde el motor de base de datos hacia el código de la aplicación. En lugar de delegar la atomicidad a un `BEGIN TRANSACTION`, los ingenieros de software deben diseñar máquinas de estados explícitas, prever cada escenario posible de fallo y codificar transacciones compensatorias idempotentes para cada paso.

### 4.2.2. Costos de Infraestructura y Operación
* *Impacto:* Moderado a Alto en despliegue, pero Eficiente en escalado.
* *Análisis:* Gestionar una base de datos por servicio multiplica la cantidad de contenedores o instancias a monitorear y respaldar. Sin embargo, permite optimizar los costos de escalado: si el módulo de seguimiento satelital (M6) sufre una alta carga de I/O, se escala verticalmente solo su motor de series temporales, evitando incurrir en el costo millonario de escalar el servidor central de toda la empresa.

### 4.2.3. Rendimiento, Throughput y Latencia de Red
* *Impacto:* Elevado Throughput global, pero Mayor Latencia en operaciones individuales.
* *Análisis:* Al eliminar los bloqueos distribuidos de 2PC, la capacidad de procesamiento concurrente (*throughput*) de la plataforma se multiplica enormemente. Sin embargo, la latencia de una transacción de negocio individual se incrementa, ya que requiere múltiples saltos de red síncronos o asíncronos entre servicios.

### 4.2.4. Mantenibilidad y Radio de Explosión de Fallas (*Blast Radius*)
* *Impacto:* Sobresaliente.
* *Análisis:* Esta es la mayor victoria del patrón. Si la base de datos de Despacho (M5) colapsa por una falla de red, el Módulo 9 continúa funcionando con total normalidad: los usuarios pueden seguir logueándose, consultando sus reservas históricas o programando viajes para la próxima semana. El fallo queda confinado en su Bounded Context.

## 4.3. Tabla Comparativa de Alternativas Tecnológicas

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        COMPARATIVA DE ALTERNATIVAS TÉCNICAS                            │
├────────────────────┬─────────────────┬──────────────────┬──────────────┬───────────────┤
│ Factor de Análisis │ Monolito ACID   │ Two-Phase Commit │ Saga         │ Saga          │
│                    │ Tradicional     │ (2PC / XA)       │ Coreografiada│ Orquestada    │
│                    │                 │                  │              │ (Nuestra Sol.)│
├────────────────────┼─────────────────┼──────────────────┼──────────────┼───────────────┤
│ **Garantía de      │ Inmediata       │ Inmediata        │ Eventual     │ Eventual      │
│ Consistencia**     │ (Strict ACID)   │ (Distributed)    │ (Eventual)   │ (Eventual)    │
├────────────────────┼─────────────────┼──────────────────┼──────────────┼───────────────┤
│ **Escalabilidad**  │ Limitada a un   │ Muy Baja         │ Muy Alta     │ Muy Alta      │
│                    │ solo nodo de BD │ (Bloqueos)       │ (Asíncrona)  │ (Controlada)  │
├────────────────────┼─────────────────┼──────────────────┼──────────────┼───────────────┤
│ **Tolerancia a     │ Todo o nada en  │ Crítica (SPOF en │ Alta         │ Alta          │
│ Fallas**           │ un proceso      │ el coordinador)  │ (Desacoplada)│ (Resiliente)  │
├────────────────────┼─────────────────┼──────────────────┼──────────────┼───────────────┤
│ **Visibilidad y    │ Trivial         │ Compleja         │ Muy Difícil  │ Centralizada  │
│ Trazabilidad**     │ (Debug local)   │ (Locks de BD)    │ (Event Hell) │ (Máq. Estados)│
├────────────────────┼─────────────────┼──────────────────┼──────────────┼───────────────┤
│ **Compatibilidad   │ Nula            │ Inviable         │ Excelente    │ Excelente     │
│ con APIs Terceros**│                 │                  │              │ (REST/Webhook)│
└────────────────────┴─────────────────┴──────────────────┴──────────────┴───────────────┘
```

---

# 5. Sección IV: Implementación Práctica Integrada y Evidencias Técnicas de la Demo

## 5.1. Stack Tecnológico Elegido y Justificación de Ingeniería

| Tecnología | Versión | Rol en la Solución | Justificación Técnica de Ingeniería |
| :--- | :--- | :--- | :--- |
| **Node.js** | v24 (LTS) | Runtime del Backend | Soporte nativo de `node:sqlite` de alto rendimiento, soporte experimental de TypeScript sin transpiladores pesados y excelente modelo de I/O asíncrono para orquestación de servicios. |
| **TypeScript** | v5.8 | Lenguaje de Programación | Tipado estricto en tiempo de compilación para DTOs, interfaces de contratos y prevención de errores en tiempo de ejecución. |
| **Express.js** | v4.21 | Framework HTTP | Arquitectura desacoplada basada en middlewares (`X-Request-Id`, control de errores centralizado) y controladores limpios. |
| **SQLite Nativo (`node:sqlite`)** | Integrado en Node | Persistencia Aislada | Permite instanciar tres motores de base de datos físicamente independientes (`data/*.db`) sin dependencias de red externas ni compiladores C++ nativos (`node-gyp`), simulando a la perfección el patrón Database per Service en cualquier computadora. |
| **Docker & Compose** | v2 | Contenerización | Garantiza reproducibilidad absoluta del entorno con volúmenes montados y variables de configuración. |

## 5.2. Arquitectura de Carpetas y Componentes del Código Fuente

```text
c:\Dev\demo-investigacion-grupo8\demo-investigacion-grupo8\
├── data/                                 # ALMACENAMIENTO FÍSICO AISLADO (DATABASE PER SERVICE)
│   ├── m9_reservas.db                    # Base de datos privada exclusiva de M9 (Reservas)
│   ├── m7_pagos.db                       # Base de datos privada exclusiva de M7 (Financiero)
│   └── m5_despacho.db                    # Base de datos privada exclusiva de M5 (Despacho / Choferes)
├── dist/                                 # Código compilado listo para ejecución en producción
├── scripts/
│   ├── run-demo.js                       # CLI interactivo con tablas visuales y salida coloreada
│   ├── test-success.js                   # Suite automatizada del Flujo Exitoso (Exit 0)
│   └── test-failure.js                   # Suite automatizada del Flujo con Compensación (Exit 0)
├── postman/
│   └── Demo_Saga_Grupo8.postman_collection.json # Colección de pruebas para Postman / Newman
├── src/
│   ├── index.ts                          # Punto de entrada y arranque del servidor HTTP (Puerto 8090)
│   ├── app.ts                            # Middleware global (X-Request-Id), CORS, express.json y rutas
│   ├── config/
│   │   └── database.ts                   # Inicialización y conexiones independientes a SQLite
│   ├── domain/
│   │   ├── types.ts                      # Interfaces de dominio, DTOs de OpenAPI y tipos de Saga
│   │   └── errors.ts                     # Jerarquía de errores de negocio (AppError, NoDriversAvailableError)
│   ├── repositories/
│   │   ├── reservationRepository.ts      # Consultas y mutaciones exclusivas en db_m9.reservas
│   │   ├── historyRepository.ts          # Registro de auditoría append-only en db_m9.historial_reservas
│   │   └── idempotencyRepository.ts      # Deduplicación de peticiones en db_m9.idempotencia
│   ├── clients/
│   │   ├── m2Client.ts                   # Cliente desacoplado hacia M2 (Verificación de Clientes)
│   │   ├── m7Client.ts                   # Cliente hacia M7 (Pre-autorización y Liberación monetaria)
│   │   ├── m5Client.ts                   # Cliente hacia M5 (Solicitud y Asignación de Despacho)
│   │   └── m8Client.ts                   # Cliente hacia M8 (Notificaciones multicanal)
│   ├── saga/
│   │   └── activationSagaOrchestrator.ts # MÁQUINA DE ESTADOS Y ORQUESTADOR DE SAGA (T1, T2, T3, C2, C1)
│   ├── controllers/
│   │   ├── reservationController.ts      # Endpoints de creación y consulta de reservas
│   │   ├── sagaController.ts             # Endpoint de ejecución de la Saga
│   │   ├── webhookController.ts          # Webhook callback idempotente de M5
│   │   └── inspectorController.ts        # Endpoint didáctico de inspección multi-base (/inspeccionar-bases)
│   └── utils/
│       └── logger.ts                     # Logger formateador con colores ANSI y trazabilidad de RequestId
├── Dockerfile                            # Imagen reproducible basada en node:24-alpine
├── docker-compose.yml                    # Configuración de servicios y volúmenes montados
├── tsconfig.json                         # Configuración de TypeScript con soporte de NodeNext
└── package.json                          # Manifiesto de dependencias y scripts de ejecución
```

## 5.3. Modelo Físico de Persistencia Aislada (SQLite Nativo `node:sqlite`)
En el archivo `src/config/database.ts`, el sistema instanciará tres objetos de base de datos físicamente inconexos, demostrando el cumplimiento estricto del Tema 12:

```typescript
// src/config/database.ts
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';

// 1. BASE DE DATOS EXCLUSIVA DE M9 (Reservas)
export const dbM9 = new DatabaseSync(path.join(dataDir, 'm9_reservas.db'));

// 2. BASE DE DATOS EXCLUSIVA DE M7 (Pagos)
export const dbM7 = new DatabaseSync(path.join(dataDir, 'm7_pagos.db'));

// 3. BASE DE DATOS EXCLUSIVA DE M5 (Despacho / Conductores)
export const dbM5 = new DatabaseSync(path.join(dataDir, 'm5_despacho.db'));
```

### 5.3.1. Base de Datos Exclusiva de M9 (`data/m9_reservas.db`)
```sql
CREATE TABLE IF NOT EXISTS reservas (
  id TEXT PRIMARY KEY,
  cliente_id TEXT NOT NULL,          -- Identificador escalar UUID (Sin Foreign Key)
  origen TEXT NOT NULL,
  destino TEXT NOT NULL,
  tarifa_estimada REAL NOT NULL,
  estado TEXT NOT NULL,               -- CONFIRMADA, EN_PROCESO_DESPACHO, ACTIVADA, VENCIDA
  solicitud_despacho_id TEXT,
  conductor_id TEXT,                  -- Identificador escalar UUID (Sin Foreign Key)
  clave_idempotencia TEXT NOT NULL,
  creado_en TEXT NOT NULL,
  actualizado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS historial_reservas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reserva_id TEXT NOT NULL,
  tipo_evento TEXT NOT NULL,
  estado_anterior TEXT,
  estado_nuevo TEXT,
  actor TEXT NOT NULL,
  detalles TEXT,
  fecha_hora TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS idempotencia (
  clave TEXT PRIMARY KEY,
  codigo_estado INTEGER NOT NULL,
  cuerpo_respuesta TEXT NOT NULL,
  creado_en TEXT NOT NULL
);
```

### 5.3.2. Base de Datos Exclusiva de M7 (`data/m7_pagos.db`)
```sql
CREATE TABLE IF NOT EXISTS transacciones (
  id TEXT PRIMARY KEY,
  reserva_id TEXT NOT NULL,
  monto REAL NOT NULL,
  estado TEXT NOT NULL,               -- PRE_AUTORIZADO, LIBERADO, COBRADO
  fecha_hora TEXT NOT NULL
);
```

### 5.3.3. Base de Datos Exclusiva de M5 (`data/m5_despacho.db`)
```sql
CREATE TABLE IF NOT EXISTS solicitudes_despacho (
  id TEXT PRIMARY KEY,
  reserva_id TEXT NOT NULL,
  conductor_id TEXT,
  conductor_nombre TEXT,
  vehiculo TEXT,
  estado TEXT NOT NULL,               -- ASIGNADO, RECHAZADO, PENDIENTE
  fecha_hora TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conductores (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  vehiculo TEXT NOT NULL,
  disponible INTEGER NOT NULL
);
```

## 5.4. Lógica del Orquestador de Saga (`ActivationSagaOrchestrator.ts`)
El corazón técnico de la demostración reside en `src/saga/activationSagaOrchestrator.ts`. Este componente implementa la máquina de estados con captura centralizada de errores y compensación inversa:

```typescript
// Fragmento sustancial de src/saga/activationSagaOrchestrator.ts
export class ActivationSagaOrchestrator {
  public static async ejecutarSaga(
    reservaId: string,
    opciones: { forzarFalloM5?: boolean; idempotencyKey?: string; requestId?: string } = {}
  ): Promise<ResultadoSaga> {
    const requestId = opciones.requestId || 'req-default';
    const idempotencyKey = opciones.idempotencyKey || `idem-${reservaId}`;
    const pasos: SagaPasoLog[] = [];

    // 0. Control de Idempotencia estricta (RF-9.10)
    const cachedResponse = IdempotencyRepository.buscar(idempotencyKey);
    if (cachedResponse) {
      return JSON.parse(cachedResponse.cuerpoRespuesta) as ResultadoSaga;
    }

    // 1. Obtención de la reserva desde el repositorio de M9
    const reserva = ReservationRepository.obtenerPorId(reservaId);
    if (!reserva) {
      throw new AppError(404, 'Reserva no encontrada', `No existe la reserva con ID ${reservaId}`);
    }

    let pagoPreAutorizado = false;

    try {
      // T1 (Transacción Local M9): Bloqueo preventivo
      ReservationRepository.actualizarEstado(reservaId, 'EN_PROCESO_DESPACHO');
      HistoryRepository.registrar({
        reservaId,
        tipoEvento: 'ACTIVACION_INICIADA',
        estadoAnterior: reserva.estado,
        estadoNuevo: 'EN_PROCESO_DESPACHO',
        actor: 'SAGA_ORCHESTRATOR',
        detalles: { motivo: 'Inicio de despacho hacia M5', requestId },
        fechaHora: new Date().toISOString()
      });

      // T2 (Transacción Compensable M7): Pre-autorización financiera
      const txPago = await M7Client.preAutorizarPago(
        { reservaId, monto: reserva.tarifaEstimada },
        requestId
      );
      pagoPreAutorizado = true;

      // T3 (Transacción Pivotante M5): Despacho y Chofer (¡PUNTO DE NO RETORNO!)
      const despacho = await M5Client.solicitarDespacho(
        { reservaId, forzarFallo: opciones.forzarFalloM5 },
        idempotencyKey,
        requestId
      );

      // CONFIRMACIÓN DE LA SAGA: Transición a ACTIVADA
      ReservationRepository.actualizarEstado(reservaId, 'ACTIVADA', {
        solicitudDespachoId: despacho.id,
        conductorId: despacho.conductorId
      });
      HistoryRepository.registrar({
        reservaId,
        tipoEvento: 'RESERVA_ACTIVADA',
        estadoAnterior: 'EN_PROCESO_DESPACHO',
        estadoNuevo: 'ACTIVADA',
        actor: 'SAGA_ORCHESTRATOR',
        detalles: { conductor: despacho.conductorNombre, vehiculo: despacho.vehiculo },
        fechaHora: new Date().toISOString()
      });

      // Tr (Transacción Reintentable M8): Notificar al pasajero
      await M8Client.enviarNotificacion({
        tipoEvento: 'RESERVA_ACTIVADA',
        reservaId,
        clienteId: reserva.clienteId,
        mensaje: `¡Tu viaje fue confirmado! Conductor: ${despacho.conductorNombre}.`
      }, requestId);

      const resultadoExito: ResultadoSaga = {
        exito: true,
        reservaId,
        estadoFinal: 'ACTIVADA',
        mensaje: 'Saga completada con éxito. Conductor asignado y consistencia preservada.',
        pasosEjecutados: pasos,
        saldoRetenidoM7: reserva.tarifaEstimada,
        conductorAsignadoM5: despacho.conductorNombre
      };

      IdempotencyRepository.guardar(idempotencyKey, 200, resultadoExito);
      return resultadoExito;

    } catch (error: unknown) {
      // =====================================================================
      // FALLO DETECTADO -> EJECUCIÓN DE ACCIONES COMPENSATORIAS INVERSAS
      // =====================================================================
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';

      // C2 (Compensación M7): Liberar saldo retenido en la pasarela
      if (pagoPreAutorizado) {
        await M7Client.liberarPreAutorizacion({ reservaId }, requestId);
      }

      // C1 (Compensación M9): Transición de estado a VENCIDA en M9
      ReservationRepository.actualizarEstado(reservaId, 'VENCIDA');
      HistoryRepository.registrar({
        reservaId,
        tipoEvento: 'RESERVA_VENCIDA',
        estadoAnterior: 'EN_PROCESO_DESPACHO',
        estadoNuevo: 'VENCIDA',
        actor: 'SAGA_COMPENSATION_C1',
        detalles: { motivo: errorMsg, accion: 'Rollback semántico por indisponibilidad en M5' },
        fechaHora: new Date().toISOString()
      });

      // Tr (Notificación de disculpa al usuario vía M8)
      await M8Client.enviarNotificacion({
        tipoEvento: 'RESERVA_VENCIDA',
        reservaId,
        clienteId: reserva.clienteId,
        mensaje: 'No se encontraron conductores en la zona. No se realizó ningún cargo.'
      }, requestId);

      const resultadoFallo: ResultadoSaga = {
        exito: false,
        reservaId,
        estadoFinal: 'VENCIDA',
        mensaje: `La reserva falló y se aplicó rollback lógico: ${errorMsg}`,
        pasosEjecutados: pasos,
        saldoRetenidoM7: 0,
        conductorAsignadoM5: null
      };

      IdempotencyRepository.guardar(idempotencyKey, 200, resultadoFallo);
      return resultadoFallo;
    }
  }
}
```

## 5.5. Demostración Práctica: Análisis Paso a Paso de los Escenarios Ejecutados

### 5.5.1. Escenario 1: Flujo Exitoso de Activación y Despacho ($T_1 \to T_2 \to T_3 \to T_r$)
En este escenario (ejecutado por el script `scripts/test-success.js` o en la primera fase de `scripts/run-demo.js`), el cliente programa una reserva con origen en la ciudad de Resistencia:
1. **Petición Inicial:** Se envía un `POST /reservas` con tarifa estimada de \$3.500. Se crea la reserva en `data/m9_reservas.db` en estado `CONFIRMADA`.
2. **Disparo de la Saga:** Se invoca `POST /reservas/:id/activar-saga` con `forzarFalloM5: false`.
3. **Paso $T_1$:** La reserva pasa a `EN_PROCESO_DESPACHO`.
4. **Paso $T_2$:** M7 pre-autoriza los \$3.500 y los registra en `data/m7_pagos.db`.
5. **Paso $T_3$ (Pivotante):** M5 localiza en `data/m5_despacho.db` al conductor 'Hernán Fernández' y lo asigna.
6. **Resultado en Bases de Datos:**
   * En `data/m9_reservas.db`: `estado = 'ACTIVADA'`, `conductor_id = 'cond-001'`.
   * En `data/m7_pagos.db`: `estado = 'PRE_AUTORIZADO'`, `monto = 3500.0`.
   * En `data/m5_despacho.db`: `estado = 'ASIGNADO'`, `conductor_nombre = 'Hernán Fernández'`.

### 5.5.2. Escenario 2: Flujo con Falla en Pivotante y Compensación Inversa ($T_1 \to T_2 \to T_3[\text{Fallo}] \to C_2 \to C_1 \to T_r$)
En este escenario (ejecutado por `scripts/test-failure.js`), se simula un viaje en zona suburbana sin cobertura:
1. **Petición Inicial:** Se crea una reserva con tarifa estimada de \$5.200 en estado `CONFIRMADA`.
2. **Disparo de la Saga:** Se invoca `POST /reservas/:id/activar-saga` con `forzarFalloM5: true`.
3. **Paso $T_1$:** La reserva pasa a `EN_PROCESO_DESPACHO`.
4. **Paso $T_2$:** M7 retiene temporalmente los \$5.200 en `data/m7_pagos.db`.
5. **Fallo en Paso $T_3$:** M5 lanza la excepción `NoDriversAvailableError: No hay conductores disponibles en la zona de cobertura solicitada`.
6. **Compensación $C_2$ (M7):** M7 actualiza su base de datos pasando la transacción a `LIBERADO` y el saldo retenido vuelve a \$0.
7. **Compensación $C_1$ (M9):** M9 pasa la reserva a estado `VENCIDA` y graba el incidente en su auditoría.
8. **Resultado en Bases de Datos:**
   * En `data/m9_reservas.db`: `estado = 'VENCIDA'` (Cancelación lógica).
   * En `data/m7_pagos.db`: `estado = 'LIBERADO'`, saldo retenido = \$0 (Dinero liberado).
   * En `data/m5_despacho.db`: `estado = 'RECHAZADO'` (Sin chofer).

### 5.5.3. Evidencia 3: Auditoría Inmutable No Destructiva (`historial_reservas`)
Al consultar la tabla `historial_reservas` de `data/m9_reservas.db` mediante el script didáctico, se obtiene la secuencia append-only que comprueba la trazabilidad exigida por el RF-9.12:

```text
┌────┬──────────────┬─────────────────────┬──────────────────────┬──────────────────────┬────────────────────────┬───────────────────────────────────────────┐
│ id │ reserva_id   │ tipo_evento         │ estado_anterior      │ estado_nuevo         │ actor                  │ detalles                                  │
├────┼──────────────┼─────────────────────┼──────────────────────┼──────────────────────┼────────────────────────┼───────────────────────────────────────────┤
│ 1  │ res-demo-001 │ RESERVA_CREADA      │ NULL                 │ CONFIRMADA           │ CLIENTE_HTTP           │ {"clienteId":"cli-alumno-utn"}            │
│ 2  │ res-demo-001 │ ACTIVACION_INICIADA │ CONFIRMADA           │ EN_PROCESO_DESPACHO  │ SAGA_ORCHESTRATOR      │ {"motivo":"Inicio de despacho hacia M5"}  │
│ 3  │ res-demo-001 │ RESERVA_ACTIVADA    │ EN_PROCESO_DESPACHO  │ ACTIVADA             │ SAGA_ORCHESTRATOR      │ {"conductorNombre":"Hernán Fernández"}    │
│ 4  │ res-demo-002 │ RESERVA_CREADA      │ NULL                 │ CONFIRMADA           │ CLIENTE_HTTP           │ {"clienteId":"cli-pasajero-remoto"}       │
│ 5  │ res-demo-002 │ ACTIVACION_INICIADA │ CONFIRMADA           │ EN_PROCESO_DESPACHO  │ SAGA_ORCHESTRATOR      │ {"motivo":"Inicio de despacho hacia M5"}  │
│ 6  │ res-demo-002 │ RESERVA_VENCIDA     │ EN_PROCESO_DESPACHO  │ VENCIDA              │ SAGA_COMPENSATION_C1   │ {"motivo":"No hay conductores en la zona"}│
└────┴──────────────┴─────────────────────┴──────────────────────┴──────────────────────┴────────────────────────┴───────────────────────────────────────────┘
```

### 5.5.4. Evidencia 4: Idempotencia Estricta con `Idempotency-Key` (Deduplicación en 1 ms)
En la cuarta evidencia de `run-demo.js`, el cliente reenvía deliberadamente la misma solicitud HTTP del Escenario 1 con la cabecera `Idempotency-Key: idem-key-exito-001`. El orquestador detecta el hash previo en la tabla `idempotencia` y responde en menos de 1 milisegundo:
* No se vuelve a contactar al Módulo de Pagos (evitando doble cobro).
* No se vuelve a contactar al Módulo de Despacho (evitando doble asignación de auto).
* No se generan nuevos registros duplicados en el historial de auditoría.

## 5.6. Procedimiento de Ejecución y Pruebas Automatizadas
Para verificar la solución en cualquier entorno, el repositorio dispone de los siguientes comandos configurados en `package.json`:

```bash
# 1. Compilación de TypeScript a JavaScript estándar
npm run build

# 2. Ejecución de la Demostración Integral Interactiva (Escenarios 1, 2, 3 y 4)
npm run demo

# 3. Ejecución de la Suite de Pruebas Automatizadas (Exit Code 0 garantizado)
npm run test:all

# 4. Despliegue contenerizado mediante Docker Compose
docker-compose up --build
```

---

# 6. Sección VI: Bibliografía y Referencias Académicas

1. **Richardson, Chris (2018).** *Microservices Patterns: With examples in Java.* Manning Publications.
   - *Capítulo 2:* Decomposition strategies and database per service pattern.
   - *Capítulo 3:* Inter-process communication in a microservice architecture.
   - *Capítulo 4:* Managing transactions with sagas (Orchestration, Choreography, Compensating transactions).
   - *Capítulo 5:* Designing business logic in a microservice architecture.
2. **Newman, Sam (2021).** *Building Microservices: Designing Fine-Grained Systems (2nd Edition).* O'Reilly Media.
   - *Capítulo 4:* Integration and database per service patterns.
   - *Capítulo 6:* Splitting the monolith and distributed transactions.
3. **Garcia-Molina, Hector & Salem, Kenneth (1987).** *Sagas.* In Proceedings of the 1987 ACM SIGMOD International Conference on Management of Data (SIGMOD '87), San Francisco, California, USA, pp. 249–259. ACM.
4. **Evans, Eric (2003).** *Domain-Driven Design: Tackling Complexity in the Heart of Software.* Addison-Wesley.
   - Definición formal de Bounded Contexts, Agregados y Soberanía de Entidades de Dominio.
5. **Fowler, Martin (2002).** *Patterns of Enterprise Application Architecture.* Addison-Wesley.
   - Patrones de mapeo de datos, separación de responsabilidades y arquitecturas de servicios.
6. **Kleppmann, Martin (2017).** *Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems.* O'Reilly Media.
   - Modelos de consistencia eventual, límites del Teorema CAP/PACELC y transacciones distribuidas.
7. **Microsoft Azure Architecture Center (2024).** *Saga distributed transactions pattern.* Microsoft Learn. Recuperado de: `https://learn.microsoft.com/es-es/azure/architecture/patterns/saga`
8. **Microsoft Azure Architecture Center (2024).** *Data considerations for microservices & Data sovereignty.* Microsoft Learn. Recuperado de: `https://learn.microsoft.com/es-es/dotnet/architecture/microservices/architect-microservice-container-applications/data-sovereignty-per-microservice`
9. **AWS Prescriptive Guidance (2024).** *Database per service pattern for microservices data persistence.* Amazon Web Services. Recuperado de: `https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-data-persistence/database-per-service.html`
10. **Conduktor Technologies (2024).** *Saga Pattern for Distributed Transactions in Event-Driven Architecture.* Recuperado de: `https://www.conduktor.io/glossary/saga-pattern-for-distributed-transactions`
11. **Temporal Technologies (2024).** *Mastering Saga Patterns for Distributed Transactions in Microservices.* Temporal Blog. Recuperado de: `https://temporal.io/blog/mastering-saga-patterns-for-distributed-transactions-in-microservices`
12. **Microservices.io (2024).** *Pattern: Database per service & Pattern: Saga.* Chris Richardson. Recuperado de: `https://microservices.io/patterns/data/database-per-service.html`
