-- ============================================================
-- REVENANT
-- Seed SQL
-- PostgreSQL
--
-- Datos iniciales de catálogo: mapas, NPCs, enemigos/jefes,
-- ítems (kits iniciales por clase + catálogo de tiendas) y tiendas.
--
-- No incluye users_app / players / inventories: esas filas se
-- crean en tiempo de ejecución (registro de usuario, creación de
-- personaje) por la capa de servicio de Spring Boot.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. MAPS
-- ============================================================

INSERT INTO maps (name, description) VALUES
('Bosque Encantado',
 'Un lugar de aparente belleza que esconde peligros en cada rincón. Punto de partida del viejo caballero.'),
('Desierto de los Escorpiones y las Ruinas',
 'Un páramo abrasador salpicado de ruinas de una civilización olvidada, custodiado por criaturas implacables.'),
('Reino Caído del Rey Haalndzaz',
 'El reino del rey Haalndzaz, destruido por el ataque de los no muertos liderados por Veelfeth.');


-- ============================================================
-- 2. CHARACTERS -> NPCS (14 registros)
-- ============================================================

-- ---- Bosque Encantado (5 NPCs) ----

INSERT INTO characters (name, description) VALUES
('Dama del Lago',
 'Una figura etérea que habita las aguas quietas del Bosque Encantado, guardiana de antiguos secretos y voluntades perdidas.');

INSERT INTO npcs (id, phrases, id_map)
SELECT c.id,
       ARRAY[
           'Las aguas no mienten, viejo caballero. Reflejan lo que fuiste y lo que aún puedes ser.',
           'Muchos vinieron buscando perdón. Pocos estaban dispuestos a pagar su precio.',
           'El bosque te dejará pasar... si demuestras que aún mereces caminarlo.'
       ],
       m.id
FROM characters c, maps m
WHERE c.description = 'Una figura etérea que habita las aguas quietas del Bosque Encantado, guardiana de antiguos secretos y voluntades perdidas.'
  AND m.name = 'Bosque Encantado';

INSERT INTO characters (name, description) VALUES
('Mercader Errante',
 'Un comerciante ambulante que instaló su carreta a la entrada del Bosque Encantado, siempre dispuesto a vender lo básico para sobrevivir.');

INSERT INTO npcs (id, phrases, id_map)
SELECT c.id,
       ARRAY[
           'Nada de lujos aquí, pero todo lo que necesitas para no morir en el primer paso.',
           '¿Oro? Siempre es bienvenido. ¿Historias? Mejor cuéntamelas después de sobrevivir.'
       ],
       m.id
FROM characters c, maps m
WHERE c.description = 'Un comerciante ambulante que instaló su carreta a la entrada del Bosque Encantado, siempre dispuesto a vender lo básico para sobrevivir.'
  AND m.name = 'Bosque Encantado';

INSERT INTO characters (name, description) VALUES
('Anciano Ermitaño',
 'Un viejo sabio que vive recluido entre los árboles más antiguos del bosque, hablando en acertijos sobre la catástrofe que asoló el reino.');

INSERT INTO npcs (id, phrases, id_map)
SELECT c.id,
       ARRAY[
           'La noche en que cayó tu escuadrón no fue casualidad, caballero. Nada en este mundo roto lo es.',
           'Sigue caminando. Las respuestas están más allá del bosque, en la arena que quema.'
       ],
       m.id
FROM characters c, maps m
WHERE c.description = 'Un viejo sabio que vive recluido entre los árboles más antiguos del bosque, hablando en acertijos sobre la catástrofe que asoló el reino.'
  AND m.name = 'Bosque Encantado';

INSERT INTO characters (name, description) VALUES
('Curandera del Bosque',
 'Una mujer que recorre el Bosque Encantado curando a los pocos viajeros que aún se aventuran por sus senderos.');

INSERT INTO npcs (id, phrases, id_map)
SELECT c.id,
       ARRAY[
           'Tus heridas sanarán, pero las que llevas por dentro... esas solo tú puedes cerrarlas.',
           'Ten cuidado con los lobos. Cazan en manada y no perdonan a los distraídos.'
       ],
       m.id
FROM characters c, maps m
WHERE c.description = 'Una mujer que recorre el Bosque Encantado curando a los pocos viajeros que aún se aventuran por sus senderos.'
  AND m.name = 'Bosque Encantado';

INSERT INTO characters (name, description) VALUES
('Guardián del Sendero',
 'Un antiguo soldado del reino que decidió quedarse en el bosque, vigilando el camino que lleva hacia el desierto.');

INSERT INTO npcs (id, phrases, id_map)
SELECT c.id,
       ARRAY[
           'Más allá de estos árboles solo hay arena, huesos y un jefe que no perdona.',
           'Si el minotauro cae ante tu espada, el paso hacia el desierto será tuyo.'
       ],
       m.id
FROM characters c, maps m
WHERE c.description = 'Un antiguo soldado del reino que decidió quedarse en el bosque, vigilando el camino que lleva hacia el desierto.'
  AND m.name = 'Bosque Encantado';

-- ---- Desierto de los Escorpiones y las Ruinas (4 NPCs) ----

INSERT INTO characters (name, description) VALUES
('Comerciante del Oasis',
 'Un mercader instalado en el único oasis del desierto, con mercancía de mejor calidad que la del bosque, a un precio acorde.');

INSERT INTO npcs (id, phrases, id_map)
SELECT c.id,
       ARRAY[
           'Aquí encontrarás acero de verdad, no las sobras del bosque.',
           'El oasis es el único lugar seguro entre las ruinas. Aprovecha mientras dure.'
       ],
       m.id
