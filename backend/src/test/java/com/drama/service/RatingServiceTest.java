package com.drama.service;

import com.drama.dto.RatingRequest;
import com.drama.factory.TestDataFactory;
import com.drama.model.Rating;
import com.drama.repository.DramaRepository;
import com.drama.repository.RatingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RatingServiceTest {

    @Mock
    private RatingRepository ratingRepository;

    @Mock
    private DramaRepository dramaRepository;

    @InjectMocks
    private RatingService ratingService;

    private Rating testRating;

    @BeforeEach
    void setUp() {
        testRating = TestDataFactory.createRating(1L, 1L, 10L);
    }

    @Test
    void testSubmitRating_NewRating() {
        RatingRequest request = new RatingRequest();
        request.setDramaId(10L);
        request.setScore(8);

        when(ratingRepository.findByUserIdAndDramaId(1L, 10L)).thenReturn(Optional.empty());
        when(ratingRepository.save(any(Rating.class))).thenAnswer(invocation -> {
            Rating r = invocation.getArgument(0);
            r.setId(1L);
            return r;
        });
        when(ratingRepository.getAverageScore(10L)).thenReturn(8.0);
        when(ratingRepository.getRatingCount(10L)).thenReturn(1L);

        Map<String, Object> result = ratingService.submitRating(1L, request);

        assertNotNull(result);
        assertEquals(8.0, result.get("averageRating"));
        assertEquals(1L, result.get("ratingCount"));
        verify(ratingRepository).save(any(Rating.class));
        verify(dramaRepository).updateRating(eq(10L), anyDouble());
    }

    @Test
    void testSubmitRating_UpdateExisting() {
        Rating existingRating = TestDataFactory.createRating(1L, 1L, 10L);
        existingRating.setScore(6);

        RatingRequest request = new RatingRequest();
        request.setDramaId(10L);
        request.setScore(9);

        when(ratingRepository.findByUserIdAndDramaId(1L, 10L)).thenReturn(Optional.of(existingRating));
        when(ratingRepository.save(any(Rating.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(ratingRepository.getAverageScore(10L)).thenReturn(9.0);
        when(ratingRepository.getRatingCount(10L)).thenReturn(1L);

        Map<String, Object> result = ratingService.submitRating(1L, request);

        assertNotNull(result);
        assertEquals(9.0, result.get("averageRating"));
        verify(ratingRepository).save(any(Rating.class));
    }

    @Test
    void testGetRatingStats() {
        when(ratingRepository.getAverageScore(10L)).thenReturn(8.5);
        when(ratingRepository.getRatingCount(10L)).thenReturn(20L);

        Map<String, Object> result = ratingService.getStats(10L);

        assertNotNull(result);
        assertEquals(8.5, result.get("averageRating"));
        assertEquals(20L, result.get("ratingCount"));
        verify(ratingRepository).getAverageScore(10L);
        verify(ratingRepository).getRatingCount(10L);
    }

    @Test
    void testGetRatingStats_NoRatings() {
        when(ratingRepository.getAverageScore(999L)).thenReturn(null);
        when(ratingRepository.getRatingCount(999L)).thenReturn(0L);

        Map<String, Object> result = ratingService.getStats(999L);

        assertNotNull(result);
        assertEquals(0.0, result.get("averageRating"));
        assertEquals(0L, result.get("ratingCount"));
    }

    @Test
    void testGetUserRating_Exists() {
        when(ratingRepository.findByUserIdAndDramaId(1L, 10L)).thenReturn(Optional.of(testRating));

        Map<String, Object> result = ratingService.getUserRating(1L, 10L);

        assertNotNull(result);
        assertEquals(8, result.get("score"));
        verify(ratingRepository).findByUserIdAndDramaId(1L, 10L);
    }

    @Test
    void testGetUserRating_NotExists() {
        when(ratingRepository.findByUserIdAndDramaId(1L, 999L)).thenReturn(Optional.empty());

        Map<String, Object> result = ratingService.getUserRating(1L, 999L);

        assertNotNull(result);
        assertEquals(0, result.get("score"));
    }
}
