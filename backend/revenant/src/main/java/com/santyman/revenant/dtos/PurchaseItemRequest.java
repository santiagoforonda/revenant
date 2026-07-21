package com.santyman.revenant.dtos;

import jakarta.validation.constraints.NotNull;

public record PurchaseItemRequest(
        @NotNull(message = "Store Item ID is required")
        Long storeItemId
) {
}
