package com.santyman.revenant.mappers;

import org.springframework.stereotype.Component;

import com.santyman.revenant.dtos.EnemyResponse;
import com.santyman.revenant.entities.Enemy;

@Component
public class EnemyMapper {
    

    public EnemyResponse toResponse(Enemy enemy){

        return new EnemyResponse(enemy.getId(), 
            enemy.getMap().getId(),
            enemy.getHealthPoints(),
            enemy.getDamagePoints(), 
            enemy.getArmorPoints(), 
            enemy.getGoldReward(), 
            enemy.getExperienceReward(), 
            enemy.getSpeedAttackPoints(), 
            enemy.getName(), 
            enemy.getDescription());
    }
}
