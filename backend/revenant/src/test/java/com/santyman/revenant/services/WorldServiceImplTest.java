package com.santyman.revenant.services;

import com.santyman.revenant.dtos.MapResponse;
import com.santyman.revenant.entities.MapWorld;
import com.santyman.revenant.entities.User;
import com.santyman.revenant.mappers.WorldMapper;
import com.santyman.revenant.repositories.MapWorldRepository;
import com.santyman.revenant.services.implementation.WorldServiceImpl;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorldServiceImplTest {

    @Mock
    private MapWorldRepository mapWorldRepository;

    @Mock
    private WorldMapper worldMapper;

    @InjectMocks
    private WorldServiceImpl worldService;

    private User authenticatedUser;
    private MapWorld mapWorld;

    @BeforeEach
    void setUp() {
        authenticatedUser = User.builder()
                .id(1L)
                .username("testUser")
                .email("test@example.com")
                .password("password")
                .build();

        mapWorld = MapWorld.builder()
                .id(2L)
                .name("Forest")
                .description("A dense forest")
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
    @DisplayName("getAllMaps - success: returns mapped maps ordered by id")
    void getAllMaps_success() {
        MapResponse mapped = new MapResponse(2L, "Forest", "A dense forest");

        when(mapWorldRepository.findAllByOrderByIdAsc()).thenReturn(List.of(mapWorld));
        when(worldMapper.toMapResponse(mapWorld)).thenReturn(mapped);

        List<MapResponse> result = worldService.getAllMaps();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(2L);
        verify(mapWorldRepository).findAllByOrderByIdAsc();
    }

    @Test
    @DisplayName("getAllMaps - empty: returns empty list")
    void getAllMaps_empty() {
        when(mapWorldRepository.findAllByOrderByIdAsc()).thenReturn(List.of());

        List<MapResponse> result = worldService.getAllMaps();

        assertThat(result).isEmpty();
        verify(worldMapper, never()).toMapResponse(any());
    }

    @Test
    @DisplayName("getAllMaps - missing authentication: throws InvalidOrMissingTokenException")
    void getAllMaps_missingAuthentication_throwsException() {
        SecurityContextHolder.clearContext();

        assertThatThrownBy(() -> worldService.getAllMaps())
                .isInstanceOf(com.santyman.revenant.exception.InvalidOrMissingTokenException.class)
                .hasMessageContaining("No authenticated user found");

        verifyNoInteractions(mapWorldRepository, worldMapper);
    }
}