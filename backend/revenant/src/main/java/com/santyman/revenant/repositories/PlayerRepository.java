package com.santyman.revenant.repositories;

import com.santyman.revenant.entities.Player;
import com.santyman.revenant.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlayerRepository extends JpaRepository<Player, Long> {

    Optional<Player> findByUser(User user);

}