FROM characters c, maps m
WHERE c.description = 'Un mercader instalado en el único oasis del desierto, con mercancía de mejor calidad que la del bosque, a un precio acorde.'
  AND m.name = 'Desierto de los Escorpiones y las Ruinas';

INSERT INTO characters (name, description) VALUES
('Nómada del Desierto',
 'Un viajero solitario que conoce cada duna y cada ruina del desierto, superviviente de más de una emboscada de bandidos.');

INSERT INTO npcs (id, phrases, id_map)
SELECT c.id,
       ARRAY[
           'Los bandidos no negocian. Atacan primero y preguntan nunca.',
           'Las ruinas esconden más que oro. Esconden la verdad de lo que pasó aquí.'
       ],
       m.id
FROM characters c, maps m
WHERE c.description = 'Un viajero solitario que conoce cada duna y cada ruina del desierto, superviviente de más de una emboscada de bandidos.'
  AND m.name = 'Desierto de los Escorpiones y las Ruinas';

INSERT INTO characters (name, description) VALUES
('Buscador de Reliquias',
 'Un excavador obsesionado con desenterrar los restos de la civilización olvidada que yace bajo las arenas.');

INSERT INTO npcs (id, phrases, id_map)
SELECT c.id,
       ARRAY[
           'Cada ruina que excavo me acerca más a entender qué despertó a los duendes de sus tumbas.',
           'El mago oscuro protege algo en las profundidades. Algo que no debería haber sido tocado.'
       ],
       m.id
FROM characters c, maps m
WHERE c.description = 'Un excavador obsesionado con desenterrar los restos de la civilización olvidada que yace bajo las arenas.'
  AND m.name = 'Desierto de los Escorpiones y las Ruinas';

INSERT INTO characters (name, description) VALUES
('Vidente de las Arenas',
 'Una mujer ciega que lee el futuro en los remolinos de arena del desierto, temida y respetada por igual.');

INSERT INTO npcs (id, phrases, id_map)
SELECT c.id,
       ARRAY[
           'Veo acero oscuro y un rey caído en tu camino, viejo caballero.',
           'La arena recuerda cada batalla. Esta tierra nunca olvida a los que la traicionaron.'
       ],
       m.id
FROM characters c, maps m
WHERE c.description = 'Una mujer ciega que lee el futuro en los remolinos de arena del desierto, temida y respetada por igual.'
  AND m.name = 'Desierto de los Escorpiones y las Ruinas';

-- ---- Reino Caído del Rey Haalndzaz (5 NPCs) ----

INSERT INTO characters (name, description) VALUES
('Caballero Feroz',
 'Un caballero que ha caído en la derrota, no pudo proteger al reino y ahora se encuentra vagando solo en la melancolía esperando el momento de una nueva oportunidad, tal vez más adelante demuestre quien es.');

INSERT INTO npcs (id, phrases, id_map)
SELECT c.id,
       ARRAY[
           'No pude proteger a mi rey. No pude proteger a mi gente. Y aún así, sigo aquí, vagando.',
           'Tú también cargas con tus fallas, ¿no es así? Tal vez por eso el reino nos dejó a ambos con vida.',
           'Si algún día encuentro el valor, tal vez te demuestre quién fui antes de esta derrota.'
       ],
       m.id
FROM characters c, maps m
WHERE c.description = 'Un caballero que ha caído en la derrota, no pudo proteger al reino y ahora se encuentra vagando solo en la melancolía esperando el momento de una nueva oportunidad, tal vez más adelante demuestre quien es.'
  AND m.name = 'Reino Caído del Rey Haalndzaz';

INSERT INTO characters (name, description) VALUES
('Anticuario de las Ruinas',
 'El último comerciante del Reino Caído, atesora las reliquias más valiosas y peligrosas que aún quedan entre las ruinas del castillo.');

INSERT INTO npcs (id, phrases, id_map)
SELECT c.id,
       ARRAY[
           'Lo que ves aquí no se encuentra en ningún otro rincón del mundo. Ni en el bosque, ni en el desierto.',
           'Cada reliquia tiene un precio, y no siempre es oro lo que cuesta llevarla contigo.'
       ],
       m.id
FROM characters c, maps m
WHERE c.description = 'El último comerciante del Reino Caído, atesora las reliquias más valiosas y peligrosas que aún quedan entre las ruinas del castillo.'
  AND m.name = 'Reino Caído del Rey Haalndzaz';

INSERT INTO characters (name, description) VALUES
('Espectro del Rey',
 'La sombra doliente del rey Haalndzaz, atrapada entre las ruinas de su propio castillo, incapaz de aceptar la caída de su reino.');

INSERT INTO npcs (id, phrases, id_map)
SELECT c.id,
       ARRAY[
           'Fui rey de estas tierras. Ahora solo soy el eco de lo que dejé caer.',
           'Veelfeth tomó todo lo que construí. No dejes que también se lleve lo que te queda a ti.'
       ],
       m.id
FROM characters c, maps m
WHERE c.description = 'La sombra doliente del rey Haalndzaz, atrapada entre las ruinas de su propio castillo, incapaz de aceptar la caída de su reino.'
  AND m.name = 'Reino Caído del Rey Haalndzaz';

INSERT INTO characters (name, description) VALUES
('Última Centinela',
 'La única guardia real que sigue en pie, defendiendo lo que queda de las puertas del castillo caído.');

