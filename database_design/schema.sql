-- ============================================================
-- REVENANT
-- Schema SQL
-- PostgreSQL
--
-- Parte 1
-- Tablas base
-- ============================================================

BEGIN;

-- ============================================================
-- DROP TABLES
-- ============================================================

DROP TABLE IF EXISTS player_bosses CASCADE;
DROP TABLE IF EXISTS bosses CASCADE;
DROP TABLE IF EXISTS enemies CASCADE;
DROP TABLE IF EXISTS store_items CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS npcs CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS inventories CASCADE;
DROP TABLE IF EXISTS armors CASCADE;
DROP TABLE IF EXISTS consumables CASCADE;
DROP TABLE IF EXISTS shields CASCADE;
DROP TABLE IF EXISTS weapons CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS users_app CASCADE;
DROP TABLE IF EXISTS maps CASCADE;

-- ============================================================
-- MAPS
-- ============================================================

CREATE TABLE maps
(
    id BIGINT GENERATED ALWAYS AS IDENTITY,

    name VARCHAR(80) NOT NULL,

    description TEXT NOT NULL,

    CONSTRAINT pk_maps
        PRIMARY KEY (id),

    CONSTRAINT uq_maps_name
        UNIQUE (name),

    CONSTRAINT uq_maps_description
        UNIQUE (description)
);

COMMENT ON TABLE maps IS
'Catálogo global de mapas del juego.';

COMMENT ON COLUMN maps.name IS
'Nombre único del mapa.';

COMMENT ON COLUMN maps.description IS
'Descripción del mapa.';

-- ============================================================
-- USERS_APP
-- ============================================================

CREATE TABLE users_app
(
    id BIGINT GENERATED ALWAYS AS IDENTITY,

    username VARCHAR(50) NOT NULL,

    email VARCHAR(150) NOT NULL,

    password VARCHAR(255) NOT NULL,

    CONSTRAINT pk_users_app
        PRIMARY KEY (id),

    CONSTRAINT uq_users_username
        UNIQUE (username),

    CONSTRAINT uq_users_email
        UNIQUE (email)
);

COMMENT ON TABLE users_app IS
'Cuentas de usuario del videojuego.';

COMMENT ON COLUMN users_app.password IS
'Contraseña encriptada mediante BCrypt.';

-- ============================================================
-- PLAYERS
-- ============================================================

CREATE TABLE players
(
    id BIGINT GENERATED ALWAYS AS IDENTITY,

    id_user BIGINT NOT NULL,

    id_map BIGINT NOT NULL,

    type_player VARCHAR(20) NOT NULL,

    level INTEGER NOT NULL DEFAULT 1,

    experience INTEGER NOT NULL DEFAULT 0,

    health_points INTEGER NOT NULL DEFAULT 100,

    strong_points INTEGER NOT NULL DEFAULT 10,

    speed_attack_points INTEGER NOT NULL DEFAULT 10,

    gold INTEGER NOT NULL DEFAULT 20,

    pos_x INTEGER NOT NULL DEFAULT 0,

    pos_y INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT pk_players
        PRIMARY KEY (id),

    CONSTRAINT uq_players_user
        UNIQUE (id_user),

    CONSTRAINT fk_players_user
        FOREIGN KEY (id_user)
        REFERENCES users_app(id),

    CONSTRAINT fk_players_map
        FOREIGN KEY (id_map)
        REFERENCES maps(id),

    CONSTRAINT chk_player_type
        CHECK
        (
            type_player IN
            (
                'CABALLERO',
                'MAGO',
                'ARQUERO',
                'ESPADACHIN',
                'GLADIADOR'
            )
        ),

    CONSTRAINT chk_player_level
        CHECK(level >= 1),

    CONSTRAINT chk_player_experience
        CHECK(experience >= 0),

    CONSTRAINT chk_player_hp
        CHECK(health_points >= 0),

    CONSTRAINT chk_player_strong
        CHECK(strong_points >= 0),

    CONSTRAINT chk_player_speed
        CHECK(speed_attack_points >= 0),

    CONSTRAINT chk_player_gold
        CHECK(gold >= 0)
);

COMMENT ON TABLE players IS
'Información persistente del personaje del jugador.';

COMMENT ON COLUMN players.id_map IS
'Mapa donde se encuentra el jugador al guardar la partida.';

-- ============================================================
-- CHARACTERS
-- ============================================================

CREATE TABLE characters
(
    id BIGINT GENERATED ALWAYS AS IDENTITY,

    name VARCHAR(80) NOT NULL,

    description TEXT NOT NULL,

    CONSTRAINT pk_characters
        PRIMARY KEY (id),

    CONSTRAINT uq_character_description
        UNIQUE(description)
);

COMMENT ON TABLE characters IS
'Tabla padre de NPCs y Enemies.';

-- ============================================================
-- NPCS
-- ============================================================

CREATE TABLE npcs
(
    id BIGINT,

    id_map BIGINT NOT NULL,

    phrases TEXT[] DEFAULT '{}',

    CONSTRAINT pk_npcs
        PRIMARY KEY(id),

    CONSTRAINT fk_npc_character
        FOREIGN KEY(id)
        REFERENCES characters(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_npc_map
        FOREIGN KEY(id_map)
        REFERENCES maps(id)
);

COMMENT ON TABLE npcs IS
'NPCs del juego.';

COMMENT ON COLUMN npcs.phrases IS
'Lista de frases que el NPC puede pronunciar.';

-- ============================================================
-- STORES
-- ============================================================

CREATE TABLE stores
(
    id BIGINT GENERATED ALWAYS AS IDENTITY,

    id_npc BIGINT NOT NULL,

    name VARCHAR(80) NOT NULL,

    description TEXT NOT NULL,

    CONSTRAINT pk_stores
        PRIMARY KEY(id),

    CONSTRAINT uq_store_npc
        UNIQUE(id_npc),

    CONSTRAINT uq_store_name
        UNIQUE(name),

    CONSTRAINT fk_store_npc
        FOREIGN KEY(id_npc)
        REFERENCES npcs(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE stores IS
'Tiendas administradas por NPCs.';

COMMENT ON COLUMN stores.id_npc IS
'Relación 1:1 entre NPC y tienda.';


-- ============================================================
-- ITEMS
-- ============================================================

CREATE TABLE items
(
    id BIGINT GENERATED ALWAYS AS IDENTITY,

    name VARCHAR(80) NOT NULL,

    description TEXT NOT NULL,

    item_type VARCHAR(20) NOT NULL,

    price INTEGER NOT NULL DEFAULT 0,

    sell_price INTEGER NOT NULL DEFAULT 0,

    is_special BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT pk_items
        PRIMARY KEY (id),

    CONSTRAINT uq_items_description
        UNIQUE (description),

    CONSTRAINT chk_item_type
        CHECK (
            item_type IN (
                'ARMA',
                'ESCUDO',
                'ARMADURA',
                'CONSUMIBLE'
            )
        ),

    CONSTRAINT chk_item_price
        CHECK (price >= 0),

    CONSTRAINT chk_item_sell_price
        CHECK (sell_price >= 0)
);

COMMENT ON TABLE items IS
'Catálogo global de ítems del juego.';

COMMENT ON COLUMN items.item_type IS
'Discriminador de la jerarquía de herencia.';

-- ============================================================
-- WEAPONS
-- ============================================================

CREATE TABLE weapons
(
    id BIGINT,

    damage INTEGER NOT NULL DEFAULT 0,

    durability INTEGER NOT NULL DEFAULT 100,

    weapon_type VARCHAR(20) NOT NULL,

    weapon_slot VARCHAR(20) NOT NULL,

    CONSTRAINT pk_weapons
        PRIMARY KEY (id),

    CONSTRAINT fk_weapons_item
        FOREIGN KEY (id)
        REFERENCES items(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_weapon_damage
        CHECK (damage >= 0),

    CONSTRAINT chk_weapon_durability
        CHECK (durability >= 0),

    CONSTRAINT chk_weapon_type
        CHECK (
            weapon_type IN (
                'ESPADA',
                'MARTILLO',
                'BASTON',
                'ARCO'
            )
        ),

    CONSTRAINT chk_weapon_slot
        CHECK (
            weapon_slot IN (
                'MANO_PRINCIPAL',
                'MANO_SECUNDARIA'
            )
        )
);

COMMENT ON TABLE weapons IS
'Armas del juego.';

-- ============================================================
-- SHIELDS
-- ============================================================

CREATE TABLE shields
(
    id BIGINT,

    block_points INTEGER NOT NULL DEFAULT 0,

    durability INTEGER NOT NULL DEFAULT 100,

    weapon_slot VARCHAR(20)
        NOT NULL
        DEFAULT 'MANO_SECUNDARIA',

    CONSTRAINT pk_shields
        PRIMARY KEY (id),

    CONSTRAINT fk_shields_item
        FOREIGN KEY (id)
        REFERENCES items(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_shield_block
        CHECK (block_points >= 0),

    CONSTRAINT chk_shield_durability
        CHECK (durability >= 0),

    CONSTRAINT chk_shield_slot
        CHECK (
            weapon_slot IN (
                'MANO_PRINCIPAL',
                'MANO_SECUNDARIA'
            )
        )
);

COMMENT ON TABLE shields IS
'Escudos del juego.';

-- ============================================================
-- CONSUMABLES
-- ============================================================

CREATE TABLE consumables
(
    id BIGINT,

    health_points INTEGER NOT NULL DEFAULT 0,

    strong_points INTEGER NOT NULL DEFAULT 0,

    speed_attack_points INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT pk_consumables
        PRIMARY KEY (id),

    CONSTRAINT fk_consumables_item
        FOREIGN KEY (id)
        REFERENCES items(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_consumable_health
        CHECK (health_points >= 0),

    CONSTRAINT chk_consumable_strong
        CHECK (strong_points >= 0),

    CONSTRAINT chk_consumable_speed
        CHECK (speed_attack_points >= 0)
);

COMMENT ON TABLE consumables IS
'Consumibles del juego.';

-- ============================================================
-- ARMORS
-- ============================================================

CREATE TABLE armors
(
    id BIGINT,

    health_points INTEGER NOT NULL DEFAULT 0,

    strong_points INTEGER NOT NULL DEFAULT 0,

    durability INTEGER NOT NULL DEFAULT 100,

    armor_slot VARCHAR(20) NOT NULL,

    CONSTRAINT pk_armors
        PRIMARY KEY (id),

    CONSTRAINT fk_armors_item
        FOREIGN KEY (id)
        REFERENCES items(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_armor_health
        CHECK (health_points >= 0),

    CONSTRAINT chk_armor_strong
        CHECK (strong_points >= 0),

    CONSTRAINT chk_armor_durability
        CHECK (durability >= 0),

    CONSTRAINT chk_armor_slot
        CHECK (
            armor_slot IN (
                'GUANTES',
                'CASCO',
                'PECHERA',
                'PANTALONES'
            )
        )
);

COMMENT ON TABLE armors IS
'Armaduras del juego.';

-- ============================================================
-- INVENTORIES
-- ============================================================

CREATE TABLE inventories
(
    id BIGINT GENERATED ALWAYS AS IDENTITY,

    id_player BIGINT NOT NULL,

    id_item BIGINT NOT NULL,

    quantity INTEGER NOT NULL DEFAULT 1,

    equipped BOOLEAN NOT NULL DEFAULT FALSE,

    equipped_slot VARCHAR(20),

    CONSTRAINT pk_inventories
        PRIMARY KEY (id),

    CONSTRAINT fk_inventory_player
        FOREIGN KEY (id_player)
        REFERENCES players(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_inventory_item
        FOREIGN KEY (id_item)
        REFERENCES items(id),

    CONSTRAINT uq_inventory_player_item
        UNIQUE (id_player, id_item),

    CONSTRAINT chk_inventory_quantity
        CHECK (quantity >= 0),

    CONSTRAINT chk_inventory_slot
        CHECK (
            equipped_slot IS NULL
            OR equipped_slot IN (
                'MANO_PRINCIPAL',
                'MANO_SECUNDARIA',
                'CASCO',
                'PECHERA',
                'GUANTES',
                'PANTALONES'
            )
        )
);

COMMENT ON TABLE inventories IS
'Inventario de cada jugador.';

COMMENT ON COLUMN inventories.equipped_slot IS
'Slot ocupado cuando el objeto está equipado.';

-- ============================================================
-- STORE_ITEMS
-- ============================================================

CREATE TABLE store_items
(
    id BIGINT GENERATED ALWAYS AS IDENTITY,

    id_store BIGINT NOT NULL,

    id_item BIGINT NOT NULL,

    stock INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT pk_store_items
        PRIMARY KEY (id),

    CONSTRAINT fk_store_items_store
        FOREIGN KEY (id_store)
        REFERENCES stores(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_store_items_item
        FOREIGN KEY (id_item)
        REFERENCES items(id),

    CONSTRAINT uq_store_item
        UNIQUE (id_store, id_item),

    CONSTRAINT chk_store_stock
        CHECK (stock >= 0)
);

COMMENT ON TABLE store_items IS
'Inventario disponible de cada tienda.';

COMMENT ON COLUMN store_items.stock IS
'Cantidad disponible de un ítem específico dentro de una tienda. Valor por defecto 0 (sin stock).';

-- ============================================================
-- ENEMIES
-- ============================================================

CREATE TABLE enemies
(
    id BIGINT,

    id_map BIGINT NOT NULL,

    health_points INTEGER NOT NULL DEFAULT 0,

    damage_points INTEGER NOT NULL DEFAULT 0,

    armor_points INTEGER NOT NULL DEFAULT 0,

    gold_reward INTEGER NOT NULL DEFAULT 0,

    experience_reward INTEGER NOT NULL DEFAULT 0,

    speed_attack_points INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT pk_enemies
        PRIMARY KEY (id),

    CONSTRAINT fk_enemy_character
        FOREIGN KEY (id)
        REFERENCES characters(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_enemy_map
        FOREIGN KEY (id_map)
        REFERENCES maps(id),

    CONSTRAINT chk_enemy_health
        CHECK (health_points >= 0),

    CONSTRAINT chk_enemy_damage
        CHECK (damage_points >= 0),

    CONSTRAINT chk_enemy_armor
        CHECK (armor_points >= 0),

    CONSTRAINT chk_enemy_gold
        CHECK (gold_reward >= 0),

    CONSTRAINT chk_enemy_experience
        CHECK (experience_reward >= 0),

    CONSTRAINT chk_enemy_speed
        CHECK (speed_attack_points >= 0)
);

COMMENT ON TABLE enemies IS
'Catálogo de enemigos del juego.';

COMMENT ON COLUMN enemies.id_map IS
'Mapa donde aparece el enemigo.';

COMMENT ON COLUMN enemies.gold_reward IS
'Oro otorgado al derrotar el enemigo.';

COMMENT ON COLUMN enemies.experience_reward IS
'Experiencia otorgada al derrotar el enemigo.';

-- ============================================================
-- BOSSES
-- ============================================================

CREATE TABLE bosses
(
    id BIGINT,

    CONSTRAINT pk_bosses
        PRIMARY KEY (id),

    CONSTRAINT fk_boss_enemy
        FOREIGN KEY (id)
        REFERENCES enemies(id)
        ON DELETE CASCADE
);

COMMENT ON TABLE bosses IS
'Subtipo de Enemy que representa un jefe del juego.';

-- ============================================================
-- PLAYER_BOSSES
-- ============================================================

CREATE TABLE player_bosses
(
    id BIGINT GENERATED ALWAYS AS IDENTITY,

    id_player BIGINT NOT NULL,

    id_boss BIGINT NOT NULL,

    is_defeat BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT pk_player_bosses
        PRIMARY KEY (id),

    CONSTRAINT fk_player_boss_player
        FOREIGN KEY (id_player)
        REFERENCES players(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_player_boss_boss
        FOREIGN KEY (id_boss)
        REFERENCES bosses(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_player_boss
        UNIQUE (id_player, id_boss)
);

COMMENT ON TABLE player_bosses IS
'Progreso individual de cada jugador frente a los jefes del juego.';

COMMENT ON COLUMN player_bosses.is_defeat IS
'Indica si el jugador ya derrotó al jefe.';

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_players_map
    ON players(id_map);

CREATE INDEX idx_npcs_map
    ON npcs(id_map);

CREATE INDEX idx_store_npc
    ON stores(id_npc);

CREATE INDEX idx_inventory_player
    ON inventories(id_player);

CREATE INDEX idx_inventory_item
    ON inventories(id_item);

CREATE INDEX idx_store_items_store
    ON store_items(id_store);

CREATE INDEX idx_store_items_item
    ON store_items(id_item);

CREATE INDEX idx_enemy_map
    ON enemies(id_map);

CREATE INDEX idx_player_boss_player
    ON player_bosses(id_player);

CREATE INDEX idx_player_boss_boss
    ON player_bosses(id_boss);

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================

COMMIT;

