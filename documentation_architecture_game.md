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

### Despliegue

---

## 4. Etapas del proyecto y estado actual

El desarrollo avanza en sesiones separadas, cada una enfocada en una etapa:

| # | Etapa | Estado | Notas |
|---|---|---|---|
| 1 | Diseño de base de datos | ✅ Cerrado | ERD lógico y físico definidos. Ver `documentation_database_game.md` |
| 2 | Creación de la base de datos (scripts SQL) | ✅ Cerrado | `schema.sql` (DDL completo) y `seed.sql` (catálogo con kits de equipo inicial por clase) generados. Ver `documentation_database_game.md` |
| 3 | Backend (Spring Boot, vía SDD/Kiro) | ✅ Cerrado | Empieza con la fase de requerimientos en Kiro |
| 4 | Frontend (React + TS + Phaser, vía SDD/Kiro) | ✅ Cerrado | Ya existe una base de integración React↔Phaser explorada previamente con Gemini |
| 5 | Despliegue | ✅ Cerrado | Redner |
