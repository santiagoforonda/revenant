# Java Developer Steering

> **Propósito:** Este documento define las convenciones de desarrollo para el backend de Revenant. Todas las implementaciones generadas por Kiro deben cumplir estas reglas de forma obligatoria. Si alguna implementación entra en conflicto con este documento, prevalece este documento.

---

# 1. Principios generales

- El proyecto utiliza Java 21 y Spring Boot.
- Se seguirá una arquitectura convencional en N capas.
- El código debe priorizar la claridad, mantenibilidad y simplicidad.
- No se debe generar código innecesario.
- Cada clase debe tener una única responsabilidad (Single Responsibility Principle).

---

# 2. Convenciones para Entidades JPA

Las clases anotadas con `@Entity` deberán cumplir las siguientes reglas:

- Utilizar:

```java
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "...")
```

- No utilizar `@Data` de Lombok.

Motivo:

- Evita problemas con `equals()`, `hashCode()` y `toString()`.
- Evita referencias circulares en relaciones bidireccionales.

---

# 3. Relaciones entre entidades

Las relaciones JPA deben diseñarse siguiendo las mejores prácticas de Hibernate.

## Reglas

- Evitar relaciones bidireccionales cuando no sean necesarias.
- Priorizar relaciones unidireccionales.
- Evitar referencias circulares.
- Nunca exponer entidades JPA directamente al cliente.
- Evitar cargar colecciones innecesarias.

### Fetch

Utilizar:

- `FetchType.LAZY` para relaciones `@OneToMany` y `@ManyToMany`.
- Mantener explícitamente `FetchType.LAZY` en relaciones donde sea recomendable evitar cargas innecesarias.

No utilizar `FetchType.EAGER` salvo que exista una justificación funcional claramente documentada.

### Cascade

Utilizar únicamente el tipo de cascada necesario.

No utilizar:

```java
CascadeType.ALL
```

si no es estrictamente necesario.

---

# 4. Enumeraciones

Todos los Enum persistidos deberán utilizar:

```java
@Enumerated(EnumType.STRING)
```

Nunca utilizar:

```java
EnumType.ORDINAL
```

Motivo:

- Evita corrupción de datos al modificar el orden del Enum.

---

# 5. Inyección de dependencias

Toda dependencia deberá inyectarse mediante constructor.

Utilizar:

```java
@RequiredArgsConstructor
```

Los atributos deberán declararse como:

```java
private final
```

No utilizar:

- `@Autowired`
- Inyección por setters
- Inyección por campos

Ejemplo:

```java
@RequiredArgsConstructor
@Service
public class PlayerServiceImpl implements PlayerService {

    private final PlayerRepository playerRepository;

}
```

---

# 6. Arquitectura de la capa Service

La capa Service estará dividida en dos paquetes.

```
service

    PlayerService

service.impl

    PlayerServiceImpl
```

Las interfaces contendrán únicamente las firmas de los métodos.

Toda la lógica de negocio se implementará en las clases `Impl`.

---

# 7. Transacciones

Todo método público implementado en un Service deberá estar anotado con:

```java
@Transactional
```

Utilizar:

- lectura

```java
@Transactional(readOnly = true)
```

- escritura

```java
@Transactional
```

No realizar operaciones de persistencia fuera de un contexto transaccional.

---

# 8. Controllers

Los Controllers deberán:

- recibir únicamente DTOs
- devolver únicamente DTOs
- delegar toda la lógica al Service
- no acceder nunca a Repository

Todos los endpoints deberán documentarse mediante OpenAPI.

Utilizar:

```java
@Tag
@Operation
@ApiResponses
```

Cada endpoint deberá tener:

- descripción
- código HTTP
- respuestas posibles

---

# 9. DTO

Nunca devolver entidades JPA.

Separar siempre:

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

# 10. Mapper

Toda conversión entre Entity y DTO deberá realizarse mediante la capa Mapper.

Los Controllers y Services nunca realizarán conversiones manuales.

---

# 11. Repository

Los Repository únicamente contendrán operaciones de acceso a datos.

No implementar lógica de negocio.

Todos deberán extender:

```java
JpaRepository
```

---

# 12. Validaciones

Las validaciones de entrada deberán realizarse utilizando Bean Validation.

Ejemplo:

- `@Valid`
- `@NotNull`
- `@NotBlank`
- `@Size`
- `@Email`
- `@Positive`

Los Controllers deberán recibir DTOs anotados con `@Valid`.

---

# 13. Manejo global de excepciones

El proyecto tendrá un manejador global de excepciones.

```
GlobalExceptionHandler
```

Utilizar:

```java
@RestControllerAdvice
```

Las excepciones deberán traducirse a respuestas HTTP consistentes.

No utilizar bloques `try-catch` en Controllers salvo casos excepcionales.

---

# 14. Convenciones de nombres

| Componente | Sufijo |
|------------|--------|
| Controller | Controller |
| Service | Service |
| Implementación | ServiceImpl |
| Repository | Repository |
| Mapper | Mapper |
| Request DTO | Request |
| Response DTO | Response |
| Exception | Exception |

---

# 15. Código limpio

Kiro deberá generar código siguiendo los principios de Clean Code.

- Métodos pequeños.
- Variables con nombres descriptivos.
- Evitar duplicación.
- Evitar código muerto.
- Evitar comentarios innecesarios.
- Priorizar código autoexplicativo.

---

# 16. Restricciones

Kiro no deberá:

- usar `@Data` en entidades.
- usar `@Autowired`.
- usar `EnumType.ORDINAL`.
- devolver entidades desde Controllers.
- acceder al Repository desde Controllers.
- colocar lógica de negocio en Controllers.
- colocar lógica de negocio en Repository.
- omitir `@Transactional` en Services.
- omitir la documentación OpenAPI.