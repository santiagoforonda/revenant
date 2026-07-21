package com.santyman.revenant.repositories;

import com.santyman.revenant.entities.Shield;
import com.santyman.revenant.entities.WeaponSlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShieldRepository extends JpaRepository<Shield, Long> {

    List<Shield> findByWeaponSlot(WeaponSlot weaponSlot);

    Optional<Shield> findFirstByWeaponSlot(WeaponSlot weaponSlot);
}
