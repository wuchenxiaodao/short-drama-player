package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.common.BusinessException;
import com.drama.dto.PlayInfo;
import com.drama.model.Episode;
import com.drama.repository.EpisodeRepository;
import com.drama.service.EpisodeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/episode")
@RequiredArgsConstructor
public class EpisodeController {

    private final EpisodeService episodeService;
    private final EpisodeRepository episodeRepository;
    private final ObjectMapper objectMapper;

    @GetMapping("/{id}/playinfo")
    public ApiResponse<PlayInfo> playInfo(@PathVariable Long id) {
        return ApiResponse.success(episodeService.getPlayInfo(id, AuthUtils.getCurrentUserId()));
    }

    @GetMapping("/{id}/streams")
    public ApiResponse<Object> streams(@PathVariable Long id) {
        Episode episode = episodeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "剧集不存在"));
        Map<String, Object> result = new HashMap<>();
        result.put("episodeId", id);
        result.put("streams", parseStreams(episode.getStreams()));
        result.put("defaultUrl", episode.getVideoUrl());
        return ApiResponse.success(result);
    }

    private List<Map<String, Object>> parseStreams(String streamsJson) {
        if (streamsJson == null || streamsJson.isBlank()) {
            return List.of(Map.of("quality", "default", "url", ""));
        }
        try {
            return objectMapper.readValue(streamsJson,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
        } catch (Exception e) {
            return List.of(Map.of("quality", "default", "url", ""));
        }
    }
}
