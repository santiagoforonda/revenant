package com.santyman.revenant.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.santyman.revenant.config.SecurityConfig;
import com.santyman.revenant.dtos.PurchaseItemRequest;
import com.santyman.revenant.dtos.PurchaseItemResponse;
import com.santyman.revenant.entities.User;
import com.santyman.revenant.exception.GlobalExceptionHandler;
import com.santyman.revenant.security.JwtAuthenticationFilter;
import com.santyman.revenant.security.JwtUtil;
import com.santyman.revenant.services.implementation.UserDetailsServiceImpl;
import com.santyman.revenant.services.interfaces.ShoppingService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ShoppingController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
class ShoppingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private ShoppingService shoppingService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsServiceImpl;

    private User authenticatedUser;
    private PurchaseItemResponse sampleResponse;

    @BeforeEach
    void setUp() {
        authenticatedUser = User.builder()
                .id(1L)
                .username("testUser")
                .build();

        sampleResponse = new PurchaseItemResponse(
                50L,
                "Health Potion",
                1,
                70
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
    @DisplayName("POST /api/shop/purchase - success: returns 200 with purchase details")
    void purchaseItem_success_returns200() throws Exception {
        mockAuthentication();

        PurchaseItemRequest request = new PurchaseItemRequest(10L);

        when(shoppingService.purchaseItem(request)).thenReturn(sampleResponse);

        mockMvc.perform(post("/api/shop/purchase")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemId").value(50))
                .andExpect(jsonPath("$.itemName").value("Health Potion"))
                .andExpect(jsonPath("$.quantity").value(1))
                .andExpect(jsonPath("$.remainingGold").value(70));

        verify(shoppingService).purchaseItem(request);
    }

    @Test
    @DisplayName("POST /api/shop/purchase - invalid input (missing storeItemId): returns 400 Bad Request")
    void purchaseItem_missingId_returns400() throws Exception {
        mockAuthentication();

        PurchaseItemRequest request = new PurchaseItemRequest(null);

        mockMvc.perform(post("/api/shop/purchase")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Store Item ID is required")));

        verify(shoppingService, never()).purchaseItem(any());
    }

    @Test
    @DisplayName("POST /api/shop/purchase - business logic failure (insufficient gold): returns 400 Bad Request")
    void purchaseItem_insufficientGold_returns400() throws Exception {
        mockAuthentication();

        PurchaseItemRequest request = new PurchaseItemRequest(10L);

        when(shoppingService.purchaseItem(request))
                .thenThrow(new IllegalArgumentException("Insufficient gold to complete purchase"));

        mockMvc.perform(post("/api/shop/purchase")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Insufficient gold to complete purchase"));

        verify(shoppingService).purchaseItem(request);
    }

    @Test
    @DisplayName("POST /api/shop/purchase - item not found: returns 404 Not Found")
    void purchaseItem_itemNotFound_returns404() throws Exception {
        mockAuthentication();

        PurchaseItemRequest request = new PurchaseItemRequest(999L);

        when(shoppingService.purchaseItem(request))
                .thenThrow(new EntityNotFoundException("Store item not found with id: 999"));

        mockMvc.perform(post("/api/shop/purchase")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Store item not found with id: 999"));

        verify(shoppingService).purchaseItem(request);
    }

    @Test
    @DisplayName("POST /api/shop/purchase - unauthorized: returns 403 Forbidden")
    void purchaseItem_unauthorized_returns403() throws Exception {
        mockAnonymous();

        PurchaseItemRequest request = new PurchaseItemRequest(10L);

        mockMvc.perform(post("/api/shop/purchase")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        verify(shoppingService, never()).purchaseItem(any());
    }
}
