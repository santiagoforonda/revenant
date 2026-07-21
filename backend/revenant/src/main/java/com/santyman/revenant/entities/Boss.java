package com.santyman.revenant.entities;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "bosses")
@PrimaryKeyJoinColumn(name = "id")
public class Boss extends Enemy {
    // All combat stats are inherited from Enemy.
    // Per-player defeat tracking lives in PlayerBoss.
}
