package com.santyman.revenant.dtos;

public record RegisterResponse(
        Long userId,
        String username,
        String email
) {
}
