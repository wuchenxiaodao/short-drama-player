package com.drama.controller;

import com.drama.dto.PlayInfo;
import com.drama.service.EpisodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/episode")
@RequiredArgsConstructor
public class EpisodeController {

    private final EpisodeService episodeService;

    @GetMapping("/{id}/playinfo")
    public PlayInfo playInfo(
            @PathVariable Long id,
            @RequestParam(required = false) Long userId) {
        return episodeService.getPlayInfo(id, userId);
    }
}
