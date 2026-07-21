package com.santyman.revenant.services.interfaces;

import com.santyman.revenant.dtos.EnemyResponse;
import com.santyman.revenant.dtos.MapResponse;
import com.santyman.revenant.dtos.NpcResponse;

import java.util.List;

public interface WorldService {

    List<MapResponse> getAllMaps();

    List<EnemyResponse> getEnemiesByMap(Long id);

    List<NpcResponse> getNpcByMap(Long id);
}