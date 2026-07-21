package com.santyman.revenant.mappers;

import com.santyman.revenant.dtos.InventoryItemResponse;
import com.santyman.revenant.entities.Inventory;
import org.springframework.stereotype.Component;

@Component
public class InventoryMapper {

    public InventoryItemResponse toResponse(Inventory inventory) {
        if (inventory == null) {
            return null;
        }

        return new InventoryItemResponse(
                inventory.getItem().getId(),
                inventory.getItem().getName(),
                inventory.getItem().getDescription(),
                inventory.getItem().getItemType(),
                inventory.getItem().getPrice(),
                inventory.getItem().getSellPrice(),
                inventory.getItem().getIsSpecial(),
                inventory.getQuantity(),
                inventory.getEquipped(),
                inventory.getEquippedSlot()
        );
    }
}
