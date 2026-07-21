package com.santyman.revenant.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CombatRewardRequest(

        @NotNull(message = "Enemy ID is required")
        @Positive(message = "Enemy ID must be a positive number")
        Long enemyId
) {
}
