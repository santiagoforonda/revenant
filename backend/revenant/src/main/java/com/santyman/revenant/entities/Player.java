package com.santyman.revenant.entities;

import jakarta.persistence.*;
import lombok.*;
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "players")
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_user", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_player", nullable = false, length = 20)
    private PlayerType typePlayer;

    @Column(nullable = false)
    private Integer level;

    @Column(nullable = false)
    private Integer experience;

    @Column(name = "health_points", nullable = false)
    private Integer healthPoints;

    @Column(name = "strong_points", nullable = false)
    private Integer strongPoints;

    @Column(name = "speed_attack_points", nullable = false)
    private Integer speedAttackPoints;

    @Column(nullable = false)
    private Integer gold;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_map", nullable = false)
    private MapWorld map;

    @Column(name = "pos_x")
    private Integer posX;

    @Column(name="pos_y")
    private Integer posY;
}
