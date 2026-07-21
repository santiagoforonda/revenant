package com.santyman.revenant.entities;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "player_bosses",
        uniqueConstraints = @UniqueConstraint(columnNames = {"id_player", "id_boss"})
)
public class PlayerBoss {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_player", nullable = false)
    private Player player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_boss", nullable = false)
    private Boss boss;

    @Column(name = "is_defeat", nullable = false)
    private Boolean isDefeat;
}
