package com.santyman.revenant.services.interfaces;

import com.santyman.revenant.dtos.CombatRewardRequest;
import com.santyman.revenant.dtos.CombatRewardResponse;

public interface CombatService {

    CombatRewardResponse processReward(CombatRewardRequest request);
}
