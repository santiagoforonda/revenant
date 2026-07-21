package com.santyman.revenant.services.implementation;

import com.santyman.revenant.dtos.InventoryItemResponse;
import com.santyman.revenant.dtos.LoginRequest;
import com.santyman.revenant.dtos.LoginResponse;
import com.santyman.revenant.dtos.RegisterRequest;
import com.santyman.revenant.dtos.RegisterResponse;
import com.santyman.revenant.entities.Inventory;
import com.santyman.revenant.entities.Player;
import com.santyman.revenant.entities.User;
import com.santyman.revenant.exception.EmailAlreadyRegisteredException;
import com.santyman.revenant.exception.UsernameAlreadyExistsException;
import com.santyman.revenant.repositories.InventoryRepository;
import com.santyman.revenant.repositories.PlayerRepository;
import com.santyman.revenant.repositories.UserRepository;
import com.santyman.revenant.security.JwtUtil;
import com.santyman.revenant.services.interfaces.AuthenticationService;
import com.santyman.revenant.services.interfaces.PlayerService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthenticationServiceImpl implements AuthenticationService {

    private final UserRepository userRepository;
    private final PlayerRepository playerRepository;
    private final InventoryRepository inventoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final PlayerService playerService;

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new UsernameAlreadyExistsException(request.username());
        }

        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyRegisteredException(request.email());
        }

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .build();

        User savedUser = userRepository.save(user);

        playerService.createInitialPlayer(savedUser, request.playerType());

        return new RegisterResponse(savedUser.getId(), savedUser.getUsername(), savedUser.getEmail());
    }

    @Override
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        User user = userRepository.findByUsername(request.username()).orElseThrow();
        UserDetails userDetails = user;

        String token = jwtUtil.generateToken(userDetails);

        Player player = playerRepository.findByUser(user).orElseThrow();

        List<InventoryItemResponse> inventory = inventoryRepository
                .findByPlayerWithItem(player)
                .stream()
                .map(this::toInventoryItemResponse)
                .toList();

        return new LoginResponse(
                token,
                "Bearer",
                user.getUsername(),
                player.getMap().getId(),
                player.getPosX(),
                player.getPosY(),
                player.getHealthPoints(),
                player.getStrongPoints(),
                player.getSpeedAttackPoints(),
                player.getGold(),
                player.getLevel(),
                player.getExperience(),
                player.getTypePlayer(),
                inventory
        );
    }

    private InventoryItemResponse toInventoryItemResponse(Inventory inv) {
        return new InventoryItemResponse(
                inv.getItem().getId(),
                inv.getItem().getName(),
                inv.getItem().getDescription(),
                inv.getItem().getItemType(),
                inv.getItem().getPrice(),
                inv.getItem().getSellPrice(),
                inv.getItem().getIsSpecial(),
                inv.getQuantity(),
                inv.getEquipped(),
                inv.getEquippedSlot()
        );
    }
}
