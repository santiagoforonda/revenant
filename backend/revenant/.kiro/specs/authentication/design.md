# Revenant Game - Design Document

## Overview

El módulo de autenticación es responsable de gestionar la identidad de los usuarios del videojuego Revenant.

Este módulo permite el registro de nuevos usuarios, la autenticación mediante nombre de usuario y contraseña, y la autorización de las solicitudes protegidas utilizando JSON Web Tokens (JWT).

Su objetivo es proporcionar un mecanismo de autenticación simple, seguro y desacoplado del resto de los módulos del sistema.

La autenticación se implementará utilizando Spring Security y JWT, sin depender de proveedores externos como OAuth2, Keycloak o Amazon Cognito.

---

## Architecture

El módulo seguirá la arquitectura en N capas definida para todo el backend.

```
Client (React)

        │
        ▼

Authentication Controller

        │
        ▼

Authentication Service

        │
        ▼

User Repository

        │
        ▼

PostgreSQL
```

Spring Security interceptará las solicitudes HTTP para autenticar usuarios y validar los JWT antes de permitir el acceso a los recursos protegidos.

La generación y validación de tokens estará centralizada en un servicio especializado para evitar duplicación de lógica.

---

## Components and Interfaces

### AuthenticationController

Responsabilidades:

- Registrar nuevos usuarios.
- Autenticar usuarios.
- Exponer los endpoints REST del módulo.

Endpoints:

- POST /api/auth/register
- POST /api/auth/login

---

### AuthenticationService

Responsabilidades:

- Validar las reglas de negocio del registro.
- Verificar la unicidad del nombre de usuario.
- Verificar la unicidad del correo electrónico.
- Crear la cuenta de usuario.
- Crear automáticamente el jugador inicial.
- Autenticar usuarios.
- Solicitar la generación del JWT.

---

### JwtService

Responsabilidades:

- Generar JWT.
- Validar JWT.
- Extraer información del token.

---

### JwtAuthenticationFilter

Responsabilidades:

- Interceptar solicitudes HTTP.
- Extraer el JWT del encabezado Authorization.
- Validar el token.
- Establecer el usuario autenticado dentro del Security Context.

---

### UserRepository

Responsabilidades:

- Buscar usuarios por username.
- Buscar usuarios por email.
- Persistir nuevos usuarios.

---

### PlayerService

Responsabilidades:

- Crear automáticamente el jugador asociado al usuario registrado.
- Inicializar las estadísticas base según la clase seleccionada.
- Asignar el equipo inicial definido por las reglas del juego.

---

## Data Models

### RegisterRequest

| Campo | Tipo |
|--------|------|
| username | String |
| email | String |
| password | String |
| playerType | PlayerType |

---

### LoginRequest

| Campo | Tipo |
|--------|------|
| username | String |
| password | String |

---

### LoginResponse

| Campo | Tipo |
|--------|------|
| token | String |
| tokenType | String |

---

### User Entity

Representa la cuenta de autenticación del usuario.

Atributos principales:

- id
- username
- email
- password

---

### Player Entity

Representa el personaje del videojuego asociado al usuario.

Atributos principales:

- id
- user
- typePlayer
- level
- experience
- healthPoints
- strongPoints
- speedAttackPoints
- gold
- currentMap

---

### JWT

El JWT contendrá únicamente la información necesaria para identificar al usuario autenticado.

Claims:

- subject (username)
- issuedAt
- expiration