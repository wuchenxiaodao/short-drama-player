package com.drama.repository;

import com.drama.model.GeneratedStory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GeneratedStoryRepository extends JpaRepository<GeneratedStory, Long> {
    List<GeneratedStory> findByUser_IdOrderByCreatedAtDesc(Long userId);
    List<GeneratedStory> findByEpisode_IdOrderByCreatedAtDesc(Long episodeId);
}
