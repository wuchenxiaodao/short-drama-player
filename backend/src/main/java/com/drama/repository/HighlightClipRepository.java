package com.drama.repository;

import com.drama.model.HighlightClip;
import com.drama.enums.ClipTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HighlightClipRepository extends JpaRepository<HighlightClip, Long> {
    List<HighlightClip> findByDramaIdOrderByHeatScoreDesc(Long dramaId);
    List<HighlightClip> findByTagOrderByHeatScoreDesc(ClipTag tag);
    boolean existsByDramaId(Long dramaId);
}
