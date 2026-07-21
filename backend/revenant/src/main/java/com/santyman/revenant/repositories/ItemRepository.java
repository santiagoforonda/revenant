package com.santyman.revenant.repositories;

import com.santyman.revenant.entities.Item;
import com.santyman.revenant.entities.ItemType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, Long> {

    Optional<Item> findByName(String name);

    List<Item> findByItemType(ItemType itemType);

    List<Item> findByIsSpecialTrue();
}
