package com.santyman.revenant.dtos;

public record StoreItemResponse(
        Long itemId,
        String itemName,
        Integer price,
        Integer stock
) {
}