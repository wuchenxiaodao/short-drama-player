package com.drama.service;

import com.drama.dto.PlayInfo;
import com.drama.factory.TestDataFactory;
import com.drama.model.Drama;
import com.drama.model.Episode;
import com.drama.model.InteractionPoint;
import com.drama.repository.EpisodeRepository;
import com.drama.repository.InteractionPointRepository;
import com.drama.repository.WatchProgressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EpisodeServiceTest {

    @Mock
    private EpisodeRepository episodeRepository;

    @Mock
    private InteractionPointRepository interactionPointRepository;

    @Mock
    private WatchProgressRepository watchProgressRepository;

    @InjectMocks
    private EpisodeService episodeService;

    private Drama testDrama;
    private Episode testEpisode;
    private InteractionPoint testInteractionPoint;

    @BeforeEach
    void setUp() {
        testDrama = TestDataFactory.createDrama(1L, "测试短剧");
        testEpisode = TestDataFactory.createEpisode(1L, testDrama, 1);
        testInteractionPoint = TestDataFactory.createInteractionPoint(1L, testEpisode, 30);
    }

    @Test
    void getPlayInfo_WhenEpisodeExists_ShouldReturnPlayInfo() {
        // Arrange
        when(episodeRepository.findById(1L)).thenReturn(Optional.of(testEpisode));
        when(interactionPointRepository.findByEpisodeIdOrderByTimestampMsAsc(1L)).thenReturn(Arrays.asList(testInteractionPoint));

        // Act
        PlayInfo result = episodeService.getPlayInfo(1L, null);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getEpisodeId());
        assertEquals("/videos/test.mp4", result.getVideoUrl());
        assertEquals(180, result.getDurationSeconds());
        verify(episodeRepository).findById(1L);
        verify(interactionPointRepository).findByEpisodeIdOrderByTimestampMsAsc(1L);
    }

    @Test
    void getPlayInfo_WhenEpisodeNotExists_ShouldThrowException() {
        // Arrange
        when(episodeRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(com.drama.common.BusinessException.class, () -> {
            episodeService.getPlayInfo(999L, null);
        });
        verify(episodeRepository).findById(999L);
    }

    @Test
    void getPlayInfo_WithUserId_ShouldIncludeProgress() {
        // Arrange
        when(episodeRepository.findById(1L)).thenReturn(Optional.of(testEpisode));
        when(interactionPointRepository.findByEpisodeIdOrderByTimestampMsAsc(1L)).thenReturn(Arrays.asList(testInteractionPoint));
        when(watchProgressRepository.findByUserIdAndEpisodeId(1L, 1L)).thenReturn(Optional.empty());

        // Act
        PlayInfo result = episodeService.getPlayInfo(1L, 1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getEpisodeId());
        verify(watchProgressRepository).findByUserIdAndEpisodeId(1L, 1L);
    }

    @Test
    void getPlayInfo_WithInteractions_ShouldReturnInteractions() {
        // Arrange
        when(episodeRepository.findById(1L)).thenReturn(Optional.of(testEpisode));
        when(interactionPointRepository.findByEpisodeIdOrderByTimestampMsAsc(1L)).thenReturn(Arrays.asList(testInteractionPoint));

        // Act
        PlayInfo result = episodeService.getPlayInfo(1L, null);

        // Assert
        assertNotNull(result);
        assertNotNull(result.getInteractions());
        assertEquals(1, result.getInteractions().size());
        verify(interactionPointRepository).findByEpisodeIdOrderByTimestampMsAsc(1L);
    }
}
