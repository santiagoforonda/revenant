package com.santyman.revenant.repositories;

import com.santyman.revenant.entities.Armor;
import com.santyman.revenant.entities.ArmorSlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ArmorRepository extends JpaRepository<Armor, Long> {

    List<Armor> findByArmorSlot(ArmorSlot armorSlot);

    Optional<Armor> findFirstByArmorSlot(ArmorSlot armorSlot);
}
