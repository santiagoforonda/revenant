package com.santyman.revenant.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.santyman.revenant.config.SecurityConfig;
import com.santyman.revenant.dtos.AddInventoryItemRequest;
import com.santyman.revenant.dtos.InventoryItemResponse;
import com.santyman.revenant.dtos.UpdateInventoryRequest;
import com.santyman.revenant.entities.EquippedSlot;
import com.santyman.revenant.entities.ItemType;
import com.santyman.revenant.entities.User;
import com.santyman.revenant.exception.GlobalExceptionHandler;
import com.santyman.revenant.security.JwtAuthenticationFilter;
import com.santyman.revenant.security.JwtUtil;
import com.santyman.revenant.services.implementation.UserDetailsServiceImpl;
import com.santyman.revenant.services.interfaces.InventoryService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InventoryController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
class InventoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private InventoryService inventoryService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsServiceImpl;

    private User authenticatedUser;
    private InventoryItemResponse sampleItemResponse;

    @BeforeEach
    void setUp() {
        authenticatedUser = User.builder()
                .id(1L)
                .username("testUser")
                .build();

        sampleItemResponse = new InventoryItemResponse(
                10L,
                "Steel Sword",
                "A sharp steel sword",
                ItemType.ARMA,
                50,
                25,
                false,
                2,
                false,
                null
        );
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

    private void mockAnonymous() throws Exception {
        doAnswer(invocation -> {
            SecurityContextHolder.clearContext();

            jakarta.servlet.FilterChain chain = invocation.getArgument(2);
            chain.doFilter(invocation.getArgument(0), invocation.getArgument(1));
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());
    }

    @Test
    @DisplayName("POST /api/inventory - success: returns 200 with inventory item details")
    void addInventoryItem_success_returns200() throws Exception {
        mockAuthentication();

        AddInventoryItemRequest request = new AddInventoryItemRequest(10L, 2);

        when(inventoryService.addInventoryItem(request)).thenReturn(sampleItemResponse);

        mockMvc.perform(post("/api/inventory")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemId").value(10))
                .andExpect(jsonPath("$.name").value("Steel Sword"))
                .andExpect(jsonPath("$.quantity").value(2))
                .andExpect(jsonPath("$.equipped").value(false));

        verify(inventoryService).addInventoryItem(request);
    }

    @Test
    @DisplayName("POST /api/inventory - invalid input (negative quantity): returns 400 Bad Request")
    void addInventoryItem_negativeQuantity_returns400() throws Exception {
        mockAuthentication();

        AddInventoryItemRequest request = new AddInventoryItemRequest(10L, -5);

        mockMvc.perform(post("/api/inventory")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Quantity cannot be negative")));

        verify(inventoryService, never()).addInventoryItem(any());
    }

    @Test
    @DisplayName("POST /api/inventory - item not found in catalog: returns 404 Not Found")
    void addInventoryItem_itemNotFound_returns404() throws Exception {
        mockAuthentication();

        AddInventoryItemRequest request = new AddInventoryItemRequest(999L, 1);

        when(inventoryService.addInventoryItem(request))
                .thenThrow(new EntityNotFoundException("Item not found with id: 999"));

        mockMvc.perform(post("/api/inventory")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Item not found with id: 999"));

        verify(inventoryService).addInventoryItem(request);
    }

    @Test
    @DisplayName("POST /api/inventory - unauthorized: returns 403 Forbidden")
    void addInventoryItem_unauthorized_returns403() throws Exception {
        mockAnonymous();

        AddInventoryItemRequest request = new AddInventoryItemRequest(10L, 2);

        mockMvc.perform(post("/api/inventory")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        verify(inventoryService, never()).addInventoryItem(any());
    }

    @Test
    @DisplayName("PUT /api/inventory - success: returns 200 with updated details")
    void updateInventoryItemQuantity_success_returns200() throws Exception {
        mockAuthentication();

        UpdateInventoryRequest request = new UpdateInventoryRequest(10L, 5);
        InventoryItemResponse updatedResponse = new InventoryItemResponse(
                10L, "Steel Sword", "A sharp steel sword", ItemType.ARMA, 50, 25, false, 5, false, null
        );

        when(inventoryService.updateInventoryItemQuantity(request)).thenReturn(updatedResponse);

        mockMvc.perform(put("/api/inventory")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemId").value(10))
                .andExpect(jsonPath("$.quantity").value(5));

        verify(inventoryService).updateInventoryItemQuantity(request);
    }

    @Test
    @DisplayName("PUT /api/inventory - invalid input (negative quantity): returns 400 Bad Request")
    void updateInventoryItemQuantity_negativeQuantity_returns400() throws Exception {
        mockAuthentication();

        UpdateInventoryRequest request = new UpdateInventoryRequest(10L, -2);

        mockMvc.perform(put("/api/inventory")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Quantity cannot be negative")));

        verify(inventoryService, never()).updateInventoryItemQuantity(any());
    }

    @Test
    @DisplayName("PUT /api/inventory - not found: returns 404 Not Found")
    void updateInventoryItemQuantity_notFound_returns404() throws Exception {
        mockAuthentication();

        UpdateInventoryRequest request = new UpdateInventoryRequest(10L, 5);

        when(inventoryService.updateInventoryItemQuantity(request))
                .thenThrow(new EntityNotFoundException("Inventory item not found for player and item id: 10"));

        mockMvc.perform(put("/api/inventory")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Inventory item not found for player and item id: 10"));

        verify(inventoryService).updateInventoryItemQuantity(request);
    }

    @Test
    @DisplayName("PUT /api/inventory - unauthorized: returns 403 Forbidden")
    void updateInventoryItemQuantity_unauthorized_returns403() throws Exception {
        mockAnonymous();

        UpdateInventoryRequest request = new UpdateInventoryRequest(10L, 5);

        mockMvc.perform(put("/api/inventory")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        verify(inventoryService, never()).updateInventoryItemQuantity(any());
    }

    @Test
    @DisplayName("DELETE /api/inventory/{itemId} - success: returns 204 No Content")
    void removeInventoryItem_success_returns204() throws Exception {
        mockAuthentication();

        doNothing().when(inventoryService).removeInventoryItem(10L);

        mockMvc.perform(delete("/api/inventory/10"))
                .andExpect(status().isNoContent());

        verify(inventoryService).removeInventoryItem(10L);
    }

    @Test
    @DisplayName("DELETE /api/inventory/{itemId} - not found: returns 404 Not Found")
    void removeInventoryItem_notFound_returns404() throws Exception {
        mockAuthentication();

        doThrow(new EntityNotFoundException("Inventory item not found for player and item id: 10"))
                .when(inventoryService).removeInventoryItem(10L);

        mockMvc.perform(delete("/api/inventory/10"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));

        verify(inventoryService).removeInventoryItem(10L);
    }

    @Test
    @DisplayName("DELETE /api/inventory/{itemId} - unauthorized: returns 403 Forbidden")
    void removeInventoryItem_unauthorized_returns403() throws Exception {
        mockAnonymous();

        mockMvc.perform(delete("/api/inventory/10"))
                .andExpect(status().isForbidden());

        verify(inventoryService, never()).removeInventoryItem(anyLong());
    }

    @Test
    @DisplayName("GET /api/inventory - success: returns 200 with inventory list")
    void getPlayerInventory_success_returns200() throws Exception {
        mockAuthentication();

        when(inventoryService.getPlayerInventory()).thenReturn(List.of(sampleItemResponse));

        mockMvc.perform(get("/api/inventory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].itemId").value(10))
                .andExpect(jsonPath("$[0].name").value("Steel Sword"));

        verify(inventoryService).getPlayerInventory();
    }

    @Test
    @DisplayName("GET /api/inventory - unauthorized: returns 403 Forbidden")
    void getPlayerInventory_unauthorized_returns403() throws Exception {
        mockAnonymous();

        mockMvc.perform(get("/api/inventory"))
                .andExpect(status().isForbidden());

        verify(inventoryService, never()).getPlayerInventory();
    }
}
