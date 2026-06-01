package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.dto.ProgressReport;
import com.drama.dto.WatchHistoryItem;
import com.drama.model.Drama;
import com.drama.model.Episode;
import com.drama.model.WatchProgress;
import com.drama.repository.DramaRepository;
import com.drama.repository.EpisodeRepository;
import com.drama.repository.WatchProgressRepository;
import com.drama.service.ProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;
    private final WatchProgressRepository watchProgressRepository;
    private final EpisodeRepository episodeRepository;
    private final DramaRepository dramaRepository;

    @PostMapping("/report")
    public ApiResponse<Void> report(@Valid @RequestBody ProgressReport report) {
        Long userId = AuthUtils.requireUserId();
        progressService.reportProgress(report, userId);
        return ApiResponse.success("进度已保存", null);
    }

    @GetMapping("/history")
    public ApiResponse<List<WatchHistoryItem>> getHistory() {
        Long userId = AuthUtils.requireUserId();
        List<WatchProgress> progresses = watchProgressRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        List<WatchHistoryItem> history = new ArrayList<>();
        for (WatchProgress wp : progresses) {
            Episode episode = episodeRepository.findById(wp.getEpisodeId()).orElse(null);
            if (episode == null) continue;
            Drama drama = dramaRepository.findById(episode.getDrama().getId()).orElse(null);
            if (drama == null) continue;
            WatchHistoryItem item = new WatchHistoryItem(
                    drama.getId(),
                    drama.getTitle(),
                    drama.getCoverUrl(),
                    episode.getId(),
                    episode.getEpisodeNumber(),
                    wp.getPositionMs(),
                    wp.getUpdatedAt()
            );
            history.add(item);
        }
        return ApiResponse.success(history);
    }
}
