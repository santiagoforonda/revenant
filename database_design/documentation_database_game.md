# REVENANT — Documentación de Base de Datos

> **Propósito de este documento:** esta es la fuente de verdad (source of truth) del diseño de base de datos del proyecto "Ashen Path". Cualquier agente de IA (Kiro, Claude Code, Gemini, etc.) que genere entidades JPA, migraciones, DTOs o lógica de persistencia debe basarse en este documento y mantenerlo actualizado si el esquema cambia.

- **Motor de base de datos:** PostgreSQL
- **Convención de nombres:** `snake_case` en todas las tablas y columnas
- **Generación de IDs:** `BIGINT GENERATED ALWAYS AS IDENTITY` en todas las tablas (no `SERIAL`)
- **Enums:** simulados con `VARCHAR` + `CHECK constraint` (no se usan tipos `ENUM` nativos de PostgreSQL, para facilitar cambios futuros de valores permitidos sin `ALTER TYPE`)
- **Estrategia de herencia:** `Item` es tabla padre; `Weapon`, `Shield`, `Consumable`, `Armor` son tablas hijas que comparten el mismo `id` que su fila padre en `Items` (equivalente a `@Inheritance(strategy = InheritanceType.JOINED)` en JPA/Hibernate)

---

## 1. Diagrama de relaciones (resumen textual)

```
users_app ──(1:1)── players ──(1:N)── inventories ──(N:1)── items ──(N:M)── store_items ──(N:1)── stores ──(1:1)── npcs
               │                                                │
               │ (N:1)                                ┌─────────┼─────────┬───────────┐
               ▼                                     weapons  shields consumables  armors
             maps ◄──(N:1)── npcs                  (hereda items)(hereda)(hereda items)(hereda)
               ▲
               │ (1:N)
          characters ──(d, total)──┬── npcs
                                    └── enemies ──(d, parcial)── bosses ──(1:N)── player_bosses ──(N:1)── players
```

- Un `user_app` tiene exactamente un `player` (1:1).
- Un `player` puede tener muchas filas en `inventories` (una por cada ítem distinto que posee).
- Un `item` del catálogo puede aparecer en muchas filas de `inventories` (muchos jugadores pueden poseer el mismo ítem).
- `inventories` es la tabla puente que resuelve la relación N:M entre `players` e `items`.
- `items` es la tabla padre de una jerarquía de herencia con 4 subtipos: `weapons`, `shields`, `consumables`, `armors`.
- Un `npc` pertenece a un único `map` (`npcs.id_map`, N:1); un `map` puede tener muchos NPCs.
- Un `npc` puede administrar como máximo una `store` (`stores.id_npc`, relación 1:1; no todo NPC tiene tienda).
- `store_items` es la tabla puente que resuelve la relación N:M entre `stores` e `items` (qué ítems vende cada tienda y con qué stock).
- `characters` es la tabla padre de una jerarquía de herencia (especialización disjunta y total): todo `character` es o un `npc` o un `enemie`.
- `enemies` a su vez tiene una especialización disjunta parcial: algunos enemigos son además `bosses` (no todo enemigo es jefe).
- Un `player` está en un único `map` a la vez (`players.id_map`, N:1); un `map` puede alojar muchos `players`.
- Un `enemie` pertenece a un único `map` (`enemies.id_map`, N:1); un `map` puede tener muchos enemigos.
- `player_bosses` es la tabla puente que registra, por jugador, qué jefes ha derrotado (`is_defeat`) — el progreso de jefes es individual por jugador, no global.

---

## 2. Definición de tablas

### 2.1 `users_app`
Cuentas de usuario / credenciales de login.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | `BIGINT` | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY` | Identificador único |
| username | `VARCHAR(50)` | `NOT NULL`, `UNIQUE` | Nombre de usuario |
| email | `VARCHAR(150)` | `NOT NULL`, `UNIQUE` | Correo electrónico |
| password | `VARCHAR(255)` | `NOT NULL` | Hash de la contraseña (BCrypt). Nunca texto plano |

> Nota: la tabla se llama `users_app` (no `users` ni `user`) porque `user` es palabra reservada en PostgreSQL. Decisión consciente del equipo.

---

### 2.2 `players`
Datos de juego del personaje, 1:1 con `users_app`, N:1 con `maps`.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | `BIGINT` | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY` | Identificador único |
| id_user | `BIGINT` | `NOT NULL`, `UNIQUE`, `FK → users_app(id)` | Relación 1:1 con la cuenta de usuario |
| id_map | `BIGINT` | `NOT NULL`, `FK → maps(id)` | Mapa donde está el jugador actualmente (guardado manual). Reemplaza al antiguo `current_map VARCHAR` para tener integridad referencial real contra el catálogo de mapas |
| type_player | `VARCHAR(20)` | `NOT NULL`, `CHECK IN ('CABALLERO','MAGO','ARQUERO','GLADIADOR','ESPADACHIN')` | Clase del personaje (sin restricciones de equipo, pero determina stats base y kit inicial — ver 4.1/4.2) |
| level | `INTEGER` | `NOT NULL`, `DEFAULT 1`, `CHECK (level >= 1)` | Nivel del jugador |
| experience | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `CHECK (experience >= 0)` | Experiencia acumulada |
| health_points | `INTEGER` | `NOT NULL`, `DEFAULT 100`, `CHECK (health_points >= 0)` | Puntos de vida actuales |
| strong_points | `INTEGER` | `NOT NULL`, `DEFAULT 10`, `CHECK (strong_points >= 0)` | Puntos de fuerza |
| speed_attack_points | `INTEGER` | `NOT NULL`, `DEFAULT 10`, `CHECK (speed_attack_points >= 0)` | Velocidad de ataque |
| gold | `INTEGER` | `NOT NULL`, `DEFAULT 20`, `CHECK (gold >= 0)` | Oro del jugador |
| pos_x | `INTEGER` | `NOT NULL`, `DEFAULT 0` | Posición X del checkpoint guardado |
| pos_y | `INTEGER` | `NOT NULL`, `DEFAULT 0` | Posición Y del checkpoint guardado |

> **Cambio de diseño:** `current_map VARCHAR(50) DEFAULT 'room1'` fue reemplazado por `id_map BIGINT FK → maps(id)`. Ya no tiene `DEFAULT` de columna porque el mapa inicial se asigna explícitamente en el backend al crear el personaje (mismo patrón que las estadísticas base y el equipo inicial — ver sección 4).

---

### 2.3 `items`
Tabla padre — catálogo global de ítems. No depende de un jugador específico.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | `BIGINT` | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY` | Identificador único, compartido con las tablas hijas |
| name | `VARCHAR(80)` | `NOT NULL` | Nombre del ítem |
| description | `TEXT` | `NOT NULL`, `UNIQUE` | Descripción del ítem. Es llave candidata (alterna), no debe repetirse |
| item_type | `VARCHAR(20)` | `NOT NULL`, `CHECK IN ('ARMA','ESCUDO','ARMADURA','CONSUMIBLE')` | Discriminador de la jerarquía de herencia |
| price | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `CHECK (price >= 0)` | Precio de **compra** en la tienda |
| sell_price | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `CHECK (sell_price >= 0)` | Precio que recibe el jugador al **vender** el ítem a una tienda |
| is_special | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | Indica si el ítem es especial/raro. Vive en el padre por decisión consciente: aplica a los 4 subtipos, aunque conceptualmente solo se usa activamente en `weapons` y `consumables` |

---

### 2.4 `weapons` (hereda de `items`)

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | `BIGINT` | `PRIMARY KEY`, `FK → items(id)` | Comparte PK con la fila padre en `items` |
| damage | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `CHECK (damage >= 0)` | Daño del arma |
| durability | `INTEGER` | `NOT NULL`, `DEFAULT 100`, `CHECK (durability >= 0)` | Durabilidad restante |
| weapon_type | `VARCHAR(20)` | `NOT NULL`, `CHECK IN ('ESPADA','MARTILLO','BASTON','ARCO')` | Tipo de arma |
| weapon_slot | `VARCHAR(20)` | `NOT NULL`, `CHECK IN ('MANO_PRINCIPAL','MANO_SECUNDARIA')` | Slot de equipamiento |

---

### 2.5 `shields` (hereda de `items`)

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | `BIGINT` | `PRIMARY KEY`, `FK → items(id)` | Comparte PK con la fila padre en `items` |
| block_points | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `CHECK (block_points >= 0)` | Cuánto daño bloquea/reduce al defender |
| durability | `INTEGER` | `NOT NULL`, `DEFAULT 100`, `CHECK (durability >= 0)` | Durabilidad restante, se desgasta al bloquear |
| weapon_slot | `VARCHAR(20)` | `NOT NULL`, `DEFAULT 'MANO_SECUNDARIA'`, `CHECK IN ('MANO_PRINCIPAL','MANO_SECUNDARIA')` | Reutiliza el mismo dominio de slot que `weapons` |

---

### 2.6 `consumables` (hereda de `items`)

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | `BIGINT` | `PRIMARY KEY`, `FK → items(id)` | Comparte PK con la fila padre en `items` |
| health_points | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `CHECK (health_points >= 0)` | Vida que restaura al consumirse |
| strong_points | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `CHECK (strong_points >= 0)` | Boost temporal de fuerza |
| speed_attack_points | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `CHECK (speed_attack_points >= 0)` | Boost temporal de velocidad de ataque |

---

### 2.7 `armors` (hereda de `items`)

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | `BIGINT` | `PRIMARY KEY`, `FK → items(id)` | Comparte PK con la fila padre en `items` |
| health_points | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `CHECK (health_points >= 0)` | Vida adicional que otorga |
| strong_points | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `CHECK (strong_points >= 0)` | Fuerza adicional que otorga |
| durability | `INTEGER` | `NOT NULL`, `DEFAULT 100`, `CHECK (durability >= 0)` | Durabilidad restante |
| armor_slot | `VARCHAR(20)` | `NOT NULL`, `CHECK IN ('GUANTES','CASCO','PECHERA','PANTALONES')` | Slot de equipamiento |

---

### 2.8 `inventories`
Tabla puente N:M entre `players` e `items`. Representa el inventario de cada jugador.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | `BIGINT` | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY` | Identificador único de la fila de inventario |
| id_player | `BIGINT` | `NOT NULL`, `FK → players(id)` | Jugador dueño de este registro |
| id_item | `BIGINT` | `NOT NULL`, `FK → items(id)` | Ítem del catálogo referenciado |
| quantity | `INTEGER` | `NOT NULL`, `DEFAULT 1`, `CHECK (quantity >= 0)` | Cantidad que posee (relevante para consumibles apilables) |
| equipped | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | Si el ítem está actualmente equipado |
| equipped_slot | `VARCHAR(20)` | Nullable | Valor de `armor_slot` o `weapon_slot` según el tipo del ítem equipado; `null` si es `consumable` |

**Restricción compuesta:** `UNIQUE (id_player, id_item)` — un jugador no puede tener dos filas distintas para el mismo ítem; la cantidad se incrementa en la fila existente en vez de crear una nueva.

---

### 2.9 `maps`
Catálogo global de mapas/salas del juego.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | `BIGINT` | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY` | Identificador único |
| name | `VARCHAR(80)` | `NOT NULL`, `UNIQUE` | Nombre del mapa/sala |
| description | `TEXT` | `NOT NULL`, `UNIQUE` | Descripción del mapa |

---

### 2.10 `characters`
Tabla padre — cualquier personaje no jugable del mundo (NPC o enemigo). Especialización disjunta y total: toda fila de `characters` es exactamente una de `npcs` o `enemies`.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | `BIGINT` | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY` | Identificador único, compartido con `npcs`/`enemies` |
| name | `VARCHAR(80)` | `NOT NULL` | Nombre del personaje |
| description | `TEXT` | `NOT NULL`, `UNIQUE` | Descripción/lore del personaje |

---

### 2.11 `npcs` (hereda de `characters`)

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | `BIGINT` | `PRIMARY KEY`, `FK → characters(id)` | Comparte PK con la fila padre en `characters` |
| phrases | `TEXT[]` | `DEFAULT {}` | Coleccion de frases del NPC |
| id_map | `BIGINT` | `NOT NULL`, `FK → maps(id)` | Mapa donde se encuentra el NPC |


---

