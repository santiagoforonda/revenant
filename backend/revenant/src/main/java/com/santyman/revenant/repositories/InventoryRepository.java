package com.santyman.revenant.repositories;

import com.santyman.revenant.entities.Item;
import com.santyman.revenant.entities.Inventory;
import com.santyman.revenant.entities.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    @Query("SELECT i FROM Inventory i JOIN FETCH i.item WHERE i.player = :player")
    List<Inventory> findByPlayerWithItem(@Param("player") Player player);

    Optional<Inventory> findByPlayerAndItem(Player player, Item item);

    List<Inventory> findByPlayerId(Long playerId);
}
