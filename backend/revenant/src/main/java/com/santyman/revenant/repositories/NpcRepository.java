package com.santyman.revenant.repositories;

import com.santyman.revenant.entities.MapWorld;
import com.santyman.revenant.entities.Npc;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NpcRepository extends JpaRepository<Npc, Long> {

    List<Npc> findByMap(MapWorld map);

    List<Npc> findByMapId(Long mapId);
}
