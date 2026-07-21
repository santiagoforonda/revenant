package com.santyman.revenant.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.santyman.revenant.dtos.SaveGameRequest;
import com.santyman.revenant.exception.ErrorResponse;
import com.santyman.revenant.services.interfaces.PlayerService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/player")
@RequiredArgsConstructor
@Tag(name = "Save game", description = "Endpoints to save the way of the player")
public class PlayerController {
    

    private final PlayerService playerService;

    @PutMapping("/save")
    @Operation(summary = "Save a game", description = "Save the game for a player")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Game save successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input data", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ResponseEntity<String> save( @Valid @RequestBody SaveGameRequest request){
        String message = playerService.saveGame(request);
        return ResponseEntity.ok(message);
    }
}
