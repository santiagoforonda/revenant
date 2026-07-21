package com.santyman.revenant.services.interfaces;

import com.santyman.revenant.dtos.SaveGameRequest;
import com.santyman.revenant.entities.PlayerType;
import com.santyman.revenant.entities.User;

public interface PlayerService {

    void createInitialPlayer(User user, PlayerType playerType);

    String saveGame(SaveGameRequest request);
}
