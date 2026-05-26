package com.drama.repository;

import com.drama.model.Episode;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EpisodeRepository extends JpaRepository<Episode, Long> {
    List<Episode> findByDramaIdOrderByEpisodeNumberAsc(Long dramaId);

    Optional<Episode> findByDramaIdAndEpisodeNumber(Long dramaId, Integer episodeNumber);
}
