package com.santyman.revenant.repositories;

import com.santyman.revenant.entities.Weapon;
import com.santyman.revenant.entities.WeaponSlot;
import com.santyman.revenant.entities.WeaponType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WeaponRepository extends JpaRepository<Weapon, Long> {

    List<Weapon> findByWeaponType(WeaponType weaponType);

    List<Weapon> findByWeaponSlot(WeaponSlot weaponSlot);

    Optional<Weapon> findFirstByWeaponTypeAndWeaponSlot(WeaponType weaponType, WeaponSlot weaponSlot);
}
