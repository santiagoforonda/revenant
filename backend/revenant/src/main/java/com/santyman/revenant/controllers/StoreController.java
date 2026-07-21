package com.santyman.revenant.controllers;

import com.santyman.revenant.dtos.StoreItemResponse;
import com.santyman.revenant.dtos.StoreResponse;
import com.santyman.revenant.exception.ErrorResponse;
import com.santyman.revenant.services.interfaces.StoreService;
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
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Store", description = "Endpoints for retrieving stores and store items")
public class StoreController {

    private final StoreService storeService;

    @GetMapping("/maps/{mapId}/stores")
    @Operation(summary = "Get stores by map", description = "Retrieves all stores available on the specified map for the authenticated player")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Stores retrieved successfully", content = @Content(array = @ArraySchema(schema = @Schema(implementation = StoreResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Unauthorized — valid JWT required", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<StoreResponse>> getStoresByMap(@PathVariable Long mapId) {
        List<StoreResponse> response = storeService.getStoresByMap(mapId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stores/{storeId}/items")
    @Operation(summary = "Get items by store", description = "Retrieves all items sold by the specified store for the authenticated player")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Store items retrieved successfully", content = @Content(array = @ArraySchema(schema = @Schema(implementation = StoreItemResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Unauthorized — valid JWT required", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Store not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<StoreItemResponse>> getItemsByStore(@PathVariable Long storeId) {
        List<StoreItemResponse> response = storeService.getItemsByStore(storeId);
        return ResponseEntity.ok(response);
    }
}