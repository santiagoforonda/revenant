# Revenant Backend API

Este documento resume las peticiones esperadas por cada controlador del backend y las respuestas que devuelve, para que el cliente frontend pueda consultar el contrato de consumo sin leer el codigo fuente.

Todas las rutas viven bajo `/api` y, salvo los endpoints de autenticacion, requieren `Authorization: Bearer <token>`.

## Formato general de errores

Cuando una peticion falla, el backend responde con un `ErrorResponse` en JSON:

```json
{
	"status": 400,
	"message": "Invalid input data",
	"timestamp": "2026-07-18T12:00:00"
}
```

Campos:

- `status`: codigo HTTP devuelto.
- `message`: descripcion del error.
- `timestamp`: momento en que se genero el error.

---

## AuthenticationController

Base path: `/api/auth`

### POST `/api/auth/register`

Registra un usuario nuevo y crea su perfil inicial.

Request JSON:

```json
{
	"username": "player1",
	"email": "player1@mail.com",
	"password": "secret123",
	"playerType": "CABALLERO"
}
```

Campos esperados:

- `username`: string, obligatorio, entre 3 y 50 caracteres.
- `email`: string, obligatorio, formato email valido.
- `password`: string, obligatorio, minimo 8 caracteres.
- `playerType`: enum `PlayerType`, obligatorio.

Response JSON `201 Created`:

```json
{
	"userId": 1,
	"username": "player1",
	"email": "player1@mail.com"
}
```

Errores posibles:

- `400 Bad Request` -> datos invalidos.
- `409 Conflict` -> username o email ya registrado.

### POST `/api/auth/login`

Autentica un usuario y devuelve el JWT junto con el estado actual del jugador.

Request JSON:

```json
{
	"username": "player1",
	"password": "secret123"
}
```

Campos esperados:

- `username`: string, obligatorio.
- `password`: string, obligatorio.

Response JSON `200 OK`:

```json
{
	"token": "eyJhbGciOiJIUzI1NiJ9...",
	"tokenType": "Bearer",
	"username": "player1",
	"mapId": 1,
	"posX": 10,
	"posY": 12,
	"healthPoints": 100,
	"strongPoints": 15,
	"speedAttackPoints": 8,
	"gold": 250,
	"level": 3,
	"experience": 120,
	"typePlayer": "CABALLERO",
	"inventory": [
        {
		"itemId": 5,
		"name": "Health Potion",
		"description": "Restores health",
		"itemType": "CONSUMABLE",
		"price": 20,
		"sellPrice": 10,
		"isSpecial": false,
		"quantity": 3,
		"equipped": false,
		"equippedSlot": null
	    },
    ]
}
```

Errores posibles:

- `400 Bad Request` -> datos invalidos.
- `401 Unauthorized` -> credenciales invalidas.

---

## CombatController

Base path: `/api/combat`

### POST `/api/combat/reward`

Procesa la recompensa de combate despues de derrotar un enemigo.

Request JSON:

```json
{
	"enemyId": 10
}
```

Campos esperados:

- `enemyId`: long positivo, obligatorio.

Response JSON `200 OK`:

```json
{
	"goldObtained": 25,
	"experienceObtained": 40,
	"currentGold": 275,
	"currentExperience": 160,
	"currentLevel": 3,
	"bossDefeated": false
}
```

Errores posibles:

- `400 Bad Request` -> enemyId invalido.
- `401 Unauthorized` -> token JWT invalido o ausente.
- `404 Not Found` -> enemigo no encontrado.

---

## InventoryController

Base path: `/api/inventory`

### POST `/api/inventory`

Agrega un item al inventario del jugador autenticado.

Request JSON:

```json
{
	"itemId": 5,
	"quantity": 1
}
```

Campos esperados:

- `itemId`: long, obligatorio.
- `quantity`: entero mayor o igual a 0, obligatorio.

Response JSON `200 OK`:

```json
{
	"itemId": 5,
	"name": "Health Potion",
	"description": "Restores health",
	"itemType": "CONSUMABLE",
	"price": 20,
	"sellPrice": 10,
	"isSpecial": false,
	"quantity": 2,
	"equipped": false,
	"equippedSlot": null
}
```

### PUT `/api/inventory`

Actualiza la cantidad de un item existente en el inventario.

Request JSON:

```json
{
	"itemId": 5,
	"quantity": 3
}
```

Campos esperados:

- `itemId`: long, obligatorio.
- `quantity`: entero mayor o igual a 0, obligatorio.

Response JSON `200 OK`:

```json
{
	"itemId": 5,
	"name": "Health Potion",
	"description": "Restores health",
	"itemType": "CONSUMABLE",
	"price": 20,
	"sellPrice": 10,
	"isSpecial": false,
	"quantity": 3,
	"equipped": false,
	"equippedSlot": null
}
```

### DELETE `/api/inventory/{itemId}`

Elimina un item del inventario.

Parametros de ruta:

- `itemId`: identificador del item.

