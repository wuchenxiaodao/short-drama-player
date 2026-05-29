package com.drama.controller;

import com.drama.common.AuthUtils;
import com.drama.service.OnlineService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/online")
@RequiredArgsConstructor
public class OnlineController {

    private final OnlineService onlineService;

    @PostMapping("/heartbeat")
    public Map<String, Object> heartbeat(@RequestBody Map<String, Object> body) {
        Long userId = AuthUtils.requireUserId();
        Long episodeId = Long.valueOf(body.get("episodeId").toString());
        onlineService.heartbeat(userId, episodeId);
        return Map.of("success", true);
    }

    @GetMapping("/episode/{episodeId}/count")
    public Map<String, Object> getOnlineCount(@PathVariable Long episodeId) {
        long count = onlineService.getOnlineCount(episodeId);
        return Map.of("episodeId", episodeId, "onlineCount", count);
    }

    @GetMapping("/episode/{episodeId}/users")
    public Map<String, Object> getOnlineUsers(@PathVariable Long episodeId) {
        Set<String> users = onlineService.getOnlineUsers(episodeId);
        return Map.of("episodeId", episodeId, "users", users);
    }
}
