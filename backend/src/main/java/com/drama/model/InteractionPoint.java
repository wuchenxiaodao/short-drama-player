package com.drama.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "interaction_points")
public class InteractionPoint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "episode_id", nullable = false)
    private Episode episode;

    @Column(nullable = false)
    private Long timestampMs;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InteractionType interactionType;

    @Column(length = 500)
    private String questionText;

    @OneToMany(mappedBy = "interactionPoint", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("optionIndex ASC")
    private List<InteractionOption> options = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prerequisite_id")
    private InteractionPoint prerequisite;

    private Long prerequisiteChoiceOptionId;

    @Column(length = 200)
    private String hint;

    @Column
    private Integer hintCost = 50;

    private LocalDateTime createdAt;

    public enum InteractionType {
        CHOICE, VOTE, EGG, QUIZ, INFO, LINK, EMOJI
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
