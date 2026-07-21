package com.santyman.revenant.entities;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "weapons")
@DiscriminatorValue("ARMA")
@PrimaryKeyJoinColumn(name = "id")
public class Weapon extends Item {

    @Column(nullable = false)
    private Integer damage;

    @Column(nullable = false)
    private Integer durability;

    @Enumerated(EnumType.STRING)
    @Column(name = "weapon_type", nullable = false, length = 20)
    private WeaponType weaponType;

    @Enumerated(EnumType.STRING)
    @Column(name = "weapon_slot", nullable = false, length = 20)
    private WeaponSlot weaponSlot;
}
