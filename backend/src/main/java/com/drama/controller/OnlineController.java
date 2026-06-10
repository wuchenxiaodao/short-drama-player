package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.service.OnlineService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/online")
@RequiredArgsConstructor
public class OnlineController {

    private final OnlineService onlineService;

    @PostMapping("/heartbeat")
    public ApiResponse<Boolean> heartbeat(@RequestBody Map<String, Object> body) {
        Long userId = AuthUtils.requireUserId();
        Long episodeId = Long.valueOf(body.get("episodeId").toString());
        onlineService.heartbeat(userId, episodeId);
        return ApiResponse.success(true);
    }

    @GetMapping("/episode/{episodeId}/count")
    public ApiResponse<Long> getOnlineCount(@PathVariable Long episodeId) {
        long count = onlineService.getOnlineCount(episodeId);
        return ApiResponse.success(count);
    }
}
