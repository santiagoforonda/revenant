package com.santyman.revenant.services.implementation;

import com.santyman.revenant.dtos.SaveGameRequest;
import com.santyman.revenant.entities.*;
import com.santyman.revenant.exception.InvalidOrMissingTokenException;
import com.santyman.revenant.repositories.*;
import com.santyman.revenant.services.interfaces.PlayerService;
import lombok.RequiredArgsConstructor;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PlayerServiceImpl implements PlayerService {

    private static final long STARTING_MAP_ID = 1L;
    private static final int STARTING_LEVEL = 1;
    private static final int STARTING_EXPERIENCE = 0;
    private static final int STARTING_GOLD = 100;

    private final PlayerRepository playerRepository;
    private final MapWorldRepository mapWorldRepository;
    private final InventoryRepository inventoryRepository;
    private final WeaponRepository weaponRepository;
    private final ShieldRepository shieldRepository;
    private final ArmorRepository armorRepository;
    

    @Override
    @Transactional
    public void createInitialPlayer(User user, PlayerType playerType) {
        PlayerStats stats = resolveInitialStats(playerType);
        MapWorld map = mapWorldRepository.findById(STARTING_MAP_ID).orElseThrow();

        Player player = Player.builder()
                .user(user)
                .typePlayer(playerType)
                .level(STARTING_LEVEL)
                .experience(STARTING_EXPERIENCE)
                .healthPoints(stats.healthPoints())
                .strongPoints(stats.strongPoints())
                .speedAttackPoints(stats.speedAttackPoints())
                .gold(STARTING_GOLD)
                .map(map)
                .posX(0)
                .posY(0)
                .build();

        Player savedPlayer = playerRepository.save(player);

        assignInitialInventory(savedPlayer, playerType);
    }

    @Override
    @Transactional
    public String saveGame(SaveGameRequest request) {
        Player player = getAuthenticatedPlayer();
        MapWorld map = mapWorldRepository.findById(request.mapId()).orElseThrow();
        player.setMap(map);
        player.setPosX(request.positionX());
        player.setPosY(request.positionY());

        playerRepository.save(player);
        return "Game saved successfully";
    }

    // -------------------------------------------------------------------------
    // Initial stats per class (doc section 4.1)
    // -------------------------------------------------------------------------

    private PlayerStats resolveInitialStats(PlayerType playerType) {
        return switch (playerType) {
            case CABALLERO  -> new PlayerStats(110, 15, 12);
            case MAGO       -> new PlayerStats(80,  9,  16);
            case ARQUERO    -> new PlayerStats(75,  8,  20);
            case ESPADACHIN -> new PlayerStats(95,  11, 18);
            case GLADIADOR  -> new PlayerStats(130, 22, 8);
        };
    }

    // -------------------------------------------------------------------------
    // Initial inventory per class (doc section 4.2)
    // Weapons are identified by WeaponType + WeaponSlot.
    // Shields are identified by WeaponSlot (always MANO_SECUNDARIA).
    // Armors are identified by ArmorSlot.
    // -------------------------------------------------------------------------

    private void assignInitialInventory(Player player, PlayerType playerType) {
        List<Inventory> items = new ArrayList<>();

        switch (playerType) {
            case CABALLERO -> {
                // 1 espada corta (MANO_PRINCIPAL) + 1 escudo (MANO_SECUNDARIA)
                // + set completo de cuero
                items.add(equippedWeapon(player, WeaponType.ESPADA, WeaponSlot.MANO_PRINCIPAL));
                items.add(equippedShield(player));
                items.add(equippedArmor(player, ArmorSlot.GUANTES));
                items.add(equippedArmor(player, ArmorSlot.CASCO));
                items.add(equippedArmor(player, ArmorSlot.PECHERA));
                items.add(equippedArmor(player, ArmorSlot.PANTALONES));
            }
            case MAGO -> {
                // 1 bastón (MANO_PRINCIPAL) + túnica (PECHERA) + sombrero (CASCO)
                items.add(equippedWeapon(player, WeaponType.BASTON, WeaponSlot.MANO_PRINCIPAL));
                items.add(equippedArmor(player, ArmorSlot.PECHERA));
                items.add(equippedArmor(player, ArmorSlot.CASCO));
            }
            case ARQUERO -> {
                // 1 arco (MANO_PRINCIPAL) + set completo de cazador
                items.add(equippedWeapon(player, WeaponType.ARCO, WeaponSlot.MANO_PRINCIPAL));
                items.add(equippedArmor(player, ArmorSlot.GUANTES));
                items.add(equippedArmor(player, ArmorSlot.CASCO));
                items.add(equippedArmor(player, ArmorSlot.PECHERA));
                items.add(equippedArmor(player, ArmorSlot.PANTALONES));
            }
            case ESPADACHIN -> {
                // dual wield: espada en MANO_PRINCIPAL + espada en MANO_SECUNDARIA
                // + set ligero completo
                items.add(equippedWeapon(player, WeaponType.ESPADA, WeaponSlot.MANO_PRINCIPAL));
                items.add(equippedWeapon(player, WeaponType.ESPADA, WeaponSlot.MANO_SECUNDARIA));
                items.add(equippedArmor(player, ArmorSlot.GUANTES));
                items.add(equippedArmor(player, ArmorSlot.CASCO));
                items.add(equippedArmor(player, ArmorSlot.PECHERA));
                items.add(equippedArmor(player, ArmorSlot.PANTALONES));
            }
            case GLADIADOR -> {
                // 1 martillo (MANO_PRINCIPAL) + set del coliseo
                items.add(equippedWeapon(player, WeaponType.MARTILLO, WeaponSlot.MANO_PRINCIPAL));
                items.add(equippedArmor(player, ArmorSlot.GUANTES));
                items.add(equippedArmor(player, ArmorSlot.CASCO));
                items.add(equippedArmor(player, ArmorSlot.PECHERA));
                items.add(equippedArmor(player, ArmorSlot.PANTALONES));
            }
        }

        inventoryRepository.saveAll(items);
    }

    private Inventory equippedWeapon(Player player, WeaponType type, WeaponSlot slot) {
        Weapon weapon = weaponRepository.findFirstByWeaponTypeAndWeaponSlot(type, slot)
                .orElseThrow(() -> new IllegalStateException(
                        "Initial weapon not found in catalog: type=" + type + ", slot=" + slot));
        return buildInventoryRow(player, weapon, toEquippedSlot(slot));
    }

    private Inventory equippedShield(Player player) {
        Shield shield = shieldRepository.findFirstByWeaponSlot(WeaponSlot.MANO_SECUNDARIA)
                .orElseThrow(() -> new IllegalStateException(
                        "Initial shield not found in catalog"));
        return buildInventoryRow(player, shield, EquippedSlot.MANO_SECUNDARIA);
    }

    private Inventory equippedArmor(Player player, ArmorSlot slot) {
        Armor armor = armorRepository.findFirstByArmorSlot(slot)
                .orElseThrow(() -> new IllegalStateException(
                        "Initial armor not found in catalog: slot=" + slot));
        return buildInventoryRow(player, armor, toEquippedSlot(slot));
    }

    private Inventory buildInventoryRow(Player player, Item item, EquippedSlot equippedSlot) {
        return Inventory.builder()
                .player(player)
                .item(item)
                .quantity(1)
                .equipped(true)
                .equippedSlot(equippedSlot)
                .build();
    }

    private EquippedSlot toEquippedSlot(WeaponSlot slot) {
        return switch (slot) {
            case MANO_PRINCIPAL  -> EquippedSlot.MANO_PRINCIPAL;
            case MANO_SECUNDARIA -> EquippedSlot.MANO_SECUNDARIA;
        };
    }

    private EquippedSlot toEquippedSlot(ArmorSlot slot) {
        return switch (slot) {
            case GUANTES    -> EquippedSlot.GUANTES;
            case CASCO      -> EquippedSlot.CASCO;
            case PECHERA    -> EquippedSlot.PECHERA;
            case PANTALONES -> EquippedSlot.PANTALONES;
        };
    }

    private record PlayerStats(int healthPoints, int strongPoints, int speedAttackPoints) {
    }

    private Player getAuthenticatedPlayer() {
        User authenticatedUser = (User) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        return playerRepository.findByUser(authenticatedUser)
                .orElseThrow(() -> new InvalidOrMissingTokenException("No player profile found for the authenticated user"));
    }

    
}
