package com.santyman.revenant.entities;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "consumables")
@DiscriminatorValue("CONSUMIBLE")
@PrimaryKeyJoinColumn(name = "id")
public class Consumable extends Item {

    @Column(name = "health_points", nullable = false)
    private Integer healthPoints;

    @Column(name = "strong_points", nullable = false)
    private Integer strongPoints;

    @Column(name = "speed_attack_points", nullable = false)
    private Integer speedAttackPoints;
}