Response `204 No Content`.

### GET `/api/inventory`

Devuelve todos los items del inventario del jugador autenticado.

Response JSON `200 OK`:

```json
[
	{
		"itemId": 5,
		"name": "Health Potion",
		"description": "Restores health",
		"itemType": "CONSUMABLE",
		"price": 20,
		"sellPrice": 10,
		"isSpecial": false,
		"quantity": 3,
		"equipped": false,
		"equippedSlot": null
	}
]
```

Errores posibles:

- `400 Bad Request` -> datos invalidos.
- `401 Unauthorized` -> token invalido o ausente.
- `404 Not Found` -> item o registro de inventario no encontrado.

---

## PlayerController

Base path: `/api/player`

### PUT `/api/player/save`

Guarda la posicion actual del jugador en el mapa.

Request JSON:

```json
{
	"mapId": 1,
	"positionX": 10,
	"positionY": 12
}
```

Campos esperados:

- `mapId`: long, obligatorio.
- `positionX`: entero, obligatorio.
- `positionY`: entero, obligatorio.

Response `200 OK`:

```json
"Game save successfully"
```

Nota:

- este endpoint devuelve un string, no un objeto JSON.

Errores posibles:

- `400 Bad Request` -> datos invalidos.

---

## ShoppingController

Base path: `/api/shop`

### POST `/api/shop/purchase`

Procesa la compra de un item de tienda para el jugador autenticado.

Request JSON:

```json
{
	"storeItemId": 8
}
```

Campos esperados:

- `storeItemId`: long, obligatorio.

Response JSON `200 OK`:

```json
{
	"itemId": 8,
	"itemName": "Iron Sword",
	"quantity": 1,
	"remainingGold": 180
}
```

Errores posibles:

- `400 Bad Request` -> datos invalidos, oro insuficiente o stock agotado.
- `401 Unauthorized` -> token invalido o ausente.
- `404 Not Found` -> item de tienda no encontrado.

---

## StoreController

Base path: `/api`

### GET `/api/maps/{mapId}/stores`

Obtiene las tiendas disponibles en un mapa.

Parametros de ruta:

- `mapId`: identificador del mapa.

Response JSON `200 OK`:

```json
[
	{
		"storeId": 1,
		"storeName": "General Store"
	}
]
```

### GET `/api/stores/{storeId}/items`

Obtiene los items vendidos por una tienda especifica.

Parametros de ruta:

- `storeId`: identificador de la tienda.

Response JSON `200 OK`:

```json
[
	{
		"itemId": 8,
		"itemName": "Iron Sword",
		"price": 120,
		"stock": 4
	}
]
```

Errores posibles:

- `401 Unauthorized` -> token invalido o ausente.
- `404 Not Found` -> tienda no encontrada.

---

## WorldController

Base path: `/api/world`

### GET `/api/world/maps`

Obtiene todos los mapas disponibles para el jugador autenticado.

Response JSON `200 OK`:

```json
[
	{
		"id": 1,
		"name": "Starting Village",
		"description": "The first safe area"
	}
]
```

### GET `/api/world/maps/enemies/{id}`

Obtiene los enemigos de un mapa especifico.

Parametros de ruta:

- `id`: identificador del mapa.

Response JSON `200 OK`:

```json
[
	{
		"id": 10,
		"id_map": 1,
		"healthPoints": 40,
		"damagePoints": 8,
		"armorPoints": 2,
		"goldReward": 25,
		"xpReward": 40,
		"speedAttackPoints": 6,
		"name": "Goblin",
		"description": "A weak enemy"
	}
]
```

### GET `/api/world/maps/npc/{id}`

Obtiene los NPCs de un mapa especifico.

Parametros de ruta:

- `id`: identificador del mapa.

Response JSON `200 OK`:

```json
[
	{
		"id": 20,
		"id_map": 1,
		"name": "Old Merchant",
		"description": "Offers guidance to the player",
		"phrases": ["Welcome traveler", "Stay safe"]
	}
]
```

Errores posibles:

- `401 Unauthorized` -> token invalido o ausente.

---

## Resumen rapido por controlador

- `AuthenticationController` -> `RegisterRequest`, `LoginRequest` -> `RegisterResponse`, `LoginResponse`
- `CombatController` -> `CombatRewardRequest` -> `CombatRewardResponse`
- `InventoryController` -> `AddInventoryItemRequest`, `UpdateInventoryRequest`, `itemId` por ruta -> `InventoryItemResponse` o `204 No Content`
- `PlayerController` -> `SaveGameRequest` -> string de confirmacion
- `ShoppingController` -> `PurchaseItemRequest` -> `PurchaseItemResponse`
- `StoreController` -> `mapId` / `storeId` por ruta -> `StoreResponse`, `StoreItemResponse`
- `WorldController` -> sin request body, solo rutas -> `MapResponse`, `EnemyResponse`, `NpcResponse`

Este README debe mantenerse sincronizado con los controladores y DTOs cada vez que cambie la API.
