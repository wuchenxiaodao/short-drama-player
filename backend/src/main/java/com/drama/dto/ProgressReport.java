package com.drama.dto;

import lombok.Data;

@Data
public class ProgressReport {
    private Long userId;
    private Long episodeId;
    private Long positionMs;
}
