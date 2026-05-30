package com.drama.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class HeartbeatRequest {
    @NotNull(message = "剧集ID不能为空")
    private Long episodeId;
}
