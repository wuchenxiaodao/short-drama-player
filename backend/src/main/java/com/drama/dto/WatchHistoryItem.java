package com.drama.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WatchHistoryItem {
    private Long dramaId;
    private String dramaTitle;
    private String coverUrl;
    private Long episodeId;
    private Integer episodeNumber;
    private Long positionMs;
    private LocalDateTime lastWatchedAt;
}
