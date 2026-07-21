package com.santyman.revenant.controllers;

import com.santyman.revenant.dtos.EnemyResponse;
import com.santyman.revenant.dtos.MapResponse;
import com.santyman.revenant.dtos.NpcResponse;
import com.santyman.revenant.exception.ErrorResponse;
import com.santyman.revenant.services.interfaces.WorldService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/world")
@RequiredArgsConstructor
@Tag(name = "World", description = "Endpoints for retrieving world maps")
public class WorldController {

    private final WorldService worldService;

    @GetMapping("/maps")
    @Operation(summary = "Get all maps", description = "Retrieves all available maps for the authenticated player ordered by identifier")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Maps retrieved successfully", content = @Content(array = @ArraySchema(schema = @Schema(implementation = MapResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Unauthorized — valid JWT required", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<MapResponse>> getAllMaps() {
        List<MapResponse> response = worldService.getAllMaps();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/maps/enemies/{id}")
    @Operation(summary = "Get all the enemies", description = "Find all the enemies that are contain in a map specific")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Enemies retrieved successfully", content = @Content(array = @ArraySchema(schema = @Schema(implementation = MapResponse.class)))),
        @ApiResponse(responseCode = "401", description = "Unauthorized — valid JWT required", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<EnemyResponse>> getEnemiesByMap( @PathVariable Long id){
        List<EnemyResponse> response = worldService.getEnemiesByMap(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/maps/npc/{id}")
    @Operation(summary = "Get all the NPCS", description = "Find all the NPC that are contain in a map specific")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Npc retrieved successfully", content = @Content(array = @ArraySchema(schema = @Schema(implementation = MapResponse.class)))),
        @ApiResponse(responseCode = "401", description = "Unauthorized — valid JWT required", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<NpcResponse>> getNpcByMap(@PathVariable Long id){
        List<NpcResponse> response = worldService.getNpcByMap(id);
        return ResponseEntity.ok(response);
    }

}