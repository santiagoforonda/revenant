package com.santyman.revenant.controllers;

import com.santyman.revenant.dtos.CombatRewardRequest;
import com.santyman.revenant.dtos.CombatRewardResponse;
import com.santyman.revenant.exception.ErrorResponse;
import com.santyman.revenant.services.interfaces.CombatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/combat")
@RequiredArgsConstructor
@Tag(name = "Combat", description = "Endpoints for processing combat rewards")
public class CombatController {

    private final CombatService combatService;

    @PostMapping("/reward")
    @Operation(summary = "Process combat reward", description = "Processes the rewards obtained after an authenticated player defeats an enemy")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Reward processed successfully", content = @Content(schema = @Schema(implementation = CombatRewardResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized — valid JWT required", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Enemy not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<CombatRewardResponse> processReward(@Valid @RequestBody CombatRewardRequest request) {
        CombatRewardResponse response = combatService.processReward(request);
        return ResponseEntity.ok(response);
    }
}
