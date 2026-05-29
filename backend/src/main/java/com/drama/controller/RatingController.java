package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.dto.RatingRequest;
import com.drama.model.Rating;
import com.drama.repository.DramaRepository;
import com.drama.repository.RatingRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/rating")
@RequiredArgsConstructor
public class RatingController {

    private final RatingRepository ratingRepository;
    private final DramaRepository dramaRepository;

    @PostMapping("/submit")
    public ApiResponse<Map<String, Object>> submit(@Valid @RequestBody RatingRequest request) {
        Long userId = AuthUtils.requireUserId();
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

        return ApiResponse.success("评分成功", Map.of("averageRating", avg, "ratingCount", count));
    }

    @GetMapping("/user")
    public ApiResponse<Map<String, Object>> getUserRating(@RequestParam Long dramaId) {
        Long userId = AuthUtils.requireUserId();
        return ratingRepository.findByUserIdAndDramaId(userId, dramaId)
                .map(r -> ApiResponse.success(Map.<String, Object>of("score", r.getScore())))
                .orElse(ApiResponse.success(Map.of("score", 0)));
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getStats(@RequestParam @Min(1) Long dramaId) {
        Double avg = ratingRepository.getAverageScore(dramaId);
        Long count = ratingRepository.getRatingCount(dramaId);
        return ApiResponse.success(Map.of(
                "averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0,
                "ratingCount", count));
    }
}
