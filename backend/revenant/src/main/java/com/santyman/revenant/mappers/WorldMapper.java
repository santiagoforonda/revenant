package com.santyman.revenant.mappers;

import com.santyman.revenant.dtos.MapResponse;
import com.santyman.revenant.entities.MapWorld;
import org.springframework.stereotype.Component;

@Component
public class WorldMapper {

    public MapResponse toMapResponse(MapWorld mapWorld) {
        if (mapWorld == null) {
            return null;
        }

        return new MapResponse(
                mapWorld.getId(),
                mapWorld.getName(),
                mapWorld.getDescription()
        );
    }
}