package com.drama.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "interaction_answers",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "interaction_id"}))
public class InteractionAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interaction_id", nullable = false)
    private InteractionPoint interactionPoint;

    @Column(nullable = false)
    private Long selectedOptionId;

    @Column(name = "emoji_reaction")
    private String emojiReaction;  // The emoji the user sent/liked

    @Column(name = "is_send")
    private Boolean isSend;  // true=actively sent, false=liked a floating one

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
