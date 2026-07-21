package com.santyman.revenant.entities;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "armors")
@DiscriminatorValue("ARMADURA")
@PrimaryKeyJoinColumn(name = "id")
public class Armor extends Item {

    @Column(name = "health_points", nullable = false)
    private Integer healthPoints;

    @Column(name = "strong_points", nullable = false)
    private Integer strongPoints;

    @Column(nullable = false)
    private Integer durability;

    @Enumerated(EnumType.STRING)
    @Column(name = "armor_slot", nullable = false, length = 20)
    private ArmorSlot armorSlot;
}
