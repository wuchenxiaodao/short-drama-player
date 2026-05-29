package com.drama.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProgressReport {
    @NotNull(message = "剧集ID不能为空")
    private Long episodeId;
    @NotNull(message = "播放位置不能为空")
    private Long positionMs;
}
