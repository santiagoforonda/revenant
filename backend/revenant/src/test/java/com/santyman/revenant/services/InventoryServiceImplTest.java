package com.santyman.revenant.services;

import com.santyman.revenant.dtos.AddInventoryItemRequest;
import com.santyman.revenant.dtos.InventoryItemResponse;
import com.santyman.revenant.dtos.UpdateInventoryRequest;
import com.santyman.revenant.entities.*;
import com.santyman.revenant.mappers.InventoryMapper;
import com.santyman.revenant.repositories.InventoryRepository;
import com.santyman.revenant.repositories.ItemRepository;
import com.santyman.revenant.repositories.PlayerRepository;
import com.santyman.revenant.services.implementation.InventoryServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceImplTest {

    @Mock
    private PlayerRepository playerRepository;

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private InventoryMapper inventoryMapper;

    @InjectMocks
    private InventoryServiceImpl inventoryService;

    private User authenticatedUser;
    private Player player;
    private Item item;
    private Inventory inventory;

    @BeforeEach
    void setUp() {
        authenticatedUser = User.builder()
                .id(1L)
                .username("testUser")
                .email("test@example.com")
                .password("password")
                .build();

        player = Player.builder()
                .id(1L)
                .user(authenticatedUser)
                .level(1)
                .experience(0)
                .gold(100)
                .build();

        item = Item.builder()
                .id(10L)
                .name("Steel Sword")
                .description("A sharp steel sword")
                .itemType(ItemType.ARMA)
                .price(50)
                .sellPrice(25)
                .isSpecial(false)
                .build();

        inventory = Inventory.builder()
                .id(100L)
                .player(player)
                .item(item)
                .quantity(1)
                .equipped(false)
                .equippedSlot(null)
                .build();

        // Setup security context
        Authentication authentication = mock(Authentication.class);
        lenient().when(authentication.getPrincipal()).thenReturn(authenticatedUser);

        SecurityContext securityContext = mock(SecurityContext.class);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);

        SecurityContextHolder.setContext(securityContext);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("addInventoryItem - success: item does not exist, creates new inventory")
    void addInventoryItem_new_success() {
        AddInventoryItemRequest request = new AddInventoryItemRequest(10L, 2);
        InventoryItemResponse expectedResponse = new InventoryItemResponse(
                10L, "Steel Sword", "A sharp steel sword", ItemType.ARMA, 50, 25, false, 2, false, null
        );

        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.of(player));
        when(itemRepository.findById(10L)).thenReturn(Optional.of(item));
        when(inventoryRepository.findByPlayerAndItem(player, item)).thenReturn(Optional.empty());
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(inventoryMapper.toResponse(any(Inventory.class))).thenReturn(expectedResponse);

        InventoryItemResponse response = inventoryService.addInventoryItem(request);

        assertThat(response).isNotNull();
        assertThat(response.itemId()).isEqualTo(10L);
        assertThat(response.quantity()).isEqualTo(2);

        verify(inventoryRepository).save(argThat(inv ->
                inv.getPlayer().equals(player) &&
                inv.getItem().equals(item) &&
                inv.getQuantity() == 2 &&
                !inv.getEquipped()
        ));
    }

    @Test
    @DisplayName("addInventoryItem - success: item exists, increments quantity")
    void addInventoryItem_existing_success() {
        AddInventoryItemRequest request = new AddInventoryItemRequest(10L, 3);
        InventoryItemResponse expectedResponse = new InventoryItemResponse(
                10L, "Steel Sword", "A sharp steel sword", ItemType.ARMA, 50, 25, false, 4, false, null
        );

        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.of(player));
        when(itemRepository.findById(10L)).thenReturn(Optional.of(item));
        when(inventoryRepository.findByPlayerAndItem(player, item)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(inventory)).thenReturn(inventory);
        when(inventoryMapper.toResponse(inventory)).thenReturn(expectedResponse);

        InventoryItemResponse response = inventoryService.addInventoryItem(request);

        assertThat(response).isNotNull();
        assertThat(response.quantity()).isEqualTo(4);

        assertThat(inventory.getQuantity()).isEqualTo(4);
        verify(inventoryRepository).save(inventory);
    }

    @Test
    @DisplayName("addInventoryItem - negative quantity: throws IllegalArgumentException")
    void addInventoryItem_negativeQuantity_throwsException() {
        AddInventoryItemRequest request = new AddInventoryItemRequest(10L, -1);

        assertThatThrownBy(() -> inventoryService.addInventoryItem(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Quantity cannot be negative");

        verify(inventoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("addInventoryItem - item not found: throws EntityNotFoundException")
    void addInventoryItem_itemNotFound_throwsException() {
        AddInventoryItemRequest request = new AddInventoryItemRequest(999L, 2);

        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.of(player));
        when(itemRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryService.addInventoryItem(request))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Item not found with id: 999");

        verify(inventoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("addInventoryItem - player not found: throws IllegalStateException")
    void addInventoryItem_playerNotFound_throwsException() {
        AddInventoryItemRequest request = new AddInventoryItemRequest(10L, 2);

        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryService.addInventoryItem(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("No player profile found for the authenticated user");

        verify(inventoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateInventoryItemQuantity - success: sets new quantity")
    void updateInventoryItemQuantity_success() {
        UpdateInventoryRequest request = new UpdateInventoryRequest(10L, 5);
        InventoryItemResponse expectedResponse = new InventoryItemResponse(
                10L, "Steel Sword", "A sharp steel sword", ItemType.ARMA, 50, 25, false, 5, false, null
        );

        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.of(player));
        when(itemRepository.findById(10L)).thenReturn(Optional.of(item));
        when(inventoryRepository.findByPlayerAndItem(player, item)).thenReturn(Optional.of(inventory));
        when(inventoryRepository.save(inventory)).thenReturn(inventory);
        when(inventoryMapper.toResponse(inventory)).thenReturn(expectedResponse);

        InventoryItemResponse response = inventoryService.updateInventoryItemQuantity(request);

        assertThat(response).isNotNull();
        assertThat(response.quantity()).isEqualTo(5);
        assertThat(inventory.getQuantity()).isEqualTo(5);

        verify(inventoryRepository).save(inventory);
    }

    @Test
    @DisplayName("updateInventoryItemQuantity - negative quantity: throws IllegalArgumentException")
    void updateInventoryItemQuantity_negativeQuantity_throwsException() {
        UpdateInventoryRequest request = new UpdateInventoryRequest(10L, -5);

        assertThatThrownBy(() -> inventoryService.updateInventoryItemQuantity(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Quantity cannot be negative");

        verify(inventoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateInventoryItemQuantity - inventory record not found: throws EntityNotFoundException")
    void updateInventoryItemQuantity_notFound_throwsException() {
        UpdateInventoryRequest request = new UpdateInventoryRequest(10L, 5);

        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.of(player));
        when(itemRepository.findById(10L)).thenReturn(Optional.of(item));
        when(inventoryRepository.findByPlayerAndItem(player, item)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryService.updateInventoryItemQuantity(request))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Inventory item not found for player and item id: 10");

        verify(inventoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("removeInventoryItem - success: deletes entry")
    void removeInventoryItem_success() {
        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.of(player));
        when(itemRepository.findById(10L)).thenReturn(Optional.of(item));
        when(inventoryRepository.findByPlayerAndItem(player, item)).thenReturn(Optional.of(inventory));

        inventoryService.removeInventoryItem(10L);

        verify(inventoryRepository).delete(inventory);
    }

    @Test
    @DisplayName("removeInventoryItem - item not found: throws EntityNotFoundException")
    void removeInventoryItem_itemNotFound_throwsException() {
        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.of(player));
        when(itemRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryService.removeInventoryItem(999L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Item not found with id: 999");

        verify(inventoryRepository, never()).delete(any(Inventory.class));
    }

    @Test
    @DisplayName("removeInventoryItem - inventory item not found: throws EntityNotFoundException")
    void removeInventoryItem_inventoryNotFound_throwsException() {
        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.of(player));
        when(itemRepository.findById(10L)).thenReturn(Optional.of(item));
        when(inventoryRepository.findByPlayerAndItem(player, item)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inventoryService.removeInventoryItem(10L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Inventory item not found for player and item id: 10");

        verify(inventoryRepository, never()).delete(any(Inventory.class));
    }

    @Test
    @DisplayName("getPlayerInventory - success: returns list")
    void getPlayerInventory_success() {
        InventoryItemResponse mapped = new InventoryItemResponse(
                10L, "Steel Sword", "A sharp steel sword", ItemType.ARMA, 50, 25, false, 1, false, null
        );

        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.of(player));
        when(inventoryRepository.findByPlayerWithItem(player)).thenReturn(List.of(inventory));
        when(inventoryMapper.toResponse(inventory)).thenReturn(mapped);

        List<InventoryItemResponse> result = inventoryService.getPlayerInventory();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).itemId()).isEqualTo(10L);
    }

    @Test
    @DisplayName("getPlayerInventory - empty: returns empty list")
    void getPlayerInventory_empty() {
        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.of(player));
        when(inventoryRepository.findByPlayerWithItem(player)).thenReturn(List.of());

        List<InventoryItemResponse> result = inventoryService.getPlayerInventory();

        assertThat(result).isEmpty();
    }
}
