package com.drama.repository;

import com.drama.model.InteractionStatsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InteractionStatsRepository extends JpaRepository<InteractionStatsEntity, Long> {
    Optional<InteractionStatsEntity> findByInteractionIdAndOptionId(Long interactionId, Long optionId);
    
    List<InteractionStatsEntity> findByInteractionId(Long interactionId);

    @Modifying
    @Query("UPDATE InteractionStatsEntity s SET s.count = s.count + 1 WHERE s.interactionId = :interactionId AND s.optionId = :optionId")
    int incrementCount(@Param("interactionId") Long interactionId, @Param("optionId") Long optionId);

    @Query("SELECT s.optionId, s.count FROM InteractionStatsEntity s WHERE s.interactionId = :interactionId")
    List<Object[]> findCountsByInteractionId(@Param("interactionId") Long interactionId);

    @Query("SELECT COALESCE(SUM(s.count), 0) FROM InteractionStatsEntity s WHERE s.interactionId = :interactionId")
    Long sumCountsByInteractionId(@Param("interactionId") Long interactionId);
}