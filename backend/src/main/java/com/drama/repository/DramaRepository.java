package com.drama.repository;

import com.drama.model.Drama;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface DramaRepository extends JpaRepository<Drama, Long> {
    Page<Drama> findByIsHotTrueOrderByViewCountDesc(Pageable pageable);

    Page<Drama> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Drama> findByCategoryOrderByRatingDesc(String category, Pageable pageable);

    @Query("SELECT d FROM Drama d ORDER BY d.rating DESC")
    Page<Drama> findTopRated(Pageable pageable);

    List<Drama> findByCategoryAndIdNot(String category, Long excludeId, Pageable pageable);

    @Query("SELECT d FROM Drama d WHERE d.title LIKE %:keyword% OR d.category LIKE %:keyword% OR d.description LIKE %:keyword%")
    Page<Drama> search(@org.springframework.data.repository.query.Param("keyword") String keyword, Pageable pageable);

    Page<Drama> findByIsNewTrueOrderByCreatedAtDesc(Pageable pageable);

    @Modifying
    @Transactional
    @Query("UPDATE Drama d SET d.viewCount = d.viewCount + 1 WHERE d.id = :id")
    void incrementViewCount(@org.springframework.data.repository.query.Param("id") Long id);
}
