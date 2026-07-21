package com.santyman.revenant.services.implementation;

import com.santyman.revenant.dtos.AddInventoryItemRequest;
import com.santyman.revenant.dtos.InventoryItemResponse;
import com.santyman.revenant.dtos.PurchaseItemRequest;
import com.santyman.revenant.dtos.PurchaseItemResponse;
import com.santyman.revenant.entities.Player;
import com.santyman.revenant.entities.StoreItem;
import com.santyman.revenant.entities.User;
import com.santyman.revenant.repositories.PlayerRepository;
import com.santyman.revenant.repositories.StoreItemRepository;
import com.santyman.revenant.services.interfaces.InventoryService;
import com.santyman.revenant.services.interfaces.ShoppingService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ShoppingServiceImpl implements ShoppingService {

    private final PlayerRepository playerRepository;
    private final StoreItemRepository storeItemRepository;
    private final InventoryService inventoryService;

    @Override
    @Transactional
    public PurchaseItemResponse purchaseItem(PurchaseItemRequest request) {
        // Retrieve authenticated user and their player profile
        User authenticatedUser = (User) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        Player player = playerRepository.findByUser(authenticatedUser)
                .orElseThrow(() -> new IllegalStateException("No player profile found for the authenticated user"));

        // Retrieve store item
        StoreItem storeItem = storeItemRepository.findByIdWithItem(request.storeItemId())
                .orElseThrow(() -> new EntityNotFoundException("Store item not found with id: " + request.storeItemId()));

        // Validate stock
        if (storeItem.getStock() <= 0) {
            throw new IllegalArgumentException("Store item is out of stock");
        }

        // Validate player's gold
        int itemPrice = storeItem.getItem().getPrice();
        if (player.getGold() < itemPrice) {
            throw new IllegalArgumentException("Insufficient gold to complete purchase");
        }

        // Process transaction: Deduct gold & decrease stock
        player.setGold(player.getGold() - itemPrice);
        playerRepository.save(player);

        storeItem.setStock(storeItem.getStock() - 1);
        storeItemRepository.save(storeItem);

        // Add item to inventory reusing existing InventoryService logic
        InventoryItemResponse inventoryItemResponse = inventoryService.addInventoryItem(
                new AddInventoryItemRequest(storeItem.getItem().getId(), 1)
        );

        // Map and return response
        return new PurchaseItemResponse(
                storeItem.getItem().getId(),
                storeItem.getItem().getName(),
                inventoryItemResponse.quantity(),
                player.getGold()
        );
    }
}
