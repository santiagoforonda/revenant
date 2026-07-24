# Revenant — Arquitectura General del Proyecto

> **Propósito de este documento:** esta es la fuente de verdad sobre la arquitectura, filosofía de trabajo y hoja de ruta del proyecto "Revenant". Sirve como contexto para cualquier agente de IA (Kiro, Claude, Gemini, etc.) que retome el proyecto en una sesión nueva, sin necesidad de releer el historial completo de conversación. Este documento se complementa con `documentation_database_game.md`, que es la fuente de verdad específica del diseño de base de datos.

---

## 1. Visión del proyecto

**Revenant** es un videojuego 2D de aventura/exploración con perspectiva top-down, estilo pixel art, fuertemente inspirado en la saga Dark Souls. El jugador se desplaza entre mapas conectados desde un punto de inicio hasta un punto objetivo, con mecánicas de combate, exploración y progresión de personaje.

**Contexto del proyecto:** desarrollo individual (solo dev) para una hackaton de 1 semana. El desarrollador tiene experiencia sólida en Spring Boot, experiencia básica en React/TypeScript, y está recién empezando con AWS.

---

## 2. Filosofía de trabajo

El proyecto combina dos enfoques de diseño distintos según el componente:

| Componente | Enfoque | Herramienta |
|---|---|---|
| Base de datos | Diseño convencional (ERD → DDL directo) | Herramienta de diagramación ER + PostgreSQL |
| Backend | Spec-Driven Development (SDD) | Kiro |
| Frontend | Spec-Driven Development (SDD) | Kiro (con apoyo previo de Gemini para la integración React + Phaser) |

### Flujo SDD (backend y frontend)
Para backend y frontend, cada funcionalidad sigue este flujo antes de escribir código:

```
idea → requerimientos → diseño → tareas → construcción → validación
```

- **Idea:** planteamiento informal de qué se quiere lograr.
- **Requerimientos:** qué debe cumplir la funcionalidad (funcional y no funcional).
- **Diseño:** cómo se va a construir (modelos, endpoints, componentes, contratos de API).
- **Tareas:** desglose en pasos concretos y accionables.
- **Construcción:** implementación del código.
- **Validación:** pruebas de que lo construido cumple el requerimiento original.

**Regla de trabajo importante:** no se genera código ni se avanza a "construcción" sin haber cerrado explícitamente las etapas de requerimientos y diseño. Si un agente se salta etapas (por ejemplo, empieza a escribir código ante una idea aún no especificada), debe ser corregido y retomar el flujo desde la etapa que falte.

### La base de datos es la excepción
El diseño de base de datos **no sigue el flujo SDD de Kiro** — se hizo de forma convencional: diagrama entidad-relación (lógico → físico) y luego DDL/SQL directo. Esta etapa ya está cerrada (ver sección 4 y `documentation_database_game.md`).

---

## 3. Stack tecnológico

```
┌─────────────────────────────────────────────┐
│  Frontend: React + TypeScript + Phaser       │
│  (SPA, Phaser montado dentro de un           │
│   componente React)                          │
└───────────────────┬───────────────────────────┘
                    │ HTTP/REST + JWT
┌───────────────────▼───────────────────────────┐
│  Backend: Java + Spring Boot                 │
│  - Spring Web (REST API)                     │
│  - Spring Security + JWT (auth propio,       │
│    sin OAuth2/Cognito)                       │
│  - Spring Data JPA / Hibernate               │
└───────────────────┬───────────────────────────┘
                    │ JDBC
┌───────────────────▼───────────────────────────┐
│  Base de datos: PostgreSQL                   │
└─────────────────────────────────────────────┘
```

### Despliegue (AWS)

| Componente | Servicio AWS | Motivo |
|---|---|---|
| Backend (Spring Boot, `.jar`) | Elastic Beanstalk | Menor fricción operativa que ECS/EKS; ideal dado que el desarrollador es nuevo en AWS |
| Base de datos | RDS (PostgreSQL) | Servicio gestionado, sin administrar el motor manualmente |
| Frontend (build estático de React) | S3 + CloudFront | Hosting estático simple, sin servidor que mantener |
| Autenticación | JWT propio (no Cognito) | Menor complejidad de integración dado el alcance y el tiempo disponible |

