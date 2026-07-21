package com.santyman.revenant.dtos;

public record EnemyResponse(
    Long id,
    Long id_map,
    Integer healthPoints,
    Integer damagePoints,
    Integer armorPoints,
    Integer goldReward,
    Integer xpReward,
    Integer speedAttackPoints,
    String name,
    String description
) {
    
}
