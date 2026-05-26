package com.drama.repository;

import com.drama.model.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    Page<Comment> findByInteractionIdAndParentCommentIdIsNullOrderByLikeCountDescCreatedAtDesc(
            Long interactionId, Long parentCommentId, Pageable pageable);

    Page<Comment> findByInteractionIdAndParentCommentIdIsNullOrderByCreatedAtDesc(
            Long interactionId, Long parentCommentId, Pageable pageable);

    List<Comment> findByParentCommentIdOrderByCreatedAtAsc(Long parentCommentId);

    long countByInteractionId(Long interactionId);
}