INSERT INTO npcs (id, phrases, id_map)
SELECT c.id,
       ARRAY[
           'Juré proteger estas puertas hasta mi último aliento. Ese juramento no ha cambiado.',
           'El ángel oscuro que custodia el trono no perdona a nadie. Prepárate antes de avanzar.'
       ],
       m.id
FROM characters c, maps m
WHERE c.description = 'La única guardia real que sigue en pie, defendiendo lo que queda de las puertas del castillo caído.'
  AND m.name = 'Reino Caído del Rey Haalndzaz';

INSERT INTO characters (name, description) VALUES
('Heraldo Caído',
 'Un antiguo mensajero real convertido en un ser errante entre las ruinas, repitiendo advertencias que ya nadie escucha.');

INSERT INTO npcs (id, phrases, id_map)
SELECT c.id,
       ARRAY[
           'El rey ha caído. El reino ha caído. Solo las cenizas siguen en pie.',
           'Nadie escuchó mis advertencias antes de la catástrofe. Tal vez tú sí lo hagas.'
       ],
       m.id
FROM characters c, maps m
WHERE c.description = 'Un antiguo mensajero real convertido en un ser errante entre las ruinas, repitiendo advertencias que ya nadie escucha.'
  AND m.name = 'Reino Caído del Rey Haalndzaz';


-- ============================================================
-- 3. CHARACTERS -> ENEMIES / BOSSES (11 registros: 8 comunes + 3 jefes)
-- ============================================================

-- ---- Bosque Encantado ----

INSERT INTO characters (name, description) VALUES
('Esqueleto', 'Restos animados de un antiguo soldado, vagando sin descanso por el Bosque Encantado.');

INSERT INTO enemies (id, id_map, health_points, damage_points, armor_points, gold_reward, experience_reward, speed_attack_points)
SELECT c.id, m.id, 65, 65, 30, 15, 30, 10
FROM characters c, maps m
WHERE c.description = 'Restos animados de un antiguo soldado, vagando sin descanso por el Bosque Encantado.'
  AND m.name = 'Bosque Encantado';

INSERT INTO characters (name, description) VALUES
('Lobos', 'Manada de lobos salvajes que cazan en grupo entre la maleza del Bosque Encantado.');

INSERT INTO enemies (id, id_map, health_points, damage_points, armor_points, gold_reward, experience_reward, speed_attack_points)
SELECT c.id, m.id, 80, 40, 42, 8, 15, 10
FROM characters c, maps m
WHERE c.description = 'Manada de lobos salvajes que cazan en grupo entre la maleza del Bosque Encantado.'
  AND m.name = 'Bosque Encantado';

INSERT INTO characters (name, description) VALUES
('Erizos', 'Pequeñas criaturas espinosas que infestan los senderos del bosque, débiles pero numerosas.');

INSERT INTO enemies (id, id_map, health_points, damage_points, armor_points, gold_reward, experience_reward, speed_attack_points)
SELECT c.id, m.id, 40, 25, 30, 5, 10, 10
FROM characters c, maps m
WHERE c.description = 'Pequeñas criaturas espinosas que infestan los senderos del bosque, débiles pero numerosas.'
  AND m.name = 'Bosque Encantado';

INSERT INTO characters (name, description) VALUES
('Minotauro', 'El guardián colosal del Bosque Encantado, custodio del paso hacia el desierto.');

INSERT INTO enemies (id, id_map, health_points, damage_points, armor_points, gold_reward, experience_reward, speed_attack_points)
SELECT c.id, m.id, 500, 120, 90, 250, 250, 8
FROM characters c, maps m
WHERE c.description = 'El guardián colosal del Bosque Encantado, custodio del paso hacia el desierto.'
  AND m.name = 'Bosque Encantado';

INSERT INTO bosses (id)
SELECT c.id FROM characters c
WHERE c.description = 'El guardián colosal del Bosque Encantado, custodio del paso hacia el desierto.';

-- ---- Desierto de los Escorpiones y las Ruinas ----

INSERT INTO characters (name, description) VALUES
('Escorpión', 'Criatura venenosa de caparazón endurecido que acecha bajo la arena del desierto.');

INSERT INTO enemies (id, id_map, health_points, damage_points, armor_points, gold_reward, experience_reward, speed_attack_points)
SELECT c.id, m.id, 70, 120, 90, 30, 32, 8
FROM characters c, maps m
WHERE c.description = 'Criatura venenosa de caparazón endurecido que acecha bajo la arena del desierto.'
  AND m.name = 'Desierto de los Escorpiones y las Ruinas';

INSERT INTO characters (name, description) VALUES
('Bandidos', 'Grupo de saqueadores que emboscan viajeros entre las ruinas del desierto.');

INSERT INTO enemies (id, id_map, health_points, damage_points, armor_points, gold_reward, experience_reward, speed_attack_points)
SELECT c.id, m.id, 350, 115, 80, 65, 45, 9
FROM characters c, maps m
WHERE c.description = 'Grupo de saqueadores que emboscan viajeros entre las ruinas del desierto.'
  AND m.name = 'Desierto de los Escorpiones y las Ruinas';

INSERT INTO characters (name, description) VALUES
('Duendes', 'Criaturas pequeñas y astutas que despertaron entre las ruinas olvidadas de la civilización perdida.');

INSERT INTO enemies (id, id_map, health_points, damage_points, armor_points, gold_reward, experience_reward, speed_attack_points)
SELECT c.id, m.id, 420, 108, 72, 200, 42, 10
FROM characters c, maps m
WHERE c.description = 'Criaturas pequeñas y astutas que despertaron entre las ruinas olvidadas de la civilización perdida.'
  AND m.name = 'Desierto de los Escorpiones y las Ruinas';

