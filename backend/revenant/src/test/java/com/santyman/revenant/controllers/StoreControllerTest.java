package com.santyman.revenant.controllers;

import com.santyman.revenant.config.SecurityConfig;
import com.santyman.revenant.dtos.StoreItemResponse;
import com.santyman.revenant.dtos.StoreResponse;
import com.santyman.revenant.entities.User;
import com.santyman.revenant.exception.GlobalExceptionHandler;
import com.santyman.revenant.security.JwtAuthenticationEntryPoint;
import com.santyman.revenant.security.JwtAuthenticationFilter;
import com.santyman.revenant.security.JwtUtil;
import com.santyman.revenant.services.implementation.UserDetailsServiceImpl;
import com.santyman.revenant.services.interfaces.StoreService;
import jakarta.persistence.EntityNotFoundException;
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
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(StoreController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
class StoreControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StoreService storeService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsServiceImpl;

    private User authenticatedUser;
    private StoreResponse storeResponse;
    private StoreItemResponse storeItemResponse;

    @BeforeEach
    void setUp() {
        authenticatedUser = User.builder()
                .id(1L)
                .username("testUser")
                .build();

        storeResponse = new StoreResponse(10L, "Blacksmith");
        storeItemResponse = new StoreItemResponse(50L, "Steel Sword", 120, 7);
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
    @DisplayName("GET /api/maps/{mapId}/stores - success: returns 200 with stores")
    void getStoresByMap_success_returns200() throws Exception {
        mockAuthentication();

        when(storeService.getStoresByMap(3L)).thenReturn(List.of(storeResponse));

        mockMvc.perform(get("/api/maps/3/stores")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].storeId").value(10))
                .andExpect(jsonPath("$[0].storeName").value("Blacksmith"));

        verify(storeService).getStoresByMap(3L);
    }

    @Test
    @DisplayName("GET /api/maps/{mapId}/stores - empty: returns 200 with empty list")
    void getStoresByMap_empty_returns200() throws Exception {
        mockAuthentication();

        when(storeService.getStoresByMap(3L)).thenReturn(List.of());

        mockMvc.perform(get("/api/maps/3/stores")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        verify(storeService).getStoresByMap(3L);
    }

    @Test
    @DisplayName("GET /api/stores/{storeId}/items - success: returns 200 with items")
    void getItemsByStore_success_returns200() throws Exception {
        mockAuthentication();

        when(storeService.getItemsByStore(10L)).thenReturn(List.of(storeItemResponse));

        mockMvc.perform(get("/api/stores/10/items")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].itemId").value(50))
                .andExpect(jsonPath("$[0].itemName").value("Steel Sword"))
                .andExpect(jsonPath("$[0].price").value(120))
                .andExpect(jsonPath("$[0].stock").value(7));

        verify(storeService).getItemsByStore(10L);
    }

    @Test
    @DisplayName("GET /api/stores/{storeId}/items - not found: returns 404 Not Found")
    void getItemsByStore_notFound_returns404() throws Exception {
        mockAuthentication();

        when(storeService.getItemsByStore(99L))
                .thenThrow(new EntityNotFoundException("Store not found with id: 99"));

        mockMvc.perform(get("/api/stores/99/items")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Store not found with id: 99"));

        verify(storeService).getItemsByStore(99L);
    }

}