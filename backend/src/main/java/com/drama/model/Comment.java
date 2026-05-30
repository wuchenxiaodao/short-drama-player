package com.drama.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "comments")
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column
    private Long interactionId;

    @Column
    private Long dramaId;

    @Column(length = 500, nullable = false)
    private String content;

    private Long replyToUserId;

    private Long parentCommentId;

    private Long likeCount;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (likeCount == null) likeCount = 0L;
    }
}
