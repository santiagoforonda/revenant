package com.santyman.revenant.services;

import com.santyman.revenant.dtos.CombatRewardRequest;
import com.santyman.revenant.dtos.CombatRewardResponse;
import com.santyman.revenant.entities.Boss;
import com.santyman.revenant.entities.Enemy;
import com.santyman.revenant.entities.Player;
import com.santyman.revenant.entities.PlayerBoss;
import com.santyman.revenant.entities.User;
import com.santyman.revenant.repositories.BossRepository;
import com.santyman.revenant.repositories.EnemyRepository;
import com.santyman.revenant.repositories.PlayerBossRepository;
import com.santyman.revenant.repositories.PlayerRepository;
import com.santyman.revenant.services.implementation.CombatServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CombatServiceImplTest {

    @Mock
    private PlayerRepository playerRepository;

    @Mock
    private EnemyRepository enemyRepository;

    @Mock
    private BossRepository bossRepository;

    @Mock
    private PlayerBossRepository playerBossRepository;

    @InjectMocks
    private CombatServiceImpl combatService;

    private User authenticatedUser;
    private Player player;

    @BeforeEach
    void setUp() {
        authenticatedUser = User.builder()
                .id(1L)
                .username("testUser")
                .email("test@example.com")
                .password("password")
                .build();

        player = Player.builder()
                .id(1L)
                .user(authenticatedUser)
                .level(1)
                .experience(0)
                .gold(100)
                .build();

        // Setup security context
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(authenticatedUser);

        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);

        SecurityContextHolder.setContext(securityContext);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("processReward - success: updates player gold and experience, no level up, no boss")
    void processReward_success_noLevelUp_noBoss() {
        CombatRewardRequest request = new CombatRewardRequest(10L);
        Enemy enemy = new Enemy();
        enemy.setId(10L);
        enemy.setGoldReward(50);
        enemy.setExperienceReward(40);

        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.of(player));
        when(enemyRepository.findById(10L)).thenReturn(Optional.of(enemy));
        when(bossRepository.findById(10L)).thenReturn(Optional.empty());

        CombatRewardResponse response = combatService.processReward(request);

        assertThat(response.goldObtained()).isEqualTo(50);
        assertThat(response.experienceObtained()).isEqualTo(40);
        assertThat(response.currentGold()).isEqualTo(150);
        assertThat(response.currentExperience()).isEqualTo(40);
        assertThat(response.currentLevel()).isEqualTo(1);
        assertThat(response.bossDefeated()).isFalse();

        verify(playerRepository).save(player);
    }

    @Test
    @DisplayName("processReward - success: updates experience and causes single level up")
    void processReward_success_singleLevelUp() {
        CombatRewardRequest request = new CombatRewardRequest(10L);
        Enemy enemy = new Enemy();
        enemy.setId(10L);
        enemy.setGoldReward(50);
        enemy.setExperienceReward(110); // Level 1 needs 1 * 100 = 100 XP to level up

        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.of(player));
        when(enemyRepository.findById(10L)).thenReturn(Optional.of(enemy));
        when(bossRepository.findById(10L)).thenReturn(Optional.empty());

        CombatRewardResponse response = combatService.processReward(request);

        assertThat(response.goldObtained()).isEqualTo(50);
        assertThat(response.experienceObtained()).isEqualTo(110);
        assertThat(response.currentGold()).isEqualTo(150);
        assertThat(response.currentExperience()).isEqualTo(110);
        assertThat(response.currentLevel()).isEqualTo(2); // Leveled up to 2
        assertThat(response.bossDefeated()).isFalse();

        verify(playerRepository).save(player);
    }

    @Test
    @DisplayName("processReward - success: updates experience and causes multiple level ups")
    void processReward_success_multipleLevelUps() {
        CombatRewardRequest request = new CombatRewardRequest(10L);
        Enemy enemy = new Enemy();
        enemy.setId(10L);
        enemy.setGoldReward(50);
        enemy.setExperienceReward(350); 
        // Start: level 1, 0 XP
        // Gain 350 XP:
        // Lvl 1 needed: 1 * 100 = 100. 350 >= 100 -> Lvl 2.
        // Lvl 2 needed: 2 * 100 = 200. 350 >= 200 -> Lvl 3.
        // Lvl 3 needed: 3 * 100 = 300. 350 >= 300 -> Lvl 4.
        // Lvl 4 needed: 4 * 100 = 400. 350 < 400 -> Stop. Final level = 4.

        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.of(player));
        when(enemyRepository.findById(10L)).thenReturn(Optional.of(enemy));
        when(bossRepository.findById(10L)).thenReturn(Optional.empty());

        CombatRewardResponse response = combatService.processReward(request);

        assertThat(response.goldObtained()).isEqualTo(50);
        assertThat(response.experienceObtained()).isEqualTo(350);
        assertThat(response.currentGold()).isEqualTo(150);
        assertThat(response.currentExperience()).isEqualTo(350);
        assertThat(response.currentLevel()).isEqualTo(4); // Leveled up to 4
        assertThat(response.bossDefeated()).isFalse();

        verify(playerRepository).save(player);
    }

    @Test
    @DisplayName("processReward - success: registers boss defeat")
    void processReward_success_registersBossDefeat() {
        CombatRewardRequest request = new CombatRewardRequest(20L);
        Enemy enemy = new Enemy();
        enemy.setId(20L);
        enemy.setGoldReward(200);
        enemy.setExperienceReward(150);

        Boss boss = new Boss();
        boss.setId(20L);

        PlayerBoss playerBoss = PlayerBoss.builder()
                .player(player)
                .boss(boss)
                .isDefeat(false)
                .build();

        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.of(player));
        when(enemyRepository.findById(20L)).thenReturn(Optional.of(enemy));
        when(bossRepository.findById(20L)).thenReturn(Optional.of(boss));
        when(playerBossRepository.findByPlayerAndBoss(player, boss)).thenReturn(Optional.of(playerBoss));

        CombatRewardResponse response = combatService.processReward(request);

        assertThat(response.goldObtained()).isEqualTo(200);
        assertThat(response.experienceObtained()).isEqualTo(150);
        assertThat(response.currentGold()).isEqualTo(300);
        assertThat(response.currentExperience()).isEqualTo(150);
        assertThat(response.currentLevel()).isEqualTo(2); // 150 >= 100 -> Lvl 2
        assertThat(response.bossDefeated()).isTrue();
        assertThat(playerBoss.getIsDefeat()).isTrue();

        verify(playerBossRepository).save(playerBoss);
        verify(playerRepository).save(player);
    }

    @Test
    @DisplayName("processReward - success: creates boss defeat progress when missing")
    void processReward_success_createsBossDefeatProgressWhenMissing() {
        CombatRewardRequest request = new CombatRewardRequest(30L);
        Enemy enemy = new Enemy();
        enemy.setId(30L);
        enemy.setGoldReward(75);
        enemy.setExperienceReward(25);

        Boss boss = new Boss();
        boss.setId(30L);

        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.of(player));
        when(enemyRepository.findById(30L)).thenReturn(Optional.of(enemy));
        when(bossRepository.findById(30L)).thenReturn(Optional.of(boss));
        when(playerBossRepository.findByPlayerAndBoss(player, boss)).thenReturn(Optional.empty());

        CombatRewardResponse response = combatService.processReward(request);

        assertThat(response.goldObtained()).isEqualTo(75);
        assertThat(response.experienceObtained()).isEqualTo(25);
        assertThat(response.currentGold()).isEqualTo(175);
        assertThat(response.currentExperience()).isEqualTo(25);
        assertThat(response.currentLevel()).isEqualTo(1);
        assertThat(response.bossDefeated()).isTrue();

        verify(playerBossRepository).save(argThat(playerBoss ->
                playerBoss.getPlayer().equals(player)
                        && playerBoss.getBoss().equals(boss)
                        && Boolean.TRUE.equals(playerBoss.getIsDefeat())));
        verify(playerRepository).save(player);
    }

    @Test
    @DisplayName("processReward - player not found: throws IllegalStateException")
    void processReward_playerNotFound_throwsException() {
        CombatRewardRequest request = new CombatRewardRequest(10L);

        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> combatService.processReward(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("No player profile found for the authenticated user");

        verify(playerRepository, never()).save(any());
    }

    @Test
    @DisplayName("processReward - enemy not found: throws EntityNotFoundException")
    void processReward_enemyNotFound_throwsException() {
        CombatRewardRequest request = new CombatRewardRequest(999L);

        when(playerRepository.findByUser(authenticatedUser)).thenReturn(Optional.of(player));
        when(enemyRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> combatService.processReward(request))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Enemy not found with id: 999");

        verify(playerRepository, never()).save(any());
    }
}
