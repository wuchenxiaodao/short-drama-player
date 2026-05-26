package com.drama.controller;

import com.drama.model.Rating;
import com.drama.repository.DramaRepository;
import com.drama.repository.RatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/rating")
@RequiredArgsConstructor
public class RatingController {

    private final RatingRepository ratingRepository;
    private final DramaRepository dramaRepository;

    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submit(@RequestBody Map<String, Long> body) {
        Long userId = body.get("userId");
        Long dramaId = body.get("dramaId");
        Integer score = body.get("score").intValue();

        if (score < 1 || score > 10) {
            return ResponseEntity.ok(Map.of("success", false, "message", "评分范围1-10"));
        }

        Rating rating = ratingRepository.findByUserIdAndDramaId(userId, dramaId).orElse(new Rating());
        rating.setUserId(userId);
        rating.setDramaId(dramaId);
        rating.setScore(score);
        ratingRepository.save(rating);

        // Update drama rating
        Double avg = ratingRepository.getAverageScore(dramaId);
        Long count = ratingRepository.getRatingCount(dramaId);
        dramaRepository.findById(dramaId).ifPresent(d -> {
            d.setRating(Math.round(avg * 10.0) / 10.0);
            dramaRepository.save(d);
        });

        return ResponseEntity.ok(Map.of("success", true, "averageRating", avg, "ratingCount", count));
    }

    @GetMapping("/user")
    public ResponseEntity<Map<String, Object>> getUserRating(
            @RequestParam Long userId, @RequestParam Long dramaId) {
        return ratingRepository.findByUserIdAndDramaId(userId, dramaId)
                .map(r -> ResponseEntity.ok(Map.<String, Object>of("score", r.getScore())))
                .orElse(ResponseEntity.ok(Map.of("score", 0)));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(@RequestParam Long dramaId) {
        Double avg = ratingRepository.getAverageScore(dramaId);
        Long count = ratingRepository.getRatingCount(dramaId);
        return ResponseEntity.ok(Map.of(
                "averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0,
                "ratingCount", count));
    }
}
