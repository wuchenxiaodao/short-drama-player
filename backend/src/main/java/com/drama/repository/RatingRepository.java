package com.drama.repository;

import com.drama.model.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    Optional<Rating> findByUserIdAndDramaId(Long userId, Long dramaId);

    @Query("SELECT AVG(r.score) FROM Rating r WHERE r.dramaId = :dramaId")
    Double getAverageScore(@Param("dramaId") Long dramaId);

    @Query("SELECT COUNT(r) FROM Rating r WHERE r.dramaId = :dramaId")
    Long getRatingCount(@Param("dramaId") Long dramaId);

    @Query("SELECT r.dramaId, COUNT(r) FROM Rating r WHERE r.dramaId IN :ids GROUP BY r.dramaId")
    List<Object[]> countByDramaIds(@Param("ids") List<Long> ids);
}
