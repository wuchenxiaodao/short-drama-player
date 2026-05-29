package com.drama.repository;

import com.drama.model.InteractionPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InteractionPointRepository extends JpaRepository<InteractionPoint, Long> {
    List<InteractionPoint> findByEpisodeIdOrderByTimestampMsAsc(Long episodeId);

    @Query("SELECT ip FROM InteractionPoint ip LEFT JOIN FETCH ip.options WHERE ip.episode.id = :episodeId ORDER BY ip.timestampMs ASC")
    List<InteractionPoint> findWithOptionsByEpisodeId(@Param("episodeId") Long episodeId);
}
