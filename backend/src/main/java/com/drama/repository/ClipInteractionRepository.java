package com.drama.repository;

import com.drama.model.ClipInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClipInteractionRepository extends JpaRepository<ClipInteraction, Long> {
    long countByClipIdAndAction(Long clipId, String action);
}
