package com.santyman.revenant.controllers;

import com.santyman.revenant.dtos.AddInventoryItemRequest;
import com.santyman.revenant.dtos.InventoryItemResponse;
import com.santyman.revenant.dtos.UpdateInventoryRequest;
import com.santyman.revenant.exception.ErrorResponse;
import com.santyman.revenant.services.interfaces.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory", description = "Endpoints for managing player inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    @PostMapping
    @Operation(summary = "Add item to inventory", description = "Adds an item to the authenticated player's inventory, increasing the quantity if it already exists")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Item added successfully", content = @Content(schema = @Schema(implementation = InventoryItemResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input or negative quantity", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized — valid JWT required", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Item not found in catalog", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<InventoryItemResponse> addInventoryItem(@Valid @RequestBody AddInventoryItemRequest request) {
        InventoryItemResponse response = inventoryService.addInventoryItem(request);
        return ResponseEntity.ok(response);
    }

    @PutMapping
    @Operation(summary = "Update item quantity", description = "Modifies the quantity of an existing item in the authenticated player's inventory")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Quantity updated successfully", content = @Content(schema = @Schema(implementation = InventoryItemResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input or negative quantity", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized — valid JWT required", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Item or inventory record not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<InventoryItemResponse> updateInventoryItemQuantity(@Valid @RequestBody UpdateInventoryRequest request) {
        InventoryItemResponse response = inventoryService.updateInventoryItemQuantity(request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{itemId}")
    @Operation(summary = "Remove item from inventory", description = "Deletes the corresponding inventory record of the item for the authenticated player")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Item removed successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized — valid JWT required", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Item or inventory record not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Void> removeInventoryItem(@PathVariable Long itemId) {
        inventoryService.removeInventoryItem(itemId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @Operation(summary = "Get player inventory", description = "Retrieves all inventory items belonging to the authenticated player")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Inventory retrieved successfully", content = @Content(array = @ArraySchema(schema = @Schema(implementation = InventoryItemResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Unauthorized — valid JWT required", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<InventoryItemResponse>> getPlayerInventory() {
        List<InventoryItemResponse> response = inventoryService.getPlayerInventory();
        return ResponseEntity.ok(response);
    }
}
