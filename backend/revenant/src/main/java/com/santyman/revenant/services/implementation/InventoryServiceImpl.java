package com.santyman.revenant.services.implementation;

import com.santyman.revenant.dtos.AddInventoryItemRequest;
import com.santyman.revenant.dtos.InventoryItemResponse;
import com.santyman.revenant.dtos.UpdateInventoryRequest;
import com.santyman.revenant.entities.Inventory;
import com.santyman.revenant.entities.Item;
import com.santyman.revenant.entities.Player;
import com.santyman.revenant.entities.User;
import com.santyman.revenant.exception.InvalidOrMissingTokenException;
import com.santyman.revenant.mappers.InventoryMapper;
import com.santyman.revenant.repositories.InventoryRepository;
import com.santyman.revenant.repositories.ItemRepository;
import com.santyman.revenant.repositories.PlayerRepository;
import com.santyman.revenant.services.interfaces.InventoryService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final PlayerRepository playerRepository;
    private final ItemRepository itemRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryMapper inventoryMapper;

    @Override
    @Transactional
    public InventoryItemResponse addInventoryItem(AddInventoryItemRequest request) {
        if (request.quantity() == null || request.quantity() < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative");
        }

        Player player = getAuthenticatedPlayer();
        Item item = itemRepository.findById(request.itemId())
                .orElseThrow(() -> new EntityNotFoundException("Item not found with id: " + request.itemId()));

        Optional<Inventory> existingInventoryOpt = inventoryRepository.findByPlayerAndItem(player, item);
        Inventory inventory;

        if (existingInventoryOpt.isPresent()) {
            inventory = existingInventoryOpt.get();
            inventory.setQuantity(inventory.getQuantity() + request.quantity());
        } else {
            inventory = Inventory.builder()
                    .player(player)
                    .item(item)
                    .quantity(request.quantity())
                    .equipped(false)
                    .equippedSlot(null)
                    .build();
        }

        Inventory saved = inventoryRepository.save(inventory);
        return inventoryMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public InventoryItemResponse updateInventoryItemQuantity(UpdateInventoryRequest request) {
        if (request.quantity() == null || request.quantity() < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative");
        }

        Player player = getAuthenticatedPlayer();
        Item item = itemRepository.findById(request.itemId())
                .orElseThrow(() -> new EntityNotFoundException("Item not found with id: " + request.itemId()));

        Inventory inventory = inventoryRepository.findByPlayerAndItem(player, item)
                .orElseThrow(() -> new EntityNotFoundException("Inventory item not found for player and item id: " + request.itemId()));

        inventory.setQuantity(request.quantity());
        Inventory saved = inventoryRepository.save(inventory);
        return inventoryMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void removeInventoryItem(Long itemId) {
        Player player = getAuthenticatedPlayer();
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Item not found with id: " + itemId));

        Inventory inventory = inventoryRepository.findByPlayerAndItem(player, item)
                .orElseThrow(() -> new EntityNotFoundException("Inventory item not found for player and item id: " + itemId));

        inventoryRepository.delete(inventory);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryItemResponse> getPlayerInventory() {
        Player player = getAuthenticatedPlayer();
        List<Inventory> inventoryList = inventoryRepository.findByPlayerWithItem(player);
        return inventoryList.stream()
                .map(inventoryMapper::toResponse)
                .collect(Collectors.toList());
    }

    private Player getAuthenticatedPlayer() {
        User authenticatedUser = (User) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        return playerRepository.findByUser(authenticatedUser)
                .orElseThrow(() -> new InvalidOrMissingTokenException("No player profile found for the authenticated user"));
    }
}
