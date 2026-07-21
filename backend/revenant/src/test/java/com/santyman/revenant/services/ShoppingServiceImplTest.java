package com.santyman.revenant.services;

import com.santyman.revenant.dtos.AddInventoryItemRequest;
import com.santyman.revenant.dtos.InventoryItemResponse;
import com.santyman.revenant.dtos.PurchaseItemRequest;
import com.santyman.revenant.dtos.PurchaseItemResponse;
import com.santyman.revenant.entities.Item;
import com.santyman.revenant.entities.Player;
import com.santyman.revenant.entities.StoreItem;
import com.santyman.revenant.entities.User;
import com.santyman.revenant.repositories.PlayerRepository;
import com.santyman.revenant.repositories.StoreItemRepository;
import com.santyman.revenant.services.implementation.ShoppingServiceImpl;
import com.santyman.revenant.services.interfaces.InventoryService;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShoppingServiceImplTest {

    @Mock
    private PlayerRepository playerRepository;

    @Mock
    private StoreItemRepository storeItemRepository;

    @Mock
    private InventoryService inventoryService;

    @InjectMocks
    private ShoppingServiceImpl shoppingService;

    private User authenticatedUser;
    private Player player;
    private Item item;
    private StoreItem storeItem;

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
                .gold(100)
                .build();

        item = Item.builder()
                .id(50L)
                .name("Health Potion")
                .price(30)
                .build();

        storeItem = StoreItem.builder()
                .id(10L)
                .item(item)
                .stock(5)
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
    @DisplayName("purchaseItem - success: processes purchase correctly")
    void purchaseItem_success() {
        PurchaseItemRequest request = new PurchaseItemRequest(10L);
        InventoryItemResponse mockInvResponse = new InventoryItemResponse(
                50L, "Health Potion", "Restores HP", null, 30, 15, false, 1, false, null
        );

        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.of(player));
        when(storeItemRepository.findByIdWithItem(10L)).thenReturn(Optional.of(storeItem));
        when(inventoryService.addInventoryItem(any(AddInventoryItemRequest.class))).thenReturn(mockInvResponse);

        PurchaseItemResponse response = shoppingService.purchaseItem(request);

        assertThat(response).isNotNull();
        assertThat(response.itemId()).isEqualTo(50L);
        assertThat(response.itemName()).isEqualTo("Health Potion");
        assertThat(response.quantity()).isEqualTo(1);
        assertThat(response.remainingGold()).isEqualTo(70);

        assertThat(player.getGold()).isEqualTo(70);
        assertThat(storeItem.getStock()).isEqualTo(4);

        verify(playerRepository).save(player);
        verify(storeItemRepository).save(storeItem);
        verify(inventoryService).addInventoryItem(new AddInventoryItemRequest(50L, 1));
    }

    @Test
    @DisplayName("purchaseItem - store item not found: throws EntityNotFoundException")
    void purchaseItem_itemNotFound_throwsException() {
        PurchaseItemRequest request = new PurchaseItemRequest(999L);

        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.of(player));
        when(storeItemRepository.findByIdWithItem(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> shoppingService.purchaseItem(request))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Store item not found with id: 999");

        verify(playerRepository, never()).save(any());
        verify(storeItemRepository, never()).save(any());
        verify(inventoryService, never()).addInventoryItem(any());
    }

    @Test
    @DisplayName("purchaseItem - out of stock: throws IllegalArgumentException")
    void purchaseItem_outOfStock_throwsException() {
        PurchaseItemRequest request = new PurchaseItemRequest(10L);
        storeItem.setStock(0);

        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.of(player));
        when(storeItemRepository.findByIdWithItem(10L)).thenReturn(Optional.of(storeItem));

        assertThatThrownBy(() -> shoppingService.purchaseItem(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Store item is out of stock");

        verify(playerRepository, never()).save(any());
        verify(storeItemRepository, never()).save(any());
        verify(inventoryService, never()).addInventoryItem(any());
    }

    @Test
    @DisplayName("purchaseItem - insufficient gold: throws IllegalArgumentException")
    void purchaseItem_insufficientGold_throwsException() {
        PurchaseItemRequest request = new PurchaseItemRequest(10L);
        player.setGold(10); // Price is 30

        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.of(player));
        when(storeItemRepository.findByIdWithItem(10L)).thenReturn(Optional.of(storeItem));

        assertThatThrownBy(() -> shoppingService.purchaseItem(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Insufficient gold to complete purchase");

        verify(playerRepository, never()).save(any());
        verify(storeItemRepository, never()).save(any());
        verify(inventoryService, never()).addInventoryItem(any());
    }

    @Test
    @DisplayName("purchaseItem - inventory addition fails: propagates exception")
    void purchaseItem_inventoryServiceFails_propagatesException() {
        PurchaseItemRequest request = new PurchaseItemRequest(10L);

        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.of(player));
        when(storeItemRepository.findByIdWithItem(10L)).thenReturn(Optional.of(storeItem));
        when(inventoryService.addInventoryItem(any(AddInventoryItemRequest.class)))
                .thenThrow(new RuntimeException("Database error during inventory write"));

        assertThatThrownBy(() -> shoppingService.purchaseItem(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Database error during inventory write");
    }
}
