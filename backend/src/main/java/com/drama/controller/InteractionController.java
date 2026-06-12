package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.dto.AnswerRequest;
import com.drama.dto.InteractionStats;
import com.drama.model.InteractionPoint;
import com.drama.repository.InteractionPointRepository;
import com.drama.service.InteractionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interaction")
@RequiredArgsConstructor
public class InteractionController {

    private final InteractionService interactionService;
    private final InteractionPointRepository interactionPointRepository;

    @PostMapping("/answer")
    public ApiResponse<Object> answer(@Valid @RequestBody AnswerRequest request) {
        Long userId = AuthUtils.getCurrentUserId();
        boolean success = interactionService.submitAnswer(request, userId);
        if (success) {
            InteractionStats stats = interactionService.getStats(request.getInteractionId());
            return ApiResponse.success("答题成功", stats);
        }
        return ApiResponse.error(400, "已经答过题了");
    }

    @GetMapping("/{id}/stats")
    public ApiResponse<InteractionStats> stats(@PathVariable Long id) {
        return ApiResponse.success(interactionService.getStats(id));
    }

    @GetMapping("/episode/{episodeId}")
    public ApiResponse<List<InteractionPoint>> getByEpisode(@PathVariable Long episodeId) {
        List<InteractionPoint> points = interactionPointRepository.findWithOptionsByEpisodeId(episodeId);
        return ApiResponse.success(points);
    }

    @GetMapping("/stats/overview")
    public ApiResponse<Map<String, Object>> overviewStats() {
        return ApiResponse.success(interactionService.getOverviewStats());
    }

    @GetMapping("/stats/drama/{dramaId}")
    public ApiResponse<Map<String, Object>> dramaStats(@PathVariable Long dramaId) {
        return ApiResponse.success(interactionService.getDramaStats(dramaId));
    }

    @PostMapping("/emoji")
    public ApiResponse<Object> sendEmoji(@RequestBody Map<String, Object> body) {
        Long userId = AuthUtils.requireUserId();
        return ApiResponse.success("表情发送成功");
    }
}