### 2.12 `enemies` (hereda de `characters`)
N:1 con `maps`: cada enemigo pertenece a un único mapa; un mapa puede tener muchos enemigos.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | `BIGINT` | `PRIMARY KEY`, `FK → characters(id)` | Comparte PK con la fila padre en `characters` |
| id_map | `BIGINT` | `NOT NULL`, `FK → maps(id)` | Mapa donde aparece este enemigo |
| health_points | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `CHECK (health_points >= 0)` | Vida del enemigo |
| damage_points | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `CHECK (damage_points >= 0)` | Daño que inflige por ataque |
| armor_points | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `CHECK (armor_points >= 0)` | Reduce el daño recibido |
| gold_reward | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `CHECK (gold_reward >= 0)` | Oro que otorga al morir |
| experience_reward | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `CHECK (experience_reward >= 0)` | Experiencia que otorga al morir |
| speed_attack_points | `INTEGER` | `NOT NULL`, `DEFAULT 10`, `CHECK (speed_attack_points >= 0)` | Velocidad de ataque (mismo criterio que `players.speed_attack_points`: a mayor valor, ataca más rápido) |

---

### 2.13 `bosses` (hereda de `enemies`)
Especialización disjunta y parcial de `enemies`: no todo enemigo es jefe. Herencia doble: `characters → enemies → bosses`.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | `BIGINT` | `PRIMARY KEY`, `FK → enemies(id)` | Comparte PK con la fila padre en `enemies` |

> Sin columnas propias adicionales por ahora (todas las estadísticas de combate ya viven en `enemies`). `is_defeat` **no** vive aquí — ver `player_bosses` (2.14) y la nota de diseño más abajo.

---

### 2.14 `player_bosses`
Tabla puente que registra, **por jugador**, qué jefes ha derrotado.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | `BIGINT` | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY` | Identificador único |
| id_player | `BIGINT` | `NOT NULL`, `FK → players(id)` | Jugador dueño del registro de progreso |
| id_boss | `BIGINT` | `NOT NULL`, `FK → bosses(id)` | Jefe referenciado |
| is_defeat | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | Si este jugador ya derrotó a este jefe |

**Restricción compuesta:** `UNIQUE (id_player, id_boss)` — un jugador no puede tener dos filas de progreso para el mismo jefe.

> **Nota de diseño importante:** en una versión anterior del diagrama lógico, `is_defeat` vivía directamente en `bosses` (catálogo global). Se corrigió a una tabla puente por jugador porque `bosses` es un catálogo compartido por todos los `users_app`/`players` — si `is_defeat` fuera una columna de `bosses`, derrotar al jefe marcaría la victoria para **todos** los jugadores del juego, no solo para quien lo derrotó. Decisión validada explícitamente con el usuario.

---

### 2.15 `stores`
Tienda administrada por un NPC. Relación 1:1 con `npcs`.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | `BIGINT` | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY` | Identificador único |
| id_npc | `BIGINT` | `NOT NULL`, `UNIQUE`, `FK → npcs(id)` | NPC dueño de la tienda (relación 1:1) |
| name | `VARCHAR(80)` | `NOT NULL`, `UNIQUE` | Nombre de la tienda |
| description | `TEXT` | `NOT NULL` | Descripción de la tienda |

---

