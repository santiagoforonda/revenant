package com.santyman.revenant.controllers;

import com.santyman.revenant.dtos.LoginRequest;
import com.santyman.revenant.dtos.LoginResponse;
import com.santyman.revenant.dtos.RegisterRequest;
import com.santyman.revenant.dtos.RegisterResponse;
import com.santyman.revenant.exception.ErrorResponse;
import com.santyman.revenant.services.interfaces.AuthenticationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for user registration and authentication")
public class AuthenticationController {

        private final AuthenticationService authenticationService;

        @PostMapping("/register")
        @Operation(summary = "Register a new user", description = "Creates a new user account and initializes the associated player profile")
        @ApiResponses({
                        @ApiResponse(responseCode = "201", description = "User registered successfully", content = @Content(schema = @Schema(implementation = RegisterResponse.class))),
                        @ApiResponse(responseCode = "400", description = "Invalid input data", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                        @ApiResponse(responseCode = "409", description = "Username or email already in use", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
        })
        public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
                RegisterResponse response = authenticationService.register(request);
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }

        @PostMapping("/login")
        @Operation(summary = "Authenticate a user", description = "Validates credentials and returns a JWT for accessing protected resources")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Authentication successful", content = @Content(schema = @Schema(implementation = LoginResponse.class))),
                        @ApiResponse(responseCode = "400", description = "Invalid input data", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                        @ApiResponse(responseCode = "401", description = "Invalid credentials", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
        })
        public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
                LoginResponse response = authenticationService.login(request);
                return ResponseEntity.ok(response);
        }
}
