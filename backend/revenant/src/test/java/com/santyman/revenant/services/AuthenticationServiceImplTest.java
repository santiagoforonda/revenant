package com.santyman.revenant.services;

import com.santyman.revenant.dtos.LoginRequest;
import com.santyman.revenant.dtos.LoginResponse;
import com.santyman.revenant.dtos.RegisterRequest;
import com.santyman.revenant.dtos.RegisterResponse;
import com.santyman.revenant.entities.MapWorld;
import com.santyman.revenant.entities.Player;
import com.santyman.revenant.entities.PlayerType;
import com.santyman.revenant.entities.User;
import com.santyman.revenant.exception.EmailAlreadyRegisteredException;
import com.santyman.revenant.exception.UsernameAlreadyExistsException;
import com.santyman.revenant.repositories.InventoryRepository;
import com.santyman.revenant.repositories.PlayerRepository;
import com.santyman.revenant.repositories.UserRepository;
import com.santyman.revenant.security.JwtUtil;
import com.santyman.revenant.services.implementation.AuthenticationServiceImpl;
import com.santyman.revenant.services.interfaces.PlayerService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private PlayerRepository playerRepository;
    @Mock private InventoryRepository inventoryRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtUtil jwtUtil;
    @Mock private PlayerService playerService;

    @InjectMocks
    private AuthenticationServiceImpl authenticationService;

    // -------------------------------------------------------------------------
    // register
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("register - valid request creates user and player profile")
    void register_validRequest_createsUserAndPlayerProfile() {
        RegisterRequest request = new RegisterRequest(
                "heroPlayer", "hero@example.com", "password123", PlayerType.CABALLERO
        );
        User savedUser = User.builder()
                .id(1L).username("heroPlayer").email("hero@example.com").password("hashed").build();

        when(userRepository.existsByUsername("heroPlayer")).thenReturn(false);
        when(userRepository.existsByEmail("hero@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        RegisterResponse response = authenticationService.register(request);

        assertThat(response.userId()).isEqualTo(1L);
        assertThat(response.username()).isEqualTo("heroPlayer");
        assertThat(response.email()).isEqualTo("hero@example.com");
        verify(playerService).createInitialPlayer(savedUser, PlayerType.CABALLERO);
    }

    @Test
    @DisplayName("register - duplicate username throws UsernameAlreadyExistsException")
    void register_duplicateUsername_throwsException() {
        RegisterRequest request = new RegisterRequest(
                "taken", "new@example.com", "password123", PlayerType.ARQUERO
        );
        when(userRepository.existsByUsername("taken")).thenReturn(true);

        assertThatThrownBy(() -> authenticationService.register(request))
                .isInstanceOf(UsernameAlreadyExistsException.class)
                .hasMessageContaining("taken");

        verify(userRepository, never()).save(any());
        verify(playerService, never()).createInitialPlayer(any(), any());
    }

    @Test
    @DisplayName("register - duplicate email throws EmailAlreadyRegisteredException")
    void register_duplicateEmail_throwsException() {
        RegisterRequest request = new RegisterRequest(
                "newUser", "taken@example.com", "password123", PlayerType.MAGO
        );
        when(userRepository.existsByUsername("newUser")).thenReturn(false);
        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authenticationService.register(request))
                .isInstanceOf(EmailAlreadyRegisteredException.class)
                .hasMessageContaining("taken@example.com");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("register - password is stored as hash, never plaintext")
    void register_passwordIsHashed() {
        RegisterRequest request = new RegisterRequest(
                "heroPlayer", "hero@example.com", "plaintext", PlayerType.CABALLERO
        );
        User savedUser = User.builder()
                .id(1L).username("heroPlayer").email("hero@example.com").password("$2a$hashed").build();

        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode("plaintext")).thenReturn("$2a$hashed");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        authenticationService.register(request);

        verify(passwordEncoder).encode("plaintext");
        verify(userRepository).save(argThat(u -> u.getPassword().equals("$2a$hashed")));
    }

    // -------------------------------------------------------------------------
    // login
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("login - valid credentials return JWT with full player data")
    void login_validCredentials_returnsFullPlayerData() {
        LoginRequest request = new LoginRequest("heroPlayer", "password123");

        User user = User.builder()
                .id(1L).username("heroPlayer").email("hero@example.com").password("hashed").build();

        MapWorld map = MapWorld.builder().id(1L).name("Zona Inicial").description("La zona de inicio").build();

        Player player = Player.builder()
                .id(1L)
                .user(user)
                .typePlayer(PlayerType.CABALLERO)
                .level(1)
                .experience(0)
                .healthPoints(110)
                .strongPoints(15)
                .speedAttackPoints(12)
                .gold(100)
                .map(map)
                .posX(0)
                .posY(0)
                .build();

        when(userRepository.findByUsername("heroPlayer")).thenReturn(Optional.of(user));
        when(jwtUtil.generateToken(user)).thenReturn("jwt.token.here");
        when(playerRepository.findByUser(user)).thenReturn(Optional.of(player));
        when(inventoryRepository.findByPlayerWithItem(player)).thenReturn(List.of());

        LoginResponse response = authenticationService.login(request);

        assertThat(response.token()).isEqualTo("jwt.token.here");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.username()).isEqualTo("heroPlayer");
        assertThat(response.mapId()).isEqualTo(1L);
        assertThat(response.posX()).isEqualTo(0);
        assertThat(response.posY()).isEqualTo(0);
        assertThat(response.healthPoints()).isEqualTo(110);
        assertThat(response.strongPoints()).isEqualTo(15);
        assertThat(response.speedAttackPoints()).isEqualTo(12);
        assertThat(response.gold()).isEqualTo(100);
        assertThat(response.level()).isEqualTo(1);
        assertThat(response.experience()).isEqualTo(0);
        assertThat(response.typePlayer()).isEqualTo(PlayerType.CABALLERO);
        assertThat(response.inventory()).isEmpty();
    }

    @Test
    @DisplayName("login - invalid credentials throw BadCredentialsException")
    void login_invalidCredentials_throwsException() {
        LoginRequest request = new LoginRequest("heroPlayer", "wrong");

        doThrow(new BadCredentialsException("Bad credentials"))
                .when(authenticationManager)
                .authenticate(any(UsernamePasswordAuthenticationToken.class));

        assertThatThrownBy(() -> authenticationService.login(request))
                .isInstanceOf(BadCredentialsException.class);
    }
}
