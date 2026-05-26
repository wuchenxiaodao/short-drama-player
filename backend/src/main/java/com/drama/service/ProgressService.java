package com.drama.service;

import com.drama.dto.ProgressReport;
import com.drama.model.Episode;
import com.drama.model.WatchProgress;
import com.drama.repository.DramaRepository;
import com.drama.repository.EpisodeRepository;
import com.drama.repository.WatchProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final WatchProgressRepository progressRepository;
    private final EpisodeRepository episodeRepository;
    private final DramaRepository dramaRepository;

    public void reportProgress(ProgressReport report) {
        Optional<WatchProgress> existing = progressRepository
                .findByUserIdAndEpisodeId(report.getUserId(), report.getEpisodeId());

        // First time watching this episode -> increment view count
        if (existing.isEmpty()) {
            episodeRepository.findById(report.getEpisodeId()).ifPresent(ep -> {
                dramaRepository.findById(ep.getDrama().getId()).ifPresent(d -> {
                    d.setViewCount(d.getViewCount() + 1);
                    dramaRepository.save(d);
                });
            });
        }

        WatchProgress progress = existing.orElse(new WatchProgress());
        progress.setUserId(report.getUserId());
        progress.setEpisodeId(report.getEpisodeId());
        progress.setPositionMs(report.getPositionMs());
        progress.setCompleted(false);
        progressRepository.save(progress);
    }
}
