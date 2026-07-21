package com.santyman.revenant.mappers;

import com.santyman.revenant.dtos.StoreItemResponse;
import com.santyman.revenant.dtos.StoreResponse;
import com.santyman.revenant.entities.Store;
import com.santyman.revenant.entities.StoreItem;
import org.springframework.stereotype.Component;

@Component
public class StoreMapper {

    public StoreResponse toStoreResponse(Store store) {
        if (store == null) {
            return null;
        }

        return new StoreResponse(
                store.getId(),
                store.getName()
        );
    }

    public StoreItemResponse toStoreItemResponse(StoreItem storeItem) {
        if (storeItem == null) {
            return null;
        }

        return new StoreItemResponse(
                storeItem.getItem().getId(),
                storeItem.getItem().getName(),
                storeItem.getItem().getPrice(),
                storeItem.getStock()
        );
    }
}