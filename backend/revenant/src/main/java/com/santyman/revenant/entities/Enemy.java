package com.santyman.revenant.entities;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "enemies")
@PrimaryKeyJoinColumn(name = "id")
public class Enemy extends GameCharacter {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_map", nullable = false)
    private MapWorld map;

    @Column(name = "health_points", nullable = false)
    private Integer healthPoints;

    @Column(name = "damage_points", nullable = false)
    private Integer damagePoints;

    @Column(name = "armor_points", nullable = false)
    private Integer armorPoints;

    @Column(name = "gold_reward", nullable = false)
    private Integer goldReward;

    @Column(name = "experience_reward", nullable = false)
    private Integer experienceReward;

    @Column(name = "speed_attack_points", nullable = false)
    private Integer speedAttackPoints;
}
