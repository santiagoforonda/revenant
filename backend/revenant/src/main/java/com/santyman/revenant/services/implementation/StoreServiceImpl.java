package com.santyman.revenant.services.implementation;

import com.santyman.revenant.dtos.StoreItemResponse;
import com.santyman.revenant.dtos.StoreResponse;
import com.santyman.revenant.entities.Store;
import com.santyman.revenant.entities.User;
import com.santyman.revenant.exception.InvalidOrMissingTokenException;
import com.santyman.revenant.mappers.StoreMapper;
import com.santyman.revenant.repositories.StoreItemRepository;
import com.santyman.revenant.repositories.StoreRepository;
import com.santyman.revenant.services.interfaces.StoreService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StoreServiceImpl implements StoreService {

    private final StoreRepository storeRepository;
    private final StoreItemRepository storeItemRepository;
    private final StoreMapper storeMapper;

    @Override
    @Transactional(readOnly = true)
    public List<StoreResponse> getStoresByMap(Long mapId) {
        getAuthenticatedUser();

        return storeRepository.findByMapId(mapId).stream()
                .map(storeMapper::toStoreResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StoreItemResponse> getItemsByStore(Long storeId) {
        getAuthenticatedUser();

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new EntityNotFoundException("Store not found with id: " + storeId));

        return storeItemRepository.findByStoreWithItem(store).stream()
                .map(storeMapper::toStoreItemResponse)
                .toList();
    }

    private User getAuthenticatedUser() {
        User authentication = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (authentication == null || !(authentication instanceof User authenticatedUser)) {
            throw new InvalidOrMissingTokenException("No authenticated user found in the security context");
        }

        return authenticatedUser;
    }
}