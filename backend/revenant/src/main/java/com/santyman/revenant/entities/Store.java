package com.santyman.revenant.entities;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "stores")
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_npc", nullable = false, unique = true)
    private Npc npc;

    @Column(nullable = false, unique = true, length = 80)
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;
}
