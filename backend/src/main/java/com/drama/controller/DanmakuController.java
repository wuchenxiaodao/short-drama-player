package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.common.BusinessException;
import com.drama.model.Danmaku;
import com.drama.repository.DanmakuRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/danmaku")
@RequiredArgsConstructor
public class DanmakuController {

    private final DanmakuRepository danmakuRepository;

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
