package com.drama.repository;

import com.drama.model.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    Optional<Favorite> findByUserIdAndDramaId(Long userId, Long dramaId);
    List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);
    boolean existsByUserIdAndDramaId(Long userId, Long dramaId);

    @Query("SELECT f.dramaId FROM Favorite f WHERE f.userId = :userId ORDER BY f.createdAt DESC")
    List<Long> findDramaIdsByUserId(Long userId);

    void deleteByUserIdAndDramaId(Long userId, Long dramaId);
}
