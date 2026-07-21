package com.santyman.revenant.repositories;

import com.santyman.revenant.entities.Enemy;
import com.santyman.revenant.entities.MapWorld;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnemyRepository extends JpaRepository<Enemy, Long> {

    List<Enemy> findByMap(MapWorld map);

    List<Enemy> findByMapId(Long mapId);
}
