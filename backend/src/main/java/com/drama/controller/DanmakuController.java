package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.common.BusinessException;
import com.drama.model.Danmaku;
import com.drama.repository.DanmakuRepository;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/danmaku")
public class DanmakuController {

    private final DanmakuRepository danmakuRepository;

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    public DanmakuController(DanmakuRepository danmakuRepository) {
        this.danmakuRepository = danmakuRepository;
    }

    @GetMapping("/episode/{episodeId}")
    public ApiResponse<List<Danmaku>> getDanmaku(@PathVariable Long episodeId) {
        List<Danmaku> list = danmakuRepository.findTop200ByEpisodeIdOrderByPositionMsAsc(episodeId);
        return ApiResponse.success(list);
    }

    @PostMapping("/send")
    public ApiResponse<Danmaku> sendDanmaku(@RequestBody DanmakuRequest request) {
        Long userId = AuthUtils.requireUserId();

        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new BusinessException(400, "弹幕内容不能为空");
        }
        if (request.getContent().length() > 100) {
            throw new BusinessException(400, "弹幕内容不能超过100字");
        }

        if (redisTemplate != null) {
            String rateLimitKey = "danmaku:rate:" + userId;
            Long count = redisTemplate.opsForValue().increment(rateLimitKey);
            if (count != null && count == 1) {
                redisTemplate.expire(rateLimitKey, 60, TimeUnit.SECONDS);
            }
            if (count != null && count > 10) {
                throw new BusinessException(429, "发送太频繁，请稍后再试");
            }
        }

        Danmaku danmaku = new Danmaku();
        danmaku.setEpisodeId(request.getEpisodeId());
        danmaku.setUserId(userId);
        danmaku.setContent(request.getContent().trim());
        danmaku.setPositionMs(request.getPositionMs());

        danmakuRepository.save(danmaku);
        return ApiResponse.success(danmaku);
    }

    @Data
    public static class DanmakuRequest {
        private Long episodeId;
        private String content;
        private Long positionMs;
    }
}
