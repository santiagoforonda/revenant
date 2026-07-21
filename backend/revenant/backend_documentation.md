# Revenant — Documentación del Backend

> **Propósito de este documento:** esta es la fuente de verdad (*source of truth*) para toda la arquitectura del backend del proyecto **Revenant**. Cualquier agente de IA (Kiro, Claude Code, Gemini, ChatGPT, etc.) que implemente funcionalidades del backend debe seguir este documento antes de generar código.
>
> Este documento complementa:
>
> - `documentation_architecture_game.md`
> - `documentation_database_game.md`
>
> Cualquier cambio importante en la arquitectura del backend deberá reflejarse aquí para mantener una única fuente de verdad.

---

# 1. Objetivo

El backend será responsable de:

- Autenticación y autorización de usuarios.
- Persistencia de los datos del videojuego.
- Exponer una API REST consumida por React.
- Implementar todas las reglas de negocio.
- Gestionar el progreso del jugador.
- Administrar inventario, combate, personajes y demás sistemas del juego.

El backend **no** contendrá lógica gráfica ni lógica propia de Phaser.

Toda la lógica relacionada con renderizado, animaciones y entrada del jugador pertenece exclusivamente al frontend.

---

# 2. Stack tecnológico

El backend utilizará exclusivamente las siguientes tecnologías.

| Tecnología | Uso |
|------------|-----|
| Java 21 | Lenguaje principal |
| Spring Boot | Framework principal |
| Spring Web | API REST |
| Spring Data JPA | Persistencia |
| Hibernate | ORM |
| PostgreSQL | Base de datos |
| Spring Security | Seguridad |
| JJWT | Autenticación JWT |
| Lombok | Reducción de código repetitivo |
| Springdoc OpenAPI | Documentación Swagger |
| Maven | Gestión de dependencias |

No se utilizarán frameworks adicionales salvo que exista una decisión arquitectónica futura que lo justifique.

---

# 3. Arquitectura

El backend seguirá una arquitectura convencional en **N capas**.

```
Cliente (React)

        │

Controllers
(Presentación)

        │

DTOs + Mapper
(Transferencia)

        │

Services
(Lógica de negocio)

        │

Repositories
(Acceso a datos)

        │

Entities
(Modelo de dominio)

        │

PostgreSQL
```

Cada capa tiene responsabilidades estrictamente definidas.

Ninguna capa puede omitir otra para acceder directamente a una inferior.

Ejemplo:

```
Controller

❌ Repository
```

Nunca.

Siempre:

```
Controller

↓

Service

↓

Repository
```

---

# 4. Organización del proyecto

La estructura del proyecto deberá mantenerse consistente durante todo el desarrollo.

```
src/main/java/

└── com/santyman/revenant

    ├── config
    │
    ├── controllers
    │
    ├── dtos
    │
    ├── entities
    │
    ├── mappers
    │
    ├── repositories
    │
    ├── security
    │
    ├── services
        -implementation
        -interfaces
    │
    ├── exception
    │
    ├── util
    │
    └── RevenantApplication
```

---

# 5. Responsabilidad de cada capa

## Controllers

Responsabilidad:

- Exponer endpoints REST.
- Validar parámetros de entrada.
- Recibir DTOs.
- Devolver DTOs.
- Delegar completamente al Service.

Los controllers **no contienen lógica de negocio**.

Nunca deben:

- acceder a Repository
- construir entidades
- realizar cálculos
- implementar reglas del juego

---

## DTO

Los DTO representan exclusivamente los datos intercambiados entre cliente y servidor.

Se utilizarán para:

- Request
- Response

Nunca se expondrán entidades JPA directamente.

---

## Mapper

Responsabilidad:

Conversión entre:

```
DTO

↔

Entity
```

Los mappers no contienen reglas de negocio.

Solo realizan transformaciones de datos.

---

## Services

Los Services contienen toda la lógica del videojuego.

Ejemplos:

- crear personaje
- registrar usuario
- equipar arma
- consumir objeto
- calcular daño
- guardar progreso
- validar inventario
- subir de nivel

Toda regla de negocio pertenece aquí.

