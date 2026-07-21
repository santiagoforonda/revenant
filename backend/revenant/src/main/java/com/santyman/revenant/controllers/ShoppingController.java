package com.santyman.revenant.controllers;

import com.santyman.revenant.dtos.PurchaseItemRequest;
import com.santyman.revenant.dtos.PurchaseItemResponse;
import com.santyman.revenant.exception.ErrorResponse;
import com.santyman.revenant.services.interfaces.ShoppingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shop")
@RequiredArgsConstructor
@Tag(name = "Shopping", description = "Endpoints for purchasing store items")
public class ShoppingController {

    private final ShoppingService shoppingService;

    @PostMapping("/purchase")
    @Operation(summary = "Purchase item from store", description = "Processes the purchase of a store item for the authenticated player, updating player gold, store stock, and player inventory")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Item purchased successfully", content = @Content(schema = @Schema(implementation = PurchaseItemResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input, insufficient gold, or item out of stock", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized — valid JWT required", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Store item not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<PurchaseItemResponse> purchaseItem(@Valid @RequestBody PurchaseItemRequest request) {
        PurchaseItemResponse response = shoppingService.purchaseItem(request);
        return ResponseEntity.ok(response);
    }
}
