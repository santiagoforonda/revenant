package com.santyman.revenant.repositories;

import com.santyman.revenant.entities.Boss;
import com.santyman.revenant.entities.Player;
import com.santyman.revenant.entities.PlayerBoss;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlayerBossRepository extends JpaRepository<PlayerBoss, Long> {

    Optional<PlayerBoss> findByPlayerAndBoss(Player player, Boss boss);

    List<PlayerBoss> findByPlayer(Player player);

    List<PlayerBoss> findByPlayerAndIsDefeatTrue(Player player);
}
