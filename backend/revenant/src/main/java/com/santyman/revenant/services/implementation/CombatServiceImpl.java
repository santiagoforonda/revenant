package com.santyman.revenant.services.implementation;

import com.santyman.revenant.dtos.CombatRewardRequest;
import com.santyman.revenant.dtos.CombatRewardResponse;
import com.santyman.revenant.entities.Enemy;
import com.santyman.revenant.entities.Player;
import com.santyman.revenant.entities.PlayerBoss;
import com.santyman.revenant.entities.User;
import com.santyman.revenant.repositories.BossRepository;
import com.santyman.revenant.repositories.EnemyRepository;
import com.santyman.revenant.repositories.PlayerBossRepository;
import com.santyman.revenant.repositories.PlayerRepository;
import com.santyman.revenant.services.interfaces.CombatService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CombatServiceImpl implements CombatService {

    private final PlayerRepository playerRepository;
    private final EnemyRepository enemyRepository;
    private final BossRepository bossRepository;
    private final PlayerBossRepository playerBossRepository;

    @Override
    @Transactional
    public CombatRewardResponse processReward(CombatRewardRequest request) {
        User authenticatedUser = (User) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        Player player = playerRepository.findByUser(authenticatedUser)
                .orElseThrow(() -> new IllegalStateException("No player profile found for the authenticated user"));

        // Task 4: Retrieve enemy and extract rewards
        Enemy enemy = enemyRepository.findById(request.enemyId())
                .orElseThrow(() -> new EntityNotFoundException("Enemy not found with id: " + request.enemyId()));

        int goldObtained = enemy.getGoldReward();
        int experienceObtained = enemy.getExperienceReward();

        player.setGold(player.getGold() + goldObtained);
        player.setExperience(player.getExperience() + experienceObtained);
        calculateLevelProgression(player);

        boolean bossDefeated = registerBossDefeatIfApplicable(player, request.enemyId());

        playerRepository.save(player);

        return new CombatRewardResponse(
                goldObtained,
                experienceObtained,
                player.getGold(),
                player.getExperience(),
                player.getLevel(),
                bossDefeated
        );
    }

    private boolean registerBossDefeatIfApplicable(Player player, Long enemyId) {
        return bossRepository.findById(enemyId).map(boss -> {
            PlayerBoss playerBoss = playerBossRepository.findByPlayerAndBoss(player, boss)
                    .orElseGet(() -> PlayerBoss.builder()
                            .player(player)
                            .boss(boss)
                            .isDefeat(false)
                            .build());

            playerBoss.setIsDefeat(true);
            playerBossRepository.save(playerBoss);
            return true;
        }).orElse(false);
    }

    private void calculateLevelProgression(Player player) {
        while (player.getExperience() >= player.getLevel() * 100) {
            player.setLevel(player.getLevel() + 1);
        }
    }
}
