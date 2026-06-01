package com.drama.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "dramas")
public class Drama {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    private String coverUrl;

    private String category; // 甜宠, 悬疑, 古装, 都市

    private Integer totalEpisodes;

    private Double rating;

    private Long viewCount;

    private Boolean isNew;

    private Boolean isHot;

    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "drama", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Episode> episodes;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (viewCount == null) viewCount = 0L;
        if (isNew == null) isNew = true;
        if (isHot == null) isHot = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
