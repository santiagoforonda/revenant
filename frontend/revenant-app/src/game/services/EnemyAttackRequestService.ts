import { eventBus } from "@/game/events";
import type { EnemmyAttackRequest } from "../interfaces/EnemmyAttackRequest";



export class EnemyAttackRequestService{
    forward(request:EnemmyAttackRequest):void{
        eventBus.emit("ENEMY_ATTACK_REQUEST",request);
    }
}