package com.santyman.revenant.repositories;

import com.santyman.revenant.entities.Npc;
import com.santyman.revenant.entities.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StoreRepository extends JpaRepository<Store, Long> {

    @Query("SELECT s FROM Store s JOIN s.npc n JOIN n.map m WHERE m.id = :mapId")
    List<Store> findByMapId(@Param("mapId") Long mapId);

    Optional<Store> findByNpc(Npc npc);

    Optional<Store> findByNpcId(Long npcId);
}
