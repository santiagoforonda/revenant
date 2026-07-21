package com.santyman.revenant.dtos;

import com.santyman.revenant.entities.EquippedSlot;
import com.santyman.revenant.entities.ItemType;

public record InventoryItemResponse(
        Long itemId,
        String name,
        String description,
        ItemType itemType,
        Integer price,
        Integer sellPrice,
        Boolean isSpecial,
        Integer quantity,
        Boolean equipped,
        EquippedSlot equippedSlot
) {
}
