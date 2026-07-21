package com.santyman.revenant.dtos;

public record PurchaseItemResponse(
        Long itemId,
        String itemName,
        Integer quantity,
        Integer remainingGold
) {
}
