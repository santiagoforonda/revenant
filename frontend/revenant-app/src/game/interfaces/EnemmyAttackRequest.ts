import type { Enemy } from "../entities/characters/Enemy";
import type { Player } from "../entities/characters/Player";

export interface EnemmyAttackRequest{

    attacker: Enemy;
    target:Player;
    timeStamp:number;
}