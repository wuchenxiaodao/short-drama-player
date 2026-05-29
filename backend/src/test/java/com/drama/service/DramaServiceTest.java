package com.drama.service;

import com.drama.dto.DramaDetail;
import com.drama.dto.DramaSummary;
import com.drama.factory.TestDataFactory;
import com.drama.model.Drama;
import com.drama.model.Episode;
import com.drama.repository.DramaRepository;
import com.drama.repository.EpisodeRepository;
import com.drama.repository.RatingRepository;
import com.drama.repository.WatchProgressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DramaServiceTest {

    @Mock
    private DramaRepository dramaRepository;

    @Mock
    private EpisodeRepository episodeRepository;

    @Mock
    private WatchProgressRepository watchProgressRepository;

    @Mock
    private RatingRepository ratingRepository;

    @InjectMocks
    private DramaService dramaService;

    private Drama testDrama;
    private Episode testEpisode;
    private Page<Drama> dramaPage;

    @BeforeEach
    void setUp() {
        testDrama = TestDataFactory.createDrama(1L, "测试短剧");
        testEpisode = TestDataFactory.createEpisode(1L, testDrama, 1);
        dramaPage = new PageImpl<>(Arrays.asList(testDrama));
    }

    @Test
    void getRecommended_ShouldReturnDramas() {
        when(dramaRepository.findByIsNewTrueOrderByCreatedAtDesc(any(PageRequest.class))).thenReturn(dramaPage);
        List<Object[]> countResult = new ArrayList<>();
        countResult.add(new Object[]{1L, 10L});
        when(ratingRepository.countByDramaIds(anyList())).thenReturn(countResult);

        Page<DramaSummary> result = dramaService.getRecommended(0, 10);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("测试短剧", result.getContent().get(0).getTitle());
        verify(dramaRepository).findByIsNewTrueOrderByCreatedAtDesc(any(PageRequest.class));
    }

    @Test
    void getHot_ShouldReturnDramas() {
        when(dramaRepository.findByIsHotTrueOrderByViewCountDesc(any(PageRequest.class))).thenReturn(dramaPage);
        List<Object[]> countResult = new ArrayList<>();
        countResult.add(new Object[]{1L, 10L});
        when(ratingRepository.countByDramaIds(anyList())).thenReturn(countResult);

        Page<DramaSummary> result = dramaService.getHot(0, 10);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        verify(dramaRepository).findByIsHotTrueOrderByViewCountDesc(any(PageRequest.class));
    }

    @Test
    void search_ShouldReturnMatchingDramas() {
        when(dramaRepository.search(anyString(), any(PageRequest.class))).thenReturn(dramaPage);
        List<Object[]> countResult = new ArrayList<>();
        countResult.add(new Object[]{1L, 10L});
        when(ratingRepository.countByDramaIds(anyList())).thenReturn(countResult);

        Page<DramaSummary> result = dramaService.search("测试", 0, 10);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        verify(dramaRepository).search(anyString(), any(PageRequest.class));
    }

    @Test
    void getNew_ShouldReturnDramas() {
        when(dramaRepository.findByIsNewTrueOrderByCreatedAtDesc(any(PageRequest.class))).thenReturn(dramaPage);
        List<Object[]> countResult = new ArrayList<>();
        countResult.add(new Object[]{1L, 10L});
        when(ratingRepository.countByDramaIds(anyList())).thenReturn(countResult);

        Page<DramaSummary> result = dramaService.getNew(0, 10);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        verify(dramaRepository).findByIsNewTrueOrderByCreatedAtDesc(any(PageRequest.class));
    }

    @Test
    void getDetail_WhenDramaExists_ShouldReturnDetail() {
        when(dramaRepository.findById(1L)).thenReturn(Optional.of(testDrama));
        when(episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(1L)).thenReturn(Arrays.asList(testEpisode));
        when(ratingRepository.getRatingCount(1L)).thenReturn(10L);
        when(dramaRepository.findByCategoryAndIdNot(anyString(), anyLong(), any(PageRequest.class))).thenReturn(Arrays.asList());
        when(dramaRepository.findByIdNot(anyLong(), any(PageRequest.class))).thenReturn(new PageImpl<>(Arrays.asList()));

        DramaDetail result = dramaService.getDetail(1L, null);

        assertNotNull(result);
        assertEquals("测试短剧", result.getTitle());
        assertEquals(1, result.getEpisodes().size());
        verify(episodeRepository).findByDramaIdOrderByEpisodeNumberAsc(1L);
    }

    @Test
    void getDetail_WhenDramaNotExists_ShouldThrowException() {
        when(dramaRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(com.drama.common.BusinessException.class, () -> {
            dramaService.getDetail(999L, null);
        });
        verify(dramaRepository).findById(999L);
    }

    @Test
    void getDetail_WithUserId_ShouldIncludeProgress() {
        when(dramaRepository.findById(1L)).thenReturn(Optional.of(testDrama));
        when(episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(1L)).thenReturn(Arrays.asList(testEpisode));
        when(watchProgressRepository.findByUserIdAndEpisodeIdIn(1L, Arrays.asList(1L))).thenReturn(List.of());
        when(ratingRepository.getRatingCount(1L)).thenReturn(10L);
        when(dramaRepository.findByCategoryAndIdNot(anyString(), anyLong(), any(PageRequest.class))).thenReturn(Arrays.asList());
        when(dramaRepository.findByIdNot(anyLong(), any(PageRequest.class))).thenReturn(new PageImpl<>(Arrays.asList()));

        DramaDetail result = dramaService.getDetail(1L, 1L);

        assertNotNull(result);
        assertEquals("测试短剧", result.getTitle());
        verify(watchProgressRepository).findByUserIdAndEpisodeIdIn(1L, Arrays.asList(1L));
    }
}
