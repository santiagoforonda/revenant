package com.santyman.revenant.entities;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "shields")
@DiscriminatorValue("ESCUDO")
@PrimaryKeyJoinColumn(name = "id")
public class Shield extends Item {

    @Column(name = "block_points", nullable = false)
    private Integer blockPoints;

    @Column(nullable = false)
    private Integer durability;

    @Enumerated(EnumType.STRING)
    @Column(name = "weapon_slot", nullable = false, length = 20)
    private WeaponSlot weaponSlot;
}
