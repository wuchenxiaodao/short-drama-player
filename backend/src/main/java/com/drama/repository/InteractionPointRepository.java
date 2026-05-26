package com.drama.repository;

import com.drama.model.InteractionPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InteractionPointRepository extends JpaRepository<InteractionPoint, Long> {
    List<InteractionPoint> findByEpisodeIdOrderByTimestampMsAsc(Long episodeId);
}
