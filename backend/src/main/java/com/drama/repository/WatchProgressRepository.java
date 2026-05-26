package com.drama.repository;

import com.drama.model.WatchProgress;
import com.drama.model.WatchProgressId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface WatchProgressRepository extends JpaRepository<WatchProgress, WatchProgressId> {
    Optional<WatchProgress> findByUserIdAndEpisodeId(Long userId, Long episodeId);
}
