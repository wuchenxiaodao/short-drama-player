package com.drama.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "generated_stories")
@JsonIgnoreProperties({"episode", "user", "hibernateLazyInitializer", "handler"})
public class GeneratedStory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "episode_id")
    private Episode episode;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 200)
    private String prompt;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(length = 50)
    private String type;

    private LocalDateTime createdAt;

    @Transient
    private Long episodeId;

    @Transient
    private Long userId;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PostLoad
    protected void onLoad() {
        fillTransientIds();
    }

    public void fillTransientIds() {
        this.episodeId = episode != null ? episode.getId() : null;
        this.userId = user != null ? user.getId() : null;
    }
}