### 2.16 `store_items`
Tabla puente N:M entre `stores` e `items`. Representa el catálogo de ítems que vende cada tienda.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | `BIGINT` | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY` | Identificador único |
| id_store | `BIGINT` | `NOT NULL`, `FK → stores(id)` | Tienda dueña del registro |
| id_item | `BIGINT` | `NOT NULL`, `FK → items(id)` | Ítem del catálogo que vende la tienda |
| stock | `INTEGER` | `NOT NULL`, `DEFAULT 0`, `CHECK (stock >= 0)` | Cantidad disponible de este ítem en la tienda. `0` significa sin stock (agotado) |

**Restricción compuesta:** `UNIQUE (id_store, id_item)` — una tienda no puede tener dos filas distintas para el mismo ítem.

---

## 3. Dominios de valores (enums simulados)

| Dominio | Valores permitidos | Usado en |
|---|---|---|
| `type_player` | `CABALLERO`, `MAGO`, `ARQUERO`, `GLADIADOR`, `ESPADACHIN` | `players.type_player` |
| `item_type` | `ARMA`, `ESCUDO`, `ARMADURA`, `CONSUMIBLE` | `items.item_type` |
| `armor_slot` | `GUANTES`, `CASCO`, `PECHERA`, `PANTALONES` | `armors.armor_slot` |
| `weapon_type` | `ESPADA`, `MARTILLO`, `BASTON`, `ARCO` | `weapons.weapon_type` |
| `weapon_slot` | `MANO_PRINCIPAL`, `MANO_SECUNDARIA` | `weapons.weapon_slot`, `shields.weapon_slot` |
| `equipped_slot` (inventories) | `MANO_PRINCIPAL`, `MANO_SECUNDARIA`, `CASCO`, `PECHERA`, `GUANTES`, `PANTALONES` | `inventories.equipped_slot` — unión de `weapon_slot` + `armor_slot`, ya que un ítem equipado puede ser arma/escudo o armadura |

---

## 4. Reglas de negocio relevantes para el backend

1. La clase del jugador (`type_player`) es **estética a nivel de restricciones de equipo** (no limita qué armas o armaduras puede llevar un jugador), pero **sí determina las estadísticas base con las que nace el personaje** y su **equipo inicial** (ver 4.1 y 4.2). Ambas reglas se aplican **una sola vez, en el momento de creación del personaje**, y viven en la capa de servicio de Spring Boot (no como `DEFAULT` de columna ni trigger de PostgreSQL) — los `DEFAULT` actuales de `players.health_points`, `players.strong_points` y `players.speed_attack_points` en `schema.sql` (100/10/10) son solo un *fallback* genérico y no reflejan las estadísticas reales por clase.
2. El guardado de progreso es **manual** (botón "guardar"), no automático por checkpoints. El backend expone un endpoint de guardado explícito que actualiza `players` (stats, `current_map`, `pos_x`, `pos_y`).

### 4.1 Estadísticas base por clase (`type_player`)

`speed_attack_points` (velocidad de ataque): **a mayor valor, más rápido ataca el personaje** (no es un "tiempo de espera", es una magnitud directamente proporcional a la velocidad).

| Clase | health_points | strong_points | speed_attack_points | Filosofía |
|---|---|---|---|---|
| `CABALLERO` | 110 | 15 | 12 | Balanceada entre las tres estadísticas |
| `MAGO` | 80 | 9 | 16 | Poca vida, velocidad de ataque por encima del balanceado |
| `ARQUERO` | 75 | 8 | 20 | Menos vida y fuerza que el resto, **la mayor velocidad de ataque de todas las clases** |
| `ESPADACHIN` | 95 | 11 | 18 | Segunda mayor velocidad de ataque, fuerza baja |
| `GLADIADOR` | 130 | 22 | 8 | La mayor fuerza, **la menor velocidad de ataque de todas las clases** |

Orden de velocidad de ataque (mayor a menor): `ARQUERO` (20) > `ESPADACHIN` (18) > `MAGO` (16) > `CABALLERO` (12) > `GLADIADOR` (8).
Orden de fuerza (mayor a menor): `GLADIADOR` (22) > `CABALLERO` (15) > `ESPADACHIN` (11) > `MAGO` (9) > `ARQUERO` (8).

> Estos valores son el punto de partida para la hackaton; pueden calibrarse durante el balanceo del backend sin que cambie el modelo de datos.

### 4.2 Equipo inicial por clase

Al crear el personaje, el backend debe insertar automáticamente en `inventories` (con `equipped = true` y `equipped_slot` correspondiente) el kit básico de la clase elegida, usando ítems ya existentes en el catálogo (`items`):

| Clase | Arma(s) | Escudo | Armadura |
|---|---|---|---|
| `CABALLERO` | 1 espada corta (`MANO_PRINCIPAL`) | 1 escudo de madera (`MANO_SECUNDARIA`) | Set completo de cuero (guantes, casco, pechera, pantalones) |
| `MAGO` | 1 bastón de madera (`MANO_PRINCIPAL`) | — (sin escudo) | Túnica (pechera) y sombrero (casco) — sin guantes ni pantalones |
| `ARQUERO` | 1 arco corto (`MANO_PRINCIPAL`) | — (sin escudo) | Set básico de cazador (guantes, casco, pechera, pantalones) |
| `ESPADACHIN` | 2 espadas cortas, una en `MANO_PRINCIPAL` y otra en `MANO_SECUNDARIA` (dual wield, sin escudo) | — (sin escudo) | Set ligero básico (guantes, casco, pechera, pantalones) |
| `GLADIADOR` | 1 martillo de guerra (`MANO_PRINCIPAL`) | — (sin escudo) | Set de guerrero del coliseo romano (guantes, casco, pechera, pantalones) |

> Nota sobre `ESPADACHIN`: como `weapon_slot` es un dominio compartido entre `weapons` y `shields` (`MANO_PRINCIPAL`/`MANO_SECUNDARIA`), es válido que dos filas de `weapons` (dos catálogos distintos de "espada corta", una por slot) queden equipadas simultáneamente en `inventories` para el mismo jugador — no se requiere ningún cambio de esquema para el dual wield.
3. Un mismo `item` del catálogo puede estar poseído por múltiples jugadores simultáneamente (relación N:M vía `inventories`).
4. `description` en `items` debe ser único — no puede haber dos ítems con la misma descripción textual. La misma regla de unicidad de `description` aplica a `maps` y a `characters` (y por herencia, a `npcs`/`enemies`/`bosses`).
5. `is_special` vive en la tabla padre `items` y aplica a los 4 subtipos, aunque su uso funcional principal está pensado para `weapons` y `consumables`.
6. `weapon_slot` es un dominio compartido entre `weapons` y `shields`, ya que ambos se equipan en las manos del jugador (principal/secundaria).
7. Un `enemie` pertenece a exactamente un `map` (`enemies.id_map`, N:1); no existe tabla puente para esta relación porque no es N:M — un enemigo de un mapa no "aparece" en otro mapa distinto (si se necesita el mismo tipo de enemigo en varios mapas, se crea una fila nueva en `enemies` por mapa).
8. Al morir un `enemie` (común o jefe), el backend debe acreditar `gold_reward` y `experience_reward` al `player` que lo derrotó, actualizando `players.gold` y `players.experience`.
9. Cuando el enemigo derrotado es además un `boss` (fila presente en `bosses`), el backend debe además crear o actualizar la fila correspondiente en `player_bosses` (`is_defeat = true`) para ese jugador específico — nunca modificar un estado global del jefe.
10. Todo `character` es exactamente `npc` o `enemie` (especialización disjunta y total); todo `enemie` puede o no ser además `boss` (especialización disjunta y parcial).
11. `enemies` no persiste posición (`position_x`/`position_y`): cada fila es una **definición de spawn** (una especie de enemigo asociada a un mapa, con sus estadísticas), no una instancia individual ubicada en coordenadas concretas. Instanciar varios enemigos concretos en pantalla a partir de una misma fila (cuántos, en qué posición exacta dentro del mapa) es responsabilidad del backend/frontend en tiempo de ejecución, no de la base de datos.
12. Un `npc` puede o no administrar una `store` (relación 1:1 opcional desde el lado de `npcs`): no todo NPC es tendero.
13. Precio de **compra** vs precio de **venta**: `items.price` es lo que le cuesta al jugador comprar el ítem en una tienda; `items.sell_price` es lo que recibe el jugador al vender el ítem a una tienda. Ambos viven en el catálogo global `items` (no por tienda), por lo que el precio de compra/venta de un ítem es el mismo en todas las tiendas del juego.
14. `store_items.stock` es siempre un número definido (`NOT NULL`, `DEFAULT 0`) que representa la cantidad disponible de ese ítem en esa tienda; `0` significa que el ítem está agotado en esa tienda. El backend debe validar `stock > 0` antes de permitir una compra y descontar la cantidad comprada del valor almacenado.

## 5. Fuera de alcance / explícitamente excluido
- No hay columnas de auditoría (`created_at`/`updated_at`) — decisión consciente, no se requieren para el alcance de la hackaton.
- No hay columna `tex_key`/referencia a sprite en `items` — la resolución de qué textura usar para cada ítem se maneja del lado del frontend, no en la base de datos.
- No hay columna `birthday` en `users_app` — decisión consciente, no se requiere.
- No hay tabla de conexiones entre mapas (qué mapa lleva a cuál) — se maneja del lado del frontend/Phaser por ahora.
- No hay tabla de drops de ítems por enemigo — por ahora los enemigos solo otorgan `gold_reward` y `experience_reward` al morir.
- `maps` no tiene columna `zone` ni `is_safe_zone` — decisión confirmada tras validar el diagrama físico; la agrupación por zona (si se necesita) se maneja fuera de la base de datos por ahora.