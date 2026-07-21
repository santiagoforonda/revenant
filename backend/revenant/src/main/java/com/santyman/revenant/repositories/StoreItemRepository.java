package com.santyman.revenant.repositories;

import com.santyman.revenant.entities.Store;
import com.santyman.revenant.entities.StoreItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StoreItemRepository extends JpaRepository<StoreItem, Long> {

    @Query("SELECT si FROM StoreItem si JOIN FETCH si.item WHERE si.store = :store")
    List<StoreItem> findByStoreWithItem(@Param("store") Store store);

    @Query("SELECT si FROM StoreItem si JOIN FETCH si.item WHERE si.store.id = :storeId AND si.stock > 0")
    List<StoreItem> findAvailableByStoreId(@Param("storeId") Long storeId);

    Optional<StoreItem> findByStoreAndItemId(Store store, Long itemId);

    @Query("SELECT si FROM StoreItem si JOIN FETCH si.item WHERE si.id = :id")
    Optional<StoreItem> findByIdWithItem(@Param("id") Long id);
}
