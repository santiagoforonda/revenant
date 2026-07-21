package com.santyman.revenant.controllers;

import com.santyman.revenant.config.SecurityConfig;
import com.santyman.revenant.dtos.MapResponse;
import com.santyman.revenant.entities.User;
import com.santyman.revenant.exception.GlobalExceptionHandler;
import com.santyman.revenant.security.JwtAuthenticationEntryPoint;
import com.santyman.revenant.security.JwtAuthenticationFilter;
import com.santyman.revenant.security.JwtUtil;
import com.santyman.revenant.services.implementation.UserDetailsServiceImpl;
import com.santyman.revenant.services.interfaces.WorldService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(WorldController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
class WorldControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private WorldService worldService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsServiceImpl;

    private User authenticatedUser;
    private MapResponse mapResponse;

    @BeforeEach
    void setUp() {
        authenticatedUser = User.builder()
                .id(1L)
                .username("testUser")
                .build();

        mapResponse = new MapResponse(2L, "Forest", "A dense forest");
    }

    private void mockAuthentication() throws Exception {
        doAnswer(invocation -> {
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    authenticatedUser, null, List.of()
            );
            SecurityContextHolder.getContext().setAuthentication(auth);

            jakarta.servlet.FilterChain chain = invocation.getArgument(2);
            chain.doFilter(invocation.getArgument(0), invocation.getArgument(1));
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());
    }

    @Test
    @DisplayName("GET /api/world/maps - success: returns 200 with maps")
    void getAllMaps_success_returns200() throws Exception {
        mockAuthentication();

        when(worldService.getAllMaps()).thenReturn(List.of(mapResponse));

        mockMvc.perform(get("/api/world/maps")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(2))
                .andExpect(jsonPath("$[0].name").value("Forest"))
                .andExpect(jsonPath("$[0].description").value("A dense forest"));

        verify(worldService).getAllMaps();
    }

    @Test
    @DisplayName("GET /api/world/maps - empty: returns 200 with empty list")
    void getAllMaps_empty_returns200() throws Exception {
        mockAuthentication();

        when(worldService.getAllMaps()).thenReturn(List.of());

        mockMvc.perform(get("/api/world/maps")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        verify(worldService).getAllMaps();
    }
}