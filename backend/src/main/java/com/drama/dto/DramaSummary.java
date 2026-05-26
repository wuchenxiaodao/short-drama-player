package com.drama.dto;

import lombok.Data;

@Data
public class DramaSummary {
    private Long id;
    private String title;
    private String coverUrl;
    private String category;
    private Integer totalEpisodes;
    private Double rating;
    private Long ratingCount;
    private Long viewCount;
    private Boolean isNew;
    private Boolean isHot;
}