INSERT INTO characters (name, description) VALUES
('Mago Oscuro', 'Hechicero corrupto que protege los secretos enterrados bajo las ruinas del desierto.');

INSERT INTO enemies (id, id_map, health_points, damage_points, armor_points, gold_reward, experience_reward, speed_attack_points)
SELECT c.id, m.id, 540, 200, 82, 380, 380, 14
FROM characters c, maps m
WHERE c.description = 'Hechicero corrupto que protege los secretos enterrados bajo las ruinas del desierto.'
  AND m.name = 'Desierto de los Escorpiones y las Ruinas';

INSERT INTO bosses (id)
SELECT c.id FROM characters c
WHERE c.description = 'Hechicero corrupto que protege los secretos enterrados bajo las ruinas del desierto.';

-- ---- Reino Caído del Rey Haalndzaz ----

INSERT INTO characters (name, description) VALUES
('Caballero Oscuro', 'No muerto acorazado que sirve a Veelfeth, patrullando las ruinas del castillo caído.');

INSERT INTO enemies (id, id_map, health_points, damage_points, armor_points, gold_reward, experience_reward, speed_attack_points)
SELECT c.id, m.id, 380, 150, 179, 230, 139, 3
FROM characters c, maps m
WHERE c.description = 'No muerto acorazado que sirve a Veelfeth, patrullando las ruinas del castillo caído.'
  AND m.name = 'Reino Caído del Rey Haalndzaz';

INSERT INTO characters (name, description) VALUES
('Lobos Oscuros', 'Lobos corrompidos por la corrupción de Veelfeth, mucho más letales que sus contrapartes del bosque.');

INSERT INTO enemies (id, id_map, health_points, damage_points, armor_points, gold_reward, experience_reward, speed_attack_points)
SELECT c.id, m.id, 242, 179, 120, 320, 350, 3
FROM characters c, maps m
WHERE c.description = 'Lobos corrompidos por la corrupción de Veelfeth, mucho más letales que sus contrapartes del bosque.'
  AND m.name = 'Reino Caído del Rey Haalndzaz';

INSERT INTO characters (name, description) VALUES
('Ángel Oscuro', 'El general de Veelfeth, un ser corrupto hecho de muerte que custodia el trono del reino caído.');

INSERT INTO enemies (id, id_map, health_points, damage_points, armor_points, gold_reward, experience_reward, speed_attack_points)
SELECT c.id, m.id, 720, 439, 339, 750, 750, 1
FROM characters c, maps m
WHERE c.description = 'El general de Veelfeth, un ser corrupto hecho de muerte que custodia el trono del reino caído.'
  AND m.name = 'Reino Caído del Rey Haalndzaz';

INSERT INTO bosses (id)
SELECT c.id FROM characters c
WHERE c.description = 'El general de Veelfeth, un ser corrupto hecho de muerte que custodia el trono del reino caído.';


-- ============================================================
-- 4. ITEMS (catálogo) + WEAPONS / SHIELDS / CONSUMABLES / ARMORS
--
-- Incluye: kits iniciales de las 5 clases (4.2 de la documentación),
-- catálogo de las 3 tiendas, y exactamente 1 ítem especial por
-- subtipo (arma, escudo, consumible, armadura).
-- ============================================================

-- ---- 4.1 WEAPONS ----

-- Kit inicial: Caballero (mano principal) / también disponible en tienda 1 y 3
INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Espada Corta', 'Espada corta de acero básico, ligera y equilibrada, arma inicial del Caballero.', 'ARMA', 50, 20, false);

INSERT INTO weapons (id, damage, durability, weapon_type, weapon_slot)
SELECT id, 12, 100, 'ESPADA', 'MANO_PRINCIPAL'
FROM items WHERE description = 'Espada corta de acero básico, ligera y equilibrada, arma inicial del Caballero.';

-- Kit inicial: Espadachín (mano secundaria, para el dual wield)
INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Espada Corta de Guardia', 'Segunda espada corta pensada para combatirse en la mano secundaria, arma inicial del Espadachín.', 'ARMA', 45, 18, false);

INSERT INTO weapons (id, damage, durability, weapon_type, weapon_slot)
SELECT id, 10, 95, 'ESPADA', 'MANO_SECUNDARIA'
FROM items WHERE description = 'Segunda espada corta pensada para combatirse en la mano secundaria, arma inicial del Espadachín.';

-- Kit inicial: Mago
INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Bastón de Madera', 'Bastón tallado en madera vieja, canal básico para la magia del Mago novato.', 'ARMA', 45, 18, false);

INSERT INTO weapons (id, damage, durability, weapon_type, weapon_slot)
SELECT id, 8, 80, 'BASTON', 'MANO_PRINCIPAL'
FROM items WHERE description = 'Bastón tallado en madera vieja, canal básico para la magia del Mago novato.';

-- Kit inicial: Arquero
INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Arco Corto', 'Arco corto de caza, preciso a distancias cortas, arma inicial del Arquero.', 'ARMA', 55, 22, false);

INSERT INTO weapons (id, damage, durability, weapon_type, weapon_slot)
SELECT id, 14, 90, 'ARCO', 'MANO_PRINCIPAL'
FROM items WHERE description = 'Arco corto de caza, preciso a distancias cortas, arma inicial del Arquero.';

-- Kit inicial: Gladiador
INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Martillo de Guerra', 'Pesado martillo de combate usado en los coliseos, arma inicial del Gladiador.', 'ARMA', 70, 28, false);

