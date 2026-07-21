package com.santyman.revenant.dtos;

import com.santyman.revenant.entities.PlayerType;

import java.util.List;

public record LoginResponse(
        String token,
        String tokenType,
        String username,
        Long mapId,
        Integer posX,
        Integer posY,
        Integer healthPoints,
        Integer strongPoints,
        Integer speedAttackPoints,
        Integer gold,
        Integer level,
        Integer experience,
        PlayerType typePlayer,
        List<InventoryItemResponse> inventory
) {
}
