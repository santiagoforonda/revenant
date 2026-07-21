package com.santyman.revenant.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.santyman.revenant.dtos.LoginRequest;
import com.santyman.revenant.dtos.LoginResponse;
import com.santyman.revenant.dtos.RegisterRequest;
import com.santyman.revenant.dtos.RegisterResponse;
import com.santyman.revenant.entities.PlayerType;
import com.santyman.revenant.exception.EmailAlreadyRegisteredException;
import com.santyman.revenant.exception.GlobalExceptionHandler;
import com.santyman.revenant.exception.UsernameAlreadyExistsException;
import com.santyman.revenant.security.JwtAuthenticationFilter;
import com.santyman.revenant.security.JwtUtil;
import com.santyman.revenant.services.implementation.UserDetailsServiceImpl;
import com.santyman.revenant.services.interfaces.AuthenticationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;

import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.santyman.revenant.config.SecurityConfig;
import org.junit.jupiter.api.BeforeEach;



import static org.mockito.Mockito.doAnswer;


@WebMvcTest(AuthenticationController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
class AuthenticationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private AuthenticationService authenticationService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsServiceImpl;

    @BeforeEach
    void setUp() throws Exception {
        doAnswer(invocation -> {
            jakarta.servlet.FilterChain chain = invocation.getArgument(2);
            chain.doFilter(invocation.getArgument(0), invocation.getArgument(1));
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());
    }

    // -------------------------------------------------------------------------
    // Registration tests
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("POST /api/auth/register - successful registration returns 201")
    void register_validRequest_returns201() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "heroPlayer", "hero@example.com", "password123", PlayerType.CABALLERO
        );
        RegisterResponse response = new RegisterResponse(1L, "heroPlayer", "hero@example.com");

        when(authenticationService.register(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").value(1L))
                .andExpect(jsonPath("$.username").value("heroPlayer"))
                .andExpect(jsonPath("$.email").value("hero@example.com"));
    }

    @Test
    @DisplayName("POST /api/auth/register - duplicate username returns 409")
    void register_duplicateUsername_returns409() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "existingUser", "new@example.com", "password123", PlayerType.MAGO
        );

        when(authenticationService.register(any(RegisterRequest.class)))
                .thenThrow(new UsernameAlreadyExistsException("existingUser"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Username already in use: existingUser"));
    }

    @Test
    @DisplayName("POST /api/auth/register - duplicate email returns 409")
    void register_duplicateEmail_returns409() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "newUser", "taken@example.com", "password123", PlayerType.ARQUERO
        );

        when(authenticationService.register(any(RegisterRequest.class)))
                .thenThrow(new EmailAlreadyRegisteredException("taken@example.com"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Email address already registered: taken@example.com"));
    }

    @Test
    @DisplayName("POST /api/auth/register - invalid input returns 400")
    void register_invalidInput_returns400() throws Exception {
        RegisterRequest request = new RegisterRequest("", "not-an-email", "short", null);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    // -------------------------------------------------------------------------
    // Login tests
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("POST /api/auth/login - valid credentials return 200 with full player data")
    void login_validCredentials_returns200() throws Exception {
        LoginRequest request = new LoginRequest("heroPlayer", "password123");
        LoginResponse response = new LoginResponse(
                "sample.jwt.token",
                "Bearer",
                "heroPlayer",
                1L,
                0,
                0,
                110,
                15,
                12,
                100,
                1,
                0,
                PlayerType.CABALLERO,
                List.of()
        );

        when(authenticationService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("sample.jwt.token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.username").value("heroPlayer"))
                .andExpect(jsonPath("$.mapId").value(1L))
                .andExpect(jsonPath("$.posX").value(0))
                .andExpect(jsonPath("$.posY").value(0))
                .andExpect(jsonPath("$.healthPoints").value(110))
                .andExpect(jsonPath("$.strongPoints").value(15))
                .andExpect(jsonPath("$.speedAttackPoints").value(12))
                .andExpect(jsonPath("$.gold").value(100))
                .andExpect(jsonPath("$.level").value(1))
                .andExpect(jsonPath("$.experience").value(0))
                .andExpect(jsonPath("$.typePlayer").value("CABALLERO"))
                .andExpect(jsonPath("$.inventory").isArray());
    }

    @Test
    @DisplayName("POST /api/auth/login - invalid credentials return 401")
    void login_invalidCredentials_returns401() throws Exception {
        LoginRequest request = new LoginRequest("heroPlayer", "wrongpassword");

        when(authenticationService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("POST /api/auth/login - missing fields return 400")
    void login_missingFields_returns400() throws Exception {
        LoginRequest request = new LoginRequest("", "");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }
}
