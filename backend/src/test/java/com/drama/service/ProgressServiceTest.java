package com.drama.service;

import com.drama.dto.ProgressReport;
import com.drama.model.WatchProgress;
import com.drama.repository.WatchProgressRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProgressServiceTest {

    @Mock private WatchProgressRepository progressRepository;
    @InjectMocks private ProgressService progressService;

    @Test
    void reportProgress_WhenNewProgress_ShouldCreate() {
        ProgressReport report = new ProgressReport();
        report.setEpisodeId(1L);
        report.setPositionMs(30000L);

        when(progressRepository.findByUserIdAndEpisodeId(1L, 1L)).thenReturn(Optional.empty());
        when(progressRepository.save(any())).thenReturn(new WatchProgress());

        progressService.reportProgress(report, 1L);

        verify(progressRepository).save(any(WatchProgress.class));
    }

    @Test
    void reportProgress_WhenExistingProgress_ShouldUpdate() {
        ProgressReport report = new ProgressReport();
        report.setEpisodeId(1L);
        report.setPositionMs(60000L);

        WatchProgress existing = new WatchProgress();
        existing.setUserId(1L);
        existing.setEpisodeId(1L);
        existing.setPositionMs(30000L);

        when(progressRepository.findByUserIdAndEpisodeId(1L, 1L)).thenReturn(Optional.of(existing));
        when(progressRepository.save(any())).thenReturn(existing);

        progressService.reportProgress(report, 1L);

        verify(progressRepository).save(any(WatchProgress.class));
    }
}
