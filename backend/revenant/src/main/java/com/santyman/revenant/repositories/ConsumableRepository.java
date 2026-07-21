package com.santyman.revenant.repositories;

import com.santyman.revenant.entities.Consumable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConsumableRepository extends JpaRepository<Consumable, Long> {

    Optional<Consumable> findByName(String name);
}
