# Implementation Plan: Revenant Game

## Overview

Este documento describe las tareas necesarias para implementar el módulo de autenticación del backend de Revenant.

Las tareas están organizadas en fases incrementales, siguiendo el diseño definido en `design.md`. Cada fase debe completarse y validarse antes de avanzar a la siguiente.

---

## Tasks

### Phase 1: Project Setup

- [ ] 1. Agregar las dependencias necesarias para Spring Security y JWT.
- [ ] 2. Configurar Spring Security.
- [ ] 3. Configurar Swagger para soportar autenticación Bearer.
- [ ] 4. Configurar las propiedades de JWT (secret, expiration time).

---

### Phase 2: Persistence Layer

- [ ] 5. Implementar la entidad `User`.
- [ ] 6. Implementar el repositorio `UserRepository`.
- [ ] 7. Crear los métodos para buscar usuarios por username y email.

---

### Phase 3: Authentication Services

- [ ] 8. Implementar `AuthenticationService`.
- [ ] 9. Implementar el registro de usuarios.
- [ ] 10. Validar la unicidad del nombre de usuario.
- [ ] 11. Validar la unicidad del correo electrónico.
- [ ] 12. Encriptar la contraseña utilizando BCrypt.
- [ ] 13. Implementar la autenticación de usuarios.

---

### Phase 4: JWT Infrastructure

- [ ] 14. Implementar `JwtService`.
- [ ] 15. Implementar la generación de JWT.
- [ ] 16. Implementar la validación de JWT.
- [ ] 17. Implementar la extracción de claims.

---

### Phase 5: Security Filter

- [ ] 18. Implementar `JwtAuthenticationFilter`.
- [ ] 19. Configurar el filtro dentro de Spring Security.
- [ ] 20. Configurar los endpoints públicos y protegidos.

---

### Phase 6: REST API

- [ ] 21. Implementar `AuthenticationController`.
- [ ] 22. Crear el endpoint de registro.
- [ ] 23. Crear el endpoint de inicio de sesión.
- [ ] 24. Definir los DTOs de request y response.

---

### Phase 7: Player Initialization

- [ ] 25. Crear automáticamente el jugador asociado al usuario.
- [ ] 26. Inicializar las estadísticas base según la clase seleccionada.
- [ ] 27. Asignar el equipo inicial definido para la clase.
- [ ] 28. Persistir el inventario inicial.

---

### Phase 8: Testing and Validation

- [ ] 29. Validar el registro exitoso de usuarios.
- [ ] 30. Validar el rechazo de usuarios duplicados.
- [ ] 31. Validar el inicio de sesión con credenciales válidas.
- [ ] 32. Validar el rechazo de credenciales inválidas.
- [ ] 33. Validar el acceso a endpoints protegidos mediante JWT.
- [ ] 34. Verificar la documentación OpenAPI.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": [1] },
    { "wave": 2, "tasks": [2, 3, 4] },
    { "wave": 3, "tasks": [5] },
    { "wave": 4, "tasks": [6, 7] },
    { "wave": 5, "tasks": [14] },
    { "wave": 6, "tasks": [15, 16, 17] },
    { "wave": 7, "tasks": [8, 18] },
    { "wave": 8, "tasks": [9, 10, 11, 12, 13, 19, 20] },
    { "wave": 9, "tasks": [21, 24] },
    { "wave": 10, "tasks": [22, 23] },
    { "wave": 11, "tasks": [25] },
    { "wave": 12, "tasks": [26, 27] },
    { "wave": 13, "tasks": [28] },
    { "wave": 14, "tasks": [29, 30, 31, 32, 33, 34] }
  ]
}
```

---

## Notes

- La implementación deberá seguir la arquitectura en N capas definida para el proyecto.
- Ningún controlador accederá directamente a los repositorios.
- No se expondrán entidades JPA directamente al cliente.
- Toda la lógica de negocio deberá implementarse en la capa de servicios.
- Todos los endpoints deberán documentarse mediante OpenAPI.
