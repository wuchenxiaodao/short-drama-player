package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.dto.RatingRequest;
import com.drama.service.RatingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/rating")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;

    @PostMapping("/submit")
    public ApiResponse<Map<String, Object>> submit(@Valid @RequestBody RatingRequest request) {
        Long userId = AuthUtils.requireUserId();
        return ApiResponse.success("评分成功", ratingService.submitRating(userId, request));
    }

    @GetMapping("/user")
    public ApiResponse<Map<String, Object>> getUserRating(@RequestParam Long dramaId) {
        Long userId = AuthUtils.requireUserId();
        return ApiResponse.success(ratingService.getUserRating(userId, dramaId));
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getStats(@RequestParam @Min(1) Long dramaId) {
        return ApiResponse.success(ratingService.getStats(dramaId));
    }
}
