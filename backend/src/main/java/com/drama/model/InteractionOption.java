package com.drama.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "interaction_options")
@JsonIgnoreProperties({"nextInteraction", "interactionPoint", "hibernateLazyInitializer", "handler"})
public class InteractionOption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interaction_id", nullable = false)
    private InteractionPoint interactionPoint;

    @Column(nullable = false)
    private Integer optionIndex;

    @Column(nullable = false, length = 200)
    private String optionText;

    private Boolean isCorrect;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "next_interaction_id")
    private InteractionPoint nextInteraction;

    @Column(length = 500)
    private String feedbackText;

    @JsonProperty("nextInteractionId")
    public Long getNextInteractionId() {
        return nextInteraction != null ? nextInteraction.getId() : null;
    }
}