No se usa Docker/Kubernetes ni Terraform en el alcance actual — el despliegue está pensado para poder hacerse manualmente desde la consola de AWS si el tiempo aprieta.

---

## 4. Etapas del proyecto y estado actual

El desarrollo avanza en sesiones separadas, cada una enfocada en una etapa:

| # | Etapa | Estado | Notas |
|---|---|---|---|
| 1 | Diseño de base de datos | ✅ Cerrado | ERD lógico y físico definidos. Ver `documentation_database_game.md` |
| 2 | Creación de la base de datos (scripts SQL) | ✅ Cerrado | `schema.sql` (DDL completo) y `seed.sql` (catálogo con kits de equipo inicial por clase) generados. Ver `documentation_database_game.md` |
| 3 | Backend (Spring Boot, vía SDD/Kiro) | ⏳ Pendiente | Empieza con la fase de requerimientos en Kiro |
| 4 | Frontend (React + TS + Phaser, vía SDD/Kiro) | ⏳ Pendiente | Ya existe una base de integración React↔Phaser explorada previamente con Gemini |
| 5 | Despliegue en AWS | ⏳ Pendiente | Backend → Elastic Beanstalk, DB → RDS, Frontend → S3+CloudFront |

> Cada sesión nueva debe empezar consultando este documento y `documentation_database_game.md` para saber en qué etapa está el proyecto antes de proponer trabajo nuevo.

---

## 5. Decisiones arquitectónicas clave (log resumido)

- **Autenticación:** JWT simple usuario/contraseña, sin OAuth2/Cognito.
- **Guardado de progreso:** manual (botón "guardar"), no autosave por checkpoints.
- **Clases de jugador:** sin restricciones de qué equipo pueden llevar, pero cada clase define estadísticas base propias y un kit de equipo inicial (ver decisión más abajo).
- **Herencia de ítems:** estrategia `JOINED` en JPA (tabla padre `items` + tablas hijas `weapons`, `shields`, `consumables`, `armors`).
- **Inventario:** tabla puente `inventories`, relación N:M entre `players` e `items` (un ítem del catálogo puede pertenecer a muchos jugadores).
- **Enums:** simulados con `VARCHAR` + `CHECK constraint` en vez de tipos `ENUM` nativos de PostgreSQL, para facilitar cambios futuros.
- **Sin auditoría ni `tex_key` en base de datos:** decisiones conscientes de alcance para la hackaton (ver sección "Fuera de alcance" en `documentation_database_game.md`).
- **Estadísticas base por clase y equipo inicial:** `type_player` deja de ser puramente decorativo — cada clase (`CABALLERO`, `MAGO`, `ARQUERO`, `ESPADACHIN`, `GLADIADOR`) tiene valores base propios de `health_points`, `strong_points` y `speed_attack_points`, y recibe un kit de arma(s)/escudo/armadura básico al crear el personaje. Esta lógica se implementa en el backend (Spring Boot) al momento de creación del personaje, no como `DEFAULT` de columna ni trigger en PostgreSQL. Detalle completo en `documentation_database_game.md`, sección 4.1 y 4.2.

---

## 6. Convenciones generales del proyecto

- **Nombres de base de datos:** `snake_case`, tablas en plural (`players`, `items`, `inventories`), excepto `users_app` (por la palabra reservada `user` en PostgreSQL).
- **Commits/organización de código:** a definir en la etapa de backend (sugerido: seguir convención de Kiro por feature/spec).
- **Idioma:** el proyecto y su documentación se manejan en español; el código (nombres de variables, clases, endpoints) puede seguir convenciones en inglés según lo que decida el desarrollador al iniciar cada etapa SDD.

---

## 7. Cómo debe actuar un agente de IA que retome este proyecto

1. Leer este documento primero para entender la etapa actual y el stack.
2. Leer `documentation_database_game.md` si el trabajo involucra persistencia o modelos de datos.
3. Si la sesión es sobre backend o frontend, **seguir el flujo SDD** (idea → requerimientos → diseño → tareas → construcción → validación) y no saltar a código sin cerrar diseño primero.
4. Si la sesión es sobre base de datos (scripts SQL), puede proceder de forma convencional, ya que esa etapa no sigue SDD.
5. Actualizar este documento (o señalarle al usuario que lo actualice) cuando se cierre una etapa nueva, para mantenerlo como fuente de verdad vigente.