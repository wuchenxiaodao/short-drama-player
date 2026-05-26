package com.drama.dto;

import lombok.Data;
import java.util.List;

@Data
public class DramaDetail {
    private Long id;
    private String title;
    private String description;
    private String coverUrl;
    private String category;
    private Integer totalEpisodes;
    private Double rating;
    private Long ratingCount;
    private Long viewCount;
    private List<EpisodeInfo> episodes;
    private List<DramaSummary> relatedDramas;

    @Data
    public static class EpisodeInfo {
        private Long id;
        private Integer episodeNumber;
        private String title;
        private Integer durationSeconds;
        private Long watchPositionMs;
        private Boolean isHot;
    }
}
