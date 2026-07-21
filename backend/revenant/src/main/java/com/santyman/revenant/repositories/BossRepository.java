package com.santyman.revenant.repositories;

import com.santyman.revenant.entities.Boss;
import com.santyman.revenant.entities.MapWorld;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BossRepository extends JpaRepository<Boss, Long> {

    List<Boss> findByMap(MapWorld map);

    List<Boss> findByMapId(Long mapId);
}
