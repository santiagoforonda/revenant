package com.santyman.revenant.dtos;

import jakarta.validation.constraints.NotNull;

public record SaveGameRequest(

    @NotNull(message = "Map ID is required")
    Long mapId,

    @NotNull(message = "Position X is required")
    Integer positionX,

    @NotNull(message = "Position Y is required")
    Integer positionY
) {
    
}