INSERT INTO weapons (id, damage, durability, weapon_type, weapon_slot)
SELECT id, 20, 120, 'MARTILLO', 'MANO_PRINCIPAL'
FROM items WHERE description = 'Pesado martillo de combate usado en los coliseos, arma inicial del Gladiador.';

-- Tienda 2 / 3: gama media
INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Espada de Acero', 'Espada forjada en acero templado, más filosa y resistente que las hojas iniciales.', 'ARMA', 120, 48, false);

INSERT INTO weapons (id, damage, durability, weapon_type, weapon_slot)
SELECT id, 25, 130, 'ESPADA', 'MANO_PRINCIPAL'
FROM items WHERE description = 'Espada forjada en acero templado, más filosa y resistente que las hojas iniciales.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Arco Largo', 'Arco largo de doble curvatura, con mayor alcance y potencia que el arco de caza básico.', 'ARMA', 130, 52, false);

INSERT INTO weapons (id, damage, durability, weapon_type, weapon_slot)
SELECT id, 28, 110, 'ARCO', 'MANO_PRINCIPAL'
FROM items WHERE description = 'Arco largo de doble curvatura, con mayor alcance y potencia que el arco de caza básico.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Bastón Rúnico', 'Bastón grabado con runas antiguas que amplifican el poder del hechicero que lo empuña.', 'ARMA', 115, 46, false);

INSERT INTO weapons (id, damage, durability, weapon_type, weapon_slot)
SELECT id, 20, 100, 'BASTON', 'MANO_PRINCIPAL'
FROM items WHERE description = 'Bastón grabado con runas antiguas que amplifican el poder del hechicero que lo empuña.';

-- Tienda 3: gama alta (no especial)
INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Mandoble de Titanio', 'Enorme espada a dos manos forjada en titanio, propia de guerreros de gran fuerza.', 'ARMA', 300, 120, false);

INSERT INTO weapons (id, damage, durability, weapon_type, weapon_slot)
SELECT id, 45, 200, 'ESPADA', 'MANO_PRINCIPAL'
FROM items WHERE description = 'Enorme espada a dos manos forjada en titanio, propia de guerreros de gran fuerza.';

-- Tienda 3: arma especial (única en todo el catálogo)
INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Espada del Alba Ceniza', 'Hoja legendaria forjada con las cenizas del primer amanecer tras la catástrofe. Solo un elegido puede blandirla.', 'ARMA', 600, 240, true);

INSERT INTO weapons (id, damage, durability, weapon_type, weapon_slot)
SELECT id, 60, 250, 'ESPADA', 'MANO_PRINCIPAL'
FROM items WHERE description = 'Hoja legendaria forjada con las cenizas del primer amanecer tras la catástrofe. Solo un elegido puede blandirla.';


-- ---- 4.2 SHIELDS ----

-- Kit inicial: Caballero
INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Escudo de Madera', 'Escudo redondo de madera reforzada, escudo inicial del Caballero.', 'ESCUDO', 40, 16, false);

INSERT INTO shields (id, block_points, durability, weapon_slot)
SELECT id, 15, 90, 'MANO_SECUNDARIA'
FROM items WHERE description = 'Escudo redondo de madera reforzada, escudo inicial del Caballero.';

-- Tienda 2 / 3: gama media
INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Escudo de Hierro', 'Escudo macizo de hierro forjado, ofrece mucha más protección que el escudo de madera.', 'ESCUDO', 100, 40, false);

INSERT INTO shields (id, block_points, durability, weapon_slot)
SELECT id, 30, 140, 'MANO_SECUNDARIA'
FROM items WHERE description = 'Escudo macizo de hierro forjado, ofrece mucha más protección que el escudo de madera.';

-- Tienda 3: escudo especial (único en todo el catálogo)
INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Escudo del Guardián Caído', 'Escudo forjado a partir de la armadura de un guardián real que cayó defendiendo el castillo hasta el final.', 'ESCUDO', 550, 220, true);

INSERT INTO shields (id, block_points, durability, weapon_slot)
SELECT id, 55, 220, 'MANO_SECUNDARIA'
FROM items WHERE description = 'Escudo forjado a partir de la armadura de un guardián real que cayó defendiendo el castillo hasta el final.';


-- ---- 4.3 CONSUMABLES ----

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Poción de Vida Menor', 'Frasco pequeño de líquido carmesí que restaura una cantidad modesta de vida.', 'CONSUMIBLE', 15, 6, false);

INSERT INTO consumables (id, health_points, strong_points, speed_attack_points)
SELECT id, 30, 0, 0
FROM items WHERE description = 'Frasco pequeño de líquido carmesí que restaura una cantidad modesta de vida.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Poción de Vida Mayor', 'Frasco grande de líquido carmesí que restaura una cantidad considerable de vida.', 'CONSUMIBLE', 35, 14, false);

INSERT INTO consumables (id, health_points, strong_points, speed_attack_points)
SELECT id, 70, 0, 0
FROM items WHERE description = 'Frasco grande de líquido carmesí que restaura una cantidad considerable de vida.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Elixir de Fuerza', 'Brebaje amargo que aumenta temporalmente la fuerza de quien lo bebe.', 'CONSUMIBLE', 25, 10, false);

INSERT INTO consumables (id, health_points, strong_points, speed_attack_points)
SELECT id, 0, 10, 0
FROM items WHERE description = 'Brebaje amargo que aumenta temporalmente la fuerza de quien lo bebe.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Elixir de Velocidad', 'Líquido efervescente que agiliza los reflejos y la velocidad de ataque de quien lo consume.', 'CONSUMIBLE', 25, 10, false);

INSERT INTO consumables (id, health_points, strong_points, speed_attack_points)
SELECT id, 0, 0, 8
FROM items WHERE description = 'Líquido efervescente que agiliza los reflejos y la velocidad de ataque de quien lo consume.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Poción Combinada', 'Mezcla de hierbas y líquido carmesí que restaura vida y otorga un pequeño impulso de fuerza.', 'CONSUMIBLE', 45, 18, false);

INSERT INTO consumables (id, health_points, strong_points, speed_attack_points)
SELECT id, 40, 5, 0
FROM items WHERE description = 'Mezcla de hierbas y líquido carmesí que restaura vida y otorga un pequeño impulso de fuerza.';

-- Tienda 3: consumible especial (único en todo el catálogo)
INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Elixir del Alma Ancestral', 'Elixir extraído de las almas más antiguas del reino caído, restaura vida y potencia fuerza y velocidad a la vez.', 'CONSUMIBLE', 500, 200, true);

INSERT INTO consumables (id, health_points, strong_points, speed_attack_points)
SELECT id, 100, 20, 15
FROM items WHERE description = 'Elixir extraído de las almas más antiguas del reino caído, restaura vida y potencia fuerza y velocidad a la vez.';


-- ---- 4.4 ARMORS ----

-- Kit inicial: Caballero (set de cuero completo)
INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Guantes de Cuero', 'Guantes reforzados de cuero curtido, parte del set inicial del Caballero.', 'ARMADURA', 20, 8, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 5, 2, 100, 'GUANTES' FROM items WHERE description = 'Guantes reforzados de cuero curtido, parte del set inicial del Caballero.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Casco de Cuero', 'Casco simple de cuero endurecido, parte del set inicial del Caballero.', 'ARMADURA', 25, 10, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 8, 1, 100, 'CASCO' FROM items WHERE description = 'Casco simple de cuero endurecido, parte del set inicial del Caballero.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Pechera de Cuero', 'Pechera de cuero grueso, protección básica y equilibrada, parte del set inicial del Caballero.', 'ARMADURA', 45, 18, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 15, 3, 120, 'PECHERA' FROM items WHERE description = 'Pechera de cuero grueso, protección básica y equilibrada, parte del set inicial del Caballero.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Pantalones de Cuero', 'Pantalones de cuero resistente, parte del set inicial del Caballero.', 'ARMADURA', 30, 12, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 10, 2, 110, 'PANTALONES' FROM items WHERE description = 'Pantalones de cuero resistente, parte del set inicial del Caballero.';

-- Kit inicial: Mago (túnica + sombrero, sin guantes ni pantalones)
INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Túnica de Mago', 'Túnica ligera tejida con hilos encantados, parte del set inicial del Mago.', 'ARMADURA', 40, 16, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 10, 1, 70, 'PECHERA' FROM items WHERE description = 'Túnica ligera tejida con hilos encantados, parte del set inicial del Mago.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Sombrero de Mago', 'Sombrero puntiagudo tradicional de los aprendices de magia, parte del set inicial del Mago.', 'ARMADURA', 25, 10, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 5, 1, 60, 'CASCO' FROM items WHERE description = 'Sombrero puntiagudo tradicional de los aprendices de magia, parte del set inicial del Mago.';

-- Kit inicial: Arquero (set de cazador completo)
INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Guantes de Cazador', 'Guantes ligeros pensados para no interferir con el manejo del arco, parte del set inicial del Arquero.', 'ARMADURA', 20, 8, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 4, 2, 90, 'GUANTES' FROM items WHERE description = 'Guantes ligeros pensados para no interferir con el manejo del arco, parte del set inicial del Arquero.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Casco de Cazador', 'Capucha reforzada con piezas de cuero, parte del set inicial del Arquero.', 'ARMADURA', 22, 9, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 6, 1, 90, 'CASCO' FROM items WHERE description = 'Capucha reforzada con piezas de cuero, parte del set inicial del Arquero.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Pechera de Cazador', 'Chaleco ligero de cuero pensado para la movilidad, parte del set inicial del Arquero.', 'ARMADURA', 38, 15, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 12, 2, 100, 'PECHERA' FROM items WHERE description = 'Chaleco ligero de cuero pensado para la movilidad, parte del set inicial del Arquero.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Pantalones de Cazador', 'Pantalones flexibles de cuero ligero, parte del set inicial del Arquero.', 'ARMADURA', 28, 11, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 8, 2, 95, 'PANTALONES' FROM items WHERE description = 'Pantalones flexibles de cuero ligero, parte del set inicial del Arquero.';

-- Kit inicial: Espadachín (set ligero completo)
INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Guantes Ligeros', 'Guantes ajustados que priorizan la velocidad sobre la protección, parte del set inicial del Espadachín.', 'ARMADURA', 22, 9, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 4, 3, 85, 'GUANTES' FROM items WHERE description = 'Guantes ajustados que priorizan la velocidad sobre la protección, parte del set inicial del Espadachín.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Casco Ligero', 'Casco delgado de metal liviano, parte del set inicial del Espadachín.', 'ARMADURA', 24, 10, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 5, 2, 85, 'CASCO' FROM items WHERE description = 'Casco delgado de metal liviano, parte del set inicial del Espadachín.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Pechera Ligera', 'Coraza liviana pensada para no restar velocidad al combate con dos espadas, parte del set inicial del Espadachín.', 'ARMADURA', 40, 16, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 10, 4, 95, 'PECHERA' FROM items WHERE description = 'Coraza liviana pensada para no restar velocidad al combate con dos espadas, parte del set inicial del Espadachín.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Pantalones Ligeros', 'Pantalones ajustados de cuero reforzado, parte del set inicial del Espadachín.', 'ARMADURA', 28, 11, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 7, 3, 90, 'PANTALONES' FROM items WHERE description = 'Pantalones ajustados de cuero reforzado, parte del set inicial del Espadachín.';

-- Kit inicial: Gladiador (set de guerrero del coliseo romano)
INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Guantes de Gladiador', 'Manoplas pesadas de bronce usadas en los combates del coliseo, parte del set inicial del Gladiador.', 'ARMADURA', 35, 14, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 8, 5, 130, 'GUANTES' FROM items WHERE description = 'Manoplas pesadas de bronce usadas en los combates del coliseo, parte del set inicial del Gladiador.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Casco de Gladiador', 'Casco ornamentado con cresta, típico de los guerreros del coliseo romano, parte del set inicial del Gladiador.', 'ARMADURA', 40, 16, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 12, 4, 130, 'CASCO' FROM items WHERE description = 'Casco ornamentado con cresta, típico de los guerreros del coliseo romano, parte del set inicial del Gladiador.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Pechera de Gladiador', 'Coraza pesada de bronce y cuero, parte del set inicial del Gladiador.', 'ARMADURA', 60, 24, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 20, 6, 150, 'PECHERA' FROM items WHERE description = 'Coraza pesada de bronce y cuero, parte del set inicial del Gladiador.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Pantalones de Gladiador', 'Faldón y grebas de combate del coliseo romano, parte del set inicial del Gladiador.', 'ARMADURA', 45, 18, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 14, 5, 140, 'PANTALONES' FROM items WHERE description = 'Faldón y grebas de combate del coliseo romano, parte del set inicial del Gladiador.';

-- Tienda 2 / 3: set de placas, gama media (no forma parte de ningún kit inicial)
INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Guantes de Placas', 'Guanteletes de metal macizo, mucho más resistentes que el cuero o el bronce ligero.', 'ARMADURA', 50, 20, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 10, 6, 150, 'GUANTES' FROM items WHERE description = 'Guanteletes de metal macizo, mucho más resistentes que el cuero o el bronce ligero.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Casco de Placas', 'Casco cerrado de placas de acero, protección superior frente a los sets iniciales.', 'ARMADURA', 55, 22, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 14, 5, 150, 'CASCO' FROM items WHERE description = 'Casco cerrado de placas de acero, protección superior frente a los sets iniciales.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Pechera de Placas', 'Coraza completa de placas de acero remachado, de las más resistentes disponibles en las tiendas.', 'ARMADURA', 90, 36, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 28, 8, 180, 'PECHERA' FROM items WHERE description = 'Coraza completa de placas de acero remachado, de las más resistentes disponibles en las tiendas.';

INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Pantalones de Placas', 'Grebas y protecciones de acero articulado, parte del set de placas de gama media.', 'ARMADURA', 65, 26, false);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 18, 6, 160, 'PANTALONES' FROM items WHERE description = 'Grebas y protecciones de acero articulado, parte del set de placas de gama media.';

-- Tienda 3: armadura especial (única en todo el catálogo)
INSERT INTO items (name, description, item_type, price, sell_price, is_special) VALUES
('Armadura del Rey Ceniciento', 'Coraza ceremonial del último rey del reino caído, imbuida con el peso de su reinado y su derrota.', 'ARMADURA', 650, 260, true);
INSERT INTO armors (id, health_points, strong_points, durability, armor_slot)
SELECT id, 50, 20, 300, 'PECHERA' FROM items WHERE description = 'Coraza ceremonial del último rey del reino caído, imbuida con el peso de su reinado y su derrota.';


-- ============================================================
-- 5. STORES (3 registros, 1 por NPC comerciante)
-- ============================================================

INSERT INTO stores (id_npc, name, description)
SELECT c.id, 'Refugio del Bosque', 'Puesto de mercancía básica y económica a la entrada del Bosque Encantado.'
FROM characters c
WHERE c.description = 'Un comerciante ambulante que instaló su carreta a la entrada del Bosque Encantado, siempre dispuesto a vender lo básico para sobrevivir.';

INSERT INTO stores (id_npc, name, description)
SELECT c.id, 'Oasis del Comercio', 'Tienda de mercancía de gama media instalada en el único oasis del desierto.'
FROM characters c
WHERE c.description = 'Un mercader instalado en el único oasis del desierto, con mercancía de mejor calidad que la del bosque, a un precio acorde.';

INSERT INTO stores (id_npc, name, description)
SELECT c.id, 'Bóveda de las Ruinas', 'El mayor catálogo de mercancía del reino, desde lo más barato hasta las reliquias más caras y especiales.'
FROM characters c
WHERE c.description = 'El último comerciante del Reino Caído, atesora las reliquias más valiosas y peligrosas que aún quedan entre las ruinas del castillo.';


-- ============================================================
-- 6. STORE_ITEMS (catálogo de cada tienda)
-- ============================================================

-- ---- Tienda 1: Refugio del Bosque (básica, económica) ----

INSERT INTO store_items (id_store, id_item, stock)
SELECT s.id, i.id, v.stock
FROM stores s
JOIN (VALUES
    ('Espada corta de acero básico, ligera y equilibrada, arma inicial del Caballero.', 8),
    ('Bastón tallado en madera vieja, canal básico para la magia del Mago novato.', 8),
    ('Arco corto de caza, preciso a distancias cortas, arma inicial del Arquero.', 8),
    ('Escudo redondo de madera reforzada, escudo inicial del Caballero.', 8),
    ('Guantes reforzados de cuero curtido, parte del set inicial del Caballero.', 10),
    ('Casco simple de cuero endurecido, parte del set inicial del Caballero.', 10),
    ('Pechera de cuero grueso, protección básica y equilibrada, parte del set inicial del Caballero.', 10),
    ('Pantalones de cuero resistente, parte del set inicial del Caballero.', 10),
    ('Frasco pequeño de líquido carmesí que restaura una cantidad modesta de vida.', 30),
    ('Brebaje amargo que aumenta temporalmente la fuerza de quien lo bebe.', 20),
    ('Líquido efervescente que agiliza los reflejos y la velocidad de ataque de quien lo consume.', 20)
) AS v(description, stock) ON true
JOIN items i ON i.description = v.description
WHERE s.name = 'Refugio del Bosque';

-- ---- Tienda 2: Oasis del Comercio (gama media, un poco más cara) ----

INSERT INTO store_items (id_store, id_item, stock)
SELECT s.id, i.id, v.stock
FROM stores s
JOIN (VALUES
    ('Espada forjada en acero templado, más filosa y resistente que las hojas iniciales.', 6),
    ('Arco largo de doble curvatura, con mayor alcance y potencia que el arco de caza básico.', 6),
    ('Bastón grabado con runas antiguas que amplifican el poder del hechicero que lo empuña.', 6),
    ('Escudo macizo de hierro forjado, ofrece mucha más protección que el escudo de madera.', 6),
    ('Guanteletes de metal macizo, mucho más resistentes que el cuero o el bronce ligero.', 8),
    ('Casco cerrado de placas de acero, protección superior frente a los sets iniciales.', 8),
    ('Coraza completa de placas de acero remachado, de las más resistentes disponibles en las tiendas.', 8),
    ('Grebas y protecciones de acero articulado, parte del set de placas de gama media.', 8),
    ('Frasco grande de líquido carmesí que restaura una cantidad considerable de vida.', 20),
    ('Mezcla de hierbas y líquido carmesí que restaura vida y otorga un pequeño impulso de fuerza.', 15),
    ('Brebaje amargo que aumenta temporalmente la fuerza de quien lo bebe.', 15)
) AS v(description, stock) ON true
JOIN items i ON i.description = v.description
WHERE s.name = 'Oasis del Comercio';

-- ---- Tienda 3: Bóveda de las Ruinas (el catálogo más grande, barato y caro, incluye especiales) ----

INSERT INTO store_items (id_store, id_item, stock)
SELECT s.id, i.id, v.stock
FROM stores s
JOIN (VALUES
    ('Espada corta de acero básico, ligera y equilibrada, arma inicial del Caballero.', 5),
    ('Segunda espada corta pensada para combatirse en la mano secundaria, arma inicial del Espadachín.', 5),
    ('Pesado martillo de combate usado en los coliseos, arma inicial del Gladiador.', 5),
    ('Escudo redondo de madera reforzada, escudo inicial del Caballero.', 5),
    ('Escudo macizo de hierro forjado, ofrece mucha más protección que el escudo de madera.', 5),
    ('Espada forjada en acero templado, más filosa y resistente que las hojas iniciales.', 5),
    ('Arco largo de doble curvatura, con mayor alcance y potencia que el arco de caza básico.', 5),
    ('Bastón grabado con runas antiguas que amplifican el poder del hechicero que lo empuña.', 5),
    ('Enorme espada a dos manos forjada en titanio, propia de guerreros de gran fuerza.', 2),
    ('Manoplas pesadas de bronce usadas en los combates del coliseo, parte del set inicial del Gladiador.', 6),
    ('Casco ornamentado con cresta, típico de los guerreros del coliseo romano, parte del set inicial del Gladiador.', 6),
    ('Coraza pesada de bronce y cuero, parte del set inicial del Gladiador.', 6),
    ('Faldón y grebas de combate del coliseo romano, parte del set inicial del Gladiador.', 6),
    ('Guantes ajustados que priorizan la velocidad sobre la protección, parte del set inicial del Espadachín.', 6),
    ('Casco delgado de metal liviano, parte del set inicial del Espadachín.', 6),
    ('Coraza liviana pensada para no restar velocidad al combate con dos espadas, parte del set inicial del Espadachín.', 6),
    ('Pantalones ajustados de cuero reforzado, parte del set inicial del Espadachín.', 6),
    ('Frasco grande de líquido carmesí que restaura una cantidad considerable de vida.', 25),
    ('Mezcla de hierbas y líquido carmesí que restaura vida y otorga un pequeño impulso de fuerza.', 20),
    ('Líquido efervescente que agiliza los reflejos y la velocidad de ataque de quien lo consume.', 20),
    ('Hoja legendaria forjada con las cenizas del primer amanecer tras la catástrofe. Solo un elegido puede blandirla.', 1),
    ('Escudo forjado a partir de la armadura de un guardián real que cayó defendiendo el castillo hasta el final.', 1),
    ('Elixir extraído de las almas más antiguas del reino caído, restaura vida y potencia fuerza y velocidad a la vez.', 1),
    ('Coraza ceremonial del último rey del reino caído, imbuida con el peso de su reinado y su derrota.', 1)
) AS v(description, stock) ON true
JOIN items i ON i.description = v.description
WHERE s.name = 'Bóveda de las Ruinas';

COMMIT;