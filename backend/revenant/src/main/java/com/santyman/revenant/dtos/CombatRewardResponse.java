package com.santyman.revenant.dtos;

public record CombatRewardResponse(
        Integer goldObtained,
        Integer experienceObtained,
        Integer currentGold,
        Integer currentExperience,
        Integer currentLevel,
        Boolean bossDefeated
) {
}
