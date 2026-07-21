package com.santyman.revenant.services.interfaces;

import com.santyman.revenant.dtos.StoreItemResponse;
import com.santyman.revenant.dtos.StoreResponse;

import java.util.List;

public interface StoreService {

    List<StoreResponse> getStoresByMap(Long mapId);

    List<StoreItemResponse> getItemsByStore(Long storeId);
}