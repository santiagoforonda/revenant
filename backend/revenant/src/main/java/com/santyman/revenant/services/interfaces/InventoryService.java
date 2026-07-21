package com.santyman.revenant.services.interfaces;

import com.santyman.revenant.dtos.AddInventoryItemRequest;
import com.santyman.revenant.dtos.InventoryItemResponse;
import com.santyman.revenant.dtos.UpdateInventoryRequest;

import java.util.List;

public interface InventoryService {

    InventoryItemResponse addInventoryItem(AddInventoryItemRequest request);

    InventoryItemResponse updateInventoryItemQuantity(UpdateInventoryRequest request);

    void removeInventoryItem(Long itemId);

    List<InventoryItemResponse> getPlayerInventory();
}
