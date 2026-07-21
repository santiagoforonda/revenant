package com.santyman.revenant.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.santyman.revenant.config.SecurityConfig;
import com.santyman.revenant.dtos.CombatRewardRequest;
import com.santyman.revenant.dtos.CombatRewardResponse;
import com.santyman.revenant.entities.User;
import com.santyman.revenant.exception.GlobalExceptionHandler;
import com.santyman.revenant.security.JwtAuthenticationFilter;
import com.santyman.revenant.security.JwtUtil;
import com.santyman.revenant.services.implementation.UserDetailsServiceImpl;
import com.santyman.revenant.services.interfaces.CombatService;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CombatController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
class CombatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private CombatService combatService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsServiceImpl;

    private User authenticatedUser;

    @BeforeEach
    void setUp() {
        authenticatedUser = User.builder()
                .id(1L)
                .username("testUser")
                .build();
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
    @DisplayName("POST /api/combat/reward - success: returns 200 with rewards")
    void processReward_success_returns200() throws Exception {
        mockAuthentication();

        CombatRewardRequest request = new CombatRewardRequest(10L);
        CombatRewardResponse response = new CombatRewardResponse(50, 40, 150, 40, 1, false);

        when(combatService.processReward(request)).thenReturn(response);

        mockMvc.perform(post("/api/combat/reward")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.goldObtained").value(50))
                .andExpect(jsonPath("$.experienceObtained").value(40))
                .andExpect(jsonPath("$.currentGold").value(150))
                .andExpect(jsonPath("$.currentExperience").value(40))
                .andExpect(jsonPath("$.currentLevel").value(1))
                .andExpect(jsonPath("$.bossDefeated").value(false));

        verify(combatService).processReward(request);
    }

    @Test
    @DisplayName("POST /api/combat/reward - invalid input: returns 400 Bad Request")
    void processReward_invalidInput_returns400() throws Exception {
        mockAuthentication();

        CombatRewardRequest request = new CombatRewardRequest(-5L); // negative ID is invalid

        mockMvc.perform(post("/api/combat/reward")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("must be a positive number")));

        verify(combatService, never()).processReward(any());
    }

    @Test
    @DisplayName("POST /api/combat/reward - enemy not found: returns 404 Not Found")
    void processReward_enemyNotFound_returns404() throws Exception {
        mockAuthentication();

        CombatRewardRequest request = new CombatRewardRequest(999L);

        when(combatService.processReward(request))
                .thenThrow(new EntityNotFoundException("Enemy not found with id: 999"));

        mockMvc.perform(post("/api/combat/reward")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Enemy not found with id: 999"));

        verify(combatService).processReward(request);
    }

    @Test
    @DisplayName("POST /api/combat/reward - unauthorized: returns 403 Forbidden")
    void processReward_unauthorized_returns403() throws Exception {
        mockAnonymous();

        CombatRewardRequest request = new CombatRewardRequest(10L);

        // Security filter chain should block the request before reaching the controller
        mockMvc.perform(post("/api/combat/reward")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        verify(combatService, never()).processReward(any());
    }
}