Los Services nunca reciben entidades provenientes del controlador.

Reciben DTOs o parámetros simples.

---

## Repository

Responsabilidad:

Acceso a la base de datos.

Los repositories únicamente realizan operaciones de persistencia.

No implementan reglas del negocio.

No realizan validaciones.

---

## Entities

Representan el modelo persistente del sistema.

Las entidades reflejan exactamente el diseño definido en:

```
documentation_database_game.md
```

No deben contener lógica de negocio compleja.

---

# 6. Flujo de una petición

Todas las peticiones deberán seguir el siguiente flujo.

```
Cliente

↓

Controller

↓

DTO

↓

Mapper

↓

Service

↓

Repository

↓

PostgreSQL

↓

Repository

↓

Service

↓

Mapper

↓

DTO

↓

Controller

↓

Cliente
```

No existen atajos.

---

# 7. Filosofía de implementación

El backend seguirá los principios:

- responsabilidad única
- separación de responsabilidades
- bajo acoplamiento
- alta cohesión
- código fácilmente testeable
- clases pequeñas
- métodos pequeños
- reutilización de lógica

---

# 8. Seguridad

La autenticación utilizará JWT.

No se utilizará:

- OAuth2
- Cognito
- Keycloak

El flujo será:

```
Login

↓

Spring Security

↓

Autenticación

↓

Generación JWT

↓

Cliente

↓

Bearer Token

↓

Filtros JWT

↓

Controller
```

Spring Security será responsable de:

- autenticación
- autorización
- filtros
- protección de endpoints

---

# 9. Documentación REST

Toda la API deberá documentarse mediante Springdoc OpenAPI.

Cada endpoint deberá incluir:

- descripción
- parámetros
- respuestas posibles
- códigos HTTP
- ejemplos cuando sea necesario

Swagger será considerado parte del proyecto y deberá mantenerse actualizado.

---

# 10. Convenciones generales

## Controllers

Finalizan con:

```
Controller
```

Ejemplo:

```
AuthController
```

---

## Services

Finalizan con:

```
Service
```

Ejemplo:

```
InventoryService
```

---

## Repository

Finalizan con:

```
Repository
```

Ejemplo:

```
PlayerRepository
```

---

## DTO

Se separarán en:

```
request

response
```

Ejemplo:

```
LoginRequest

LoginResponse
```

---

## Mapper

Finalizan con:

```
Mapper
```

Ejemplo:

```
PlayerMapper
```

---

## Entity

Representan directamente las tablas de PostgreSQL.

---

# 11. Dependencias oficiales

El proyecto utilizará únicamente las siguientes dependencias de Spring Boot.

- Spring Web
- Spring Data JPA
- Spring Security
- PostgreSQL Driver
- Lombok
- Springdoc OpenAPI UI
- JJWT

No deberán incorporarse nuevas dependencias sin una justificación arquitectónica.

---

# 12. Reglas para cualquier agente de IA

Antes de implementar cualquier funcionalidad el agente debe seguir este flujo.

```
Idea

↓

Requerimientos

↓

Diseño

↓

Tareas

↓

Implementación

↓

Validación
```

Nunca debe escribir código directamente después de recibir una idea.

Siempre debe cerrar primero las etapas de requerimientos y diseño.

---

# 13. Restricciones arquitectónicas

Está prohibido:

- acceder al Repository desde un Controller.
- devolver entidades JPA al frontend.
- colocar reglas de negocio en Controllers.
- colocar reglas de negocio en Repositories.
- acceder directamente a la base de datos desde Services sin Repository.
- omitir DTOs.
- omitir Mappers.
- duplicar lógica entre Services.

---

# 14. Objetivo del MVP

El objetivo del backend es construir una base sólida, sencilla y mantenible que permita desarrollar el videojuego durante la hackathon sin introducir complejidad innecesaria.

Se priorizarán:

- simplicidad
- claridad
- mantenibilidad
- velocidad de desarrollo

sobre patrones avanzados o arquitecturas excesivamente complejas.

El backend deberá mantenerse coherente con la arquitectura en N capas definida en este documento y con el diseño de base de datos especificado en `documentation_database_game.md`.