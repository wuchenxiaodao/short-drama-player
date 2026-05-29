package com.drama.service;

import com.drama.dto.ProgressReport;
import com.drama.model.WatchProgress;
import com.drama.repository.WatchProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final WatchProgressRepository progressRepository;

    @Transactional
    public void reportProgress(ProgressReport report, Long userId) {
        Optional<WatchProgress> existing = progressRepository
                .findByUserIdAndEpisodeId(userId, report.getEpisodeId());

        WatchProgress progress = existing.orElse(new WatchProgress());
        progress.setUserId(userId);
        progress.setEpisodeId(report.getEpisodeId());
        progress.setPositionMs(report.getPositionMs());
        progress.setCompleted(Boolean.TRUE.equals(report.getCompleted()));
        progressRepository.save(progress);
    }
}
