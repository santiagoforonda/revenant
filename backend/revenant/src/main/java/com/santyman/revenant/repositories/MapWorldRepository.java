package com.santyman.revenant.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.santyman.revenant.entities.MapWorld;

import java.util.List;

public interface MapWorldRepository extends JpaRepository<MapWorld,Long> {

	List<MapWorld> findAllByOrderByIdAsc();

}
