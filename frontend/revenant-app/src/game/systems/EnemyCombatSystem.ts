
import { eventBus } from "@/game/events";
import type { EnemmyAttackRequest } from "../interfaces/EnemmyAttackRequest";
import { DamageCalculator } from "@/game/services/DamageCalculator";

export class EnemyCombatSystem{

    private readonly damageCalculator = new DamageCalculator();

    private readonly handleAttackRequest = (
        request: EnemmyAttackRequest
    ): void => {
        this.resolveAttack(request);
    };

    start(): void {
        eventBus.on(
            "ENEMY_ATTACK_REQUEST",
            this.handleAttackRequest
        );
    }

    stop(): void {
        eventBus.off(
            "ENEMY_ATTACK_REQUEST",
            this.handleAttackRequest
        );
    }

    private resolveAttack(request: EnemmyAttackRequest): void {
        const enemyStats = request.attacker.getStats();
        const playerStats = request.target.getStats();
        const damage = this.damageCalculator.calculateDamageToPlayer(enemyStats.damagePoints,playerStats.healthPoints);
        request.target.getStats().healthPoints = damage.health;

        eventBus.emit("PLAYER_STATS_UPDATED",{healthPoints:request.target.getStats().healthPoints})

        if(request.target.getStats().healthPoints<=0){
            eventBus.emit("LOGOUT_REQUESTED");
        }
        
    }
}