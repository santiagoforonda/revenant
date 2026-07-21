package com.santyman.revenant.services;

import com.santyman.revenant.dtos.StoreItemResponse;
import com.santyman.revenant.dtos.StoreResponse;
import com.santyman.revenant.entities.Item;
import com.santyman.revenant.entities.Store;
import com.santyman.revenant.entities.StoreItem;
import com.santyman.revenant.entities.User;
import com.santyman.revenant.mappers.StoreMapper;
import com.santyman.revenant.repositories.StoreItemRepository;
import com.santyman.revenant.repositories.StoreRepository;
import com.santyman.revenant.services.implementation.StoreServiceImpl;
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
class StoreServiceImplTest {

    @Mock
    private StoreRepository storeRepository;

    @Mock
    private StoreItemRepository storeItemRepository;

    @Mock
    private StoreMapper storeMapper;

    @InjectMocks
    private StoreServiceImpl storeService;

    private User authenticatedUser;
    private Store store;
    private StoreItem storeItem;
    private Item item;

    @BeforeEach
    void setUp() {
        authenticatedUser = User.builder()
                .id(1L)
                .username("testUser")
                .email("test@example.com")
                .password("password")
                .build();

        store = Store.builder()
                .id(10L)
                .name("Blacksmith")
                .description("Weapons and armor")
                .build();

        item = Item.builder()
                .id(50L)
                .name("Steel Sword")
                .price(120)
                .build();

        storeItem = StoreItem.builder()
                .id(100L)
                .store(store)
                .item(item)
                .stock(7)
                .build();

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
    @DisplayName("getStoresByMap - success: returns mapped stores")
    void getStoresByMap_success() {
        StoreResponse mapped = new StoreResponse(10L, "Blacksmith");

        when(storeRepository.findByMapId(3L)).thenReturn(List.of(store));
        when(storeMapper.toStoreResponse(store)).thenReturn(mapped);

        List<StoreResponse> result = storeService.getStoresByMap(3L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).storeId()).isEqualTo(10L);
        verify(storeRepository).findByMapId(3L);
    }

    @Test
    @DisplayName("getStoresByMap - empty: returns empty list")
    void getStoresByMap_empty() {
        when(storeRepository.findByMapId(3L)).thenReturn(List.of());

        List<StoreResponse> result = storeService.getStoresByMap(3L);

        assertThat(result).isEmpty();
        verify(storeMapper, never()).toStoreResponse(any());
    }

    @Test
    @DisplayName("getStoresByMap - missing authentication: throws InvalidOrMissingTokenException")
    void getStoresByMap_missingAuthentication_throwsException() {
        SecurityContextHolder.clearContext();

        assertThatThrownBy(() -> storeService.getStoresByMap(3L))
                .isInstanceOf(com.santyman.revenant.exception.InvalidOrMissingTokenException.class)
                .hasMessageContaining("No authenticated user found");

        verifyNoInteractions(storeRepository, storeMapper);
    }

    @Test
    @DisplayName("getItemsByStore - success: returns mapped store items")
    void getItemsByStore_success() {
        StoreItemResponse mapped = new StoreItemResponse(50L, "Steel Sword", 120, 7);

        when(storeRepository.findById(10L)).thenReturn(Optional.of(store));
        when(storeItemRepository.findByStoreWithItem(store)).thenReturn(List.of(storeItem));
        when(storeMapper.toStoreItemResponse(storeItem)).thenReturn(mapped);

        List<StoreItemResponse> result = storeService.getItemsByStore(10L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).itemId()).isEqualTo(50L);
        verify(storeItemRepository).findByStoreWithItem(store);
    }

    @Test
    @DisplayName("getItemsByStore - empty: returns empty list")
    void getItemsByStore_empty() {
        when(storeRepository.findById(10L)).thenReturn(Optional.of(store));
        when(storeItemRepository.findByStoreWithItem(store)).thenReturn(List.of());

        List<StoreItemResponse> result = storeService.getItemsByStore(10L);

        assertThat(result).isEmpty();
        verify(storeMapper, never()).toStoreItemResponse(any());
    }

    @Test
    @DisplayName("getItemsByStore - store not found: throws EntityNotFoundException")
    void getItemsByStore_notFound_throwsException() {
        when(storeRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> storeService.getItemsByStore(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Store not found with id: 99");

        verify(storeItemRepository, never()).findByStoreWithItem(any());
    }
}