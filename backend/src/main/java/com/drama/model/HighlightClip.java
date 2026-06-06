package com.drama.model;

import com.drama.enums.ClipTag;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "highlight_clip")
public class HighlightClip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long dramaId;

    @Column(nullable = false)
    private Long episodeId;

    private String title;

    @Column(nullable = false)
    private Integer startTime;

    @Column(nullable = false)
    private Integer endTime;

    private String clipUrl;

    private String coverUrl;

    @Enumerated(EnumType.STRING)
    private ClipTag tag;

    @Column(columnDefinition = "INTEGER DEFAULT 0")
    private Integer heatScore = 0;

    @Column(columnDefinition = "INTEGER DEFAULT 0")
    private Integer playCount = 0;

    @Column(columnDefinition = "INTEGER DEFAULT 0")
    private Integer clickCount = 0;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Transient
    public double getConversionRate() {
        return playCount != null && playCount > 0
                ? (double) clickCount / playCount : 0;
    }
}
