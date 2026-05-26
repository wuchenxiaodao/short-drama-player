package com.drama.repository;

import com.drama.model.InteractionAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface InteractionAnswerRepository extends JpaRepository<InteractionAnswer, Long> {
    Optional<InteractionAnswer> findByUserIdAndInteractionPointId(Long userId, Long interactionId);

    @Query("SELECT a.selectedOptionId, COUNT(a) FROM InteractionAnswer a WHERE a.interactionPoint.id = :interactionId GROUP BY a.selectedOptionId")
    List<Object[]> countByOption(@Param("interactionId") Long interactionId);

    long countByInteractionPointId(Long interactionId);
}
