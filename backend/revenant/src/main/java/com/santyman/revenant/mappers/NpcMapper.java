package com.santyman.revenant.mappers;

import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Component;

import com.santyman.revenant.dtos.NpcResponse;
import com.santyman.revenant.entities.Npc;

@Component
public class NpcMapper {
    

    public NpcResponse toResponse(Npc npc){

        List<String> phrases = Arrays.asList(npc.getPhrases());
        return new NpcResponse(npc.getId(), 
            npc.getMap().getId(), 
            npc.getName(), 
            npc.getDescription(),
            phrases
            );
    }

}
