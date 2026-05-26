package com.drama.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "episodes")
public class Episode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "drama_id", nullable = false)
    private Drama drama;

    @Column(nullable = false)
    private Integer episodeNumber;

    private String title;

    private String videoUrl;

    private Integer durationSeconds;

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "episode", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<InteractionPoint> interactionPoints;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
