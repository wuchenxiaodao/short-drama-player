package com.drama.repository;

import com.drama.model.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    Page<Comment> findByInteractionIdAndParentCommentIdIsNullOrderByLikeCountDescCreatedAtDesc(
            Long interactionId, Long parentCommentId, Pageable pageable);

    Page<Comment> findByInteractionIdAndParentCommentIdIsNullOrderByCreatedAtDesc(
            Long interactionId, Long parentCommentId, Pageable pageable);

    List<Comment> findByParentCommentIdOrderByCreatedAtAsc(Long parentCommentId);

    long countByInteractionId(Long interactionId);

    @Query("SELECT c.parentCommentId, COUNT(c) FROM Comment c WHERE c.parentCommentId IN :parentIds GROUP BY c.parentCommentId")
    List<Object[]> countRepliesByParentIds(@Param("parentIds") List<Long> parentIds);

    @Modifying
    @Transactional
    @Query("UPDATE Comment c SET c.likeCount = c.likeCount + 1 WHERE c.id = :id")
    void incrementLikeCount(@Param("id") Long id);

    @Modifying
    @Transactional
    @Query("UPDATE Comment c SET c.likeCount = GREATEST(c.likeCount - 1, 0) WHERE c.id = :id")
    void decrementLikeCount(@Param("id") Long id);
}
