package com.santyman.revenant.dtos;

import java.util.List;

public record NpcResponse(
    Long id,
    Long id_map,
    String name,
    String description,
    List<String> phrases
) {
    
}
