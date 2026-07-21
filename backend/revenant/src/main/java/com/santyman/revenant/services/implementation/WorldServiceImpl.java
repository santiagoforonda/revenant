package com.santyman.revenant.services.implementation;

import com.santyman.revenant.dtos.EnemyResponse;
import com.santyman.revenant.dtos.MapResponse;
import com.santyman.revenant.dtos.NpcResponse;
import com.santyman.revenant.entities.User;
import com.santyman.revenant.exception.InvalidOrMissingTokenException;
import com.santyman.revenant.mappers.EnemyMapper;
import com.santyman.revenant.mappers.NpcMapper;
import com.santyman.revenant.mappers.WorldMapper;
import com.santyman.revenant.repositories.EnemyRepository;
import com.santyman.revenant.repositories.MapWorldRepository;
import com.santyman.revenant.repositories.NpcRepository;
import com.santyman.revenant.services.interfaces.WorldService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorldServiceImpl implements WorldService {

    private final MapWorldRepository mapWorldRepository;
    private final WorldMapper worldMapper;
    private final EnemyRepository enemyRepository;
    private final EnemyMapper enemyMapper;
    private final NpcRepository npcRepository;
    private final NpcMapper npcMapper;

    @Override
    @Transactional(readOnly = true)
    public List<MapResponse> getAllMaps() {
        getAuthenticatedUser();

        return mapWorldRepository.findAllByOrderByIdAsc().stream()
                .map(worldMapper::toMapResponse)
                .toList();
    }

    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getPrincipal()
                : null;

        if (!(principal instanceof User authenticatedUser)) {
            throw new InvalidOrMissingTokenException("No authenticated user found in the security context");
        }

        return authenticatedUser;
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnemyResponse> getEnemiesByMap(Long id) {
        return enemyRepository.findByMapId(id).stream().map(enemyMapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NpcResponse> getNpcByMap(Long id) {
        return npcRepository.findByMapId(id).stream().map(npcMapper::toResponse).toList();
    }

}