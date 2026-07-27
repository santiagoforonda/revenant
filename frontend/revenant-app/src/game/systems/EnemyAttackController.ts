import type { Enemy } from "../entities/characters/Enemy";
import type { ChaseEvent } from "./ChaseController";
import Phaser from "phaser";
import { EnemyAttackRequestService } from "@/game/services/EnemyAttackRequestService";
import type { Player } from "@/game/entities/characters/Player";




export type AttackState ="Inactive" | "Attacking" |"Cooldown";

export class EnemyAttackController{
    
    private readonly enemy:Enemy;
    private readonly player:Player;
    private readonly attackRequestService: EnemyAttackRequestService;
    private attackState:AttackState ="Inactive";
    private cooldownRemaining:number;

    constructor(enemy:Enemy,player:Player){
        this.enemy=enemy;
        this.player=player;
        this.cooldownRemaining=0;

        this.attackRequestService = new EnemyAttackRequestService();

        this.enemy.getSprite().on(
            Phaser.Animations.Events.ANIMATION_COMPLETE,
            this.handleAnimationComplete,
            this
        )
    }

    private handleAnimationComplete(animation:Phaser.Animations.Animation):void{
        const expectedKey =`${this.enemy.getEnemyType()}-attack-${this.enemy.getDirection()}`;

        if (animation.key !== expectedKey) {
            return;
        }

        this.cooldownRemaining = this.calculateCoodown();
        this.attackState = "Cooldown";
        this.attackRequestService.forward({
        attacker: this.enemy,
        target: this.player,
        timeStamp: Date.now()
    });

        this.enemy.setState("idle");
    }

    handleChaseEvent(event:ChaseEvent){
        if(event === "AttackRangeReached"){
            this.attackState="Attacking";
        }

        if(event==="AttackRangeLost"){
            this.attackState="Inactive";
        }
    }

    private calculateCoodown():number{
        return 1500;
    }

    update(delta:number):void{

        if(this.enemy.isDead()){
            this.attackState="Inactive";
            return;
        }

        if(this.attackState === "Inactive"){
            return;
        }

        if(this.attackState === "Attacking"){

            this.enemy.setState("attacking");
            return;
        }

        if(this.attackState === "Cooldown"){

            this.cooldownRemaining -=delta;
            
            if(this.cooldownRemaining<=0){
                this.attackState="Attacking"
            }
            return;
        }
    }

    
}