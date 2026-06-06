package com.drama.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "clip_interaction")
public class ClipInteraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    @Column(nullable = false)
    private Long clipId;

    @Column(nullable = false, length = 20)
    private String action;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
