package com.drama.service;

import com.drama.dto.RatingRequest;
import com.drama.model.Rating;
import com.drama.repository.DramaRepository;
import com.drama.repository.RatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRepository ratingRepository;
    private final DramaRepository dramaRepository;

    @Transactional
    public Map<String, Object> submitRating(Long userId, RatingRequest request) {
        Long dramaId = request.getDramaId();
        Integer score = request.getScore();

        Rating rating = ratingRepository.findByUserIdAndDramaId(userId, dramaId).orElse(new Rating());
        rating.setUserId(userId);
        rating.setDramaId(dramaId);
        rating.setScore(score);
        ratingRepository.save(rating);

        Double avg = ratingRepository.getAverageScore(dramaId);
        Long count = ratingRepository.getRatingCount(dramaId);
        dramaRepository.updateRating(dramaId, Math.round(avg * 10.0) / 10.0);

        return Map.of("averageRating", avg, "ratingCount", count);
    }

    public Map<String, Object> getUserRating(Long userId, Long dramaId) {
        return ratingRepository.findByUserIdAndDramaId(userId, dramaId)
                .map(r -> Map.<String, Object>of("score", r.getScore()))
                .orElse(Map.of("score", 0));
    }

    public Map<String, Object> getStats(Long dramaId) {
        Double avg = ratingRepository.getAverageScore(dramaId);
        Long count = ratingRepository.getRatingCount(dramaId);
        return Map.of(
                "averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0,
                "ratingCount", count);
    }
}
