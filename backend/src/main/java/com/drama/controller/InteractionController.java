package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.dto.AnswerRequest;
import com.drama.dto.InteractionStats;
import com.drama.service.InteractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/interaction")
@RequiredArgsConstructor
public class InteractionController {

    private final InteractionService interactionService;

    @PostMapping("/answer")
    public ApiResponse<Object> answer(@RequestBody AnswerRequest request) {
        Long userId = AuthUtils.requireUserId();
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
}
