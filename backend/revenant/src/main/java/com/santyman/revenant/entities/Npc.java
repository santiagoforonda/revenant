package com.santyman.revenant.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Array;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "npcs")
@PrimaryKeyJoinColumn(name = "id")
public class Npc extends GameCharacter {

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Array(length = 50)
    @Column(name = "phrases", columnDefinition = "TEXT[]")
    private String[] phrases;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_map", nullable = false)
    private MapWorld map;
}
