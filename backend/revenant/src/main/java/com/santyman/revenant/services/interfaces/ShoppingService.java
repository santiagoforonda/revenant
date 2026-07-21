package com.santyman.revenant.services.interfaces;

import com.santyman.revenant.dtos.PurchaseItemRequest;
import com.santyman.revenant.dtos.PurchaseItemResponse;

public interface ShoppingService {

    PurchaseItemResponse purchaseItem(PurchaseItemRequest request);
}
