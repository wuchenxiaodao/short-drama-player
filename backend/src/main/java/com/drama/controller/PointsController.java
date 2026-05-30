package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.common.BusinessException;
import com.drama.model.InteractionPoint;
import com.drama.model.User;
import com.drama.repository.InteractionPointRepository;
import com.drama.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/points")
@RequiredArgsConstructor
public class PointsController {

    private final UserRepository userRepository;
    private final InteractionPointRepository interactionPointRepository;

    @GetMapping("/balance")
    public ApiResponse<Map<String, Object>> getBalance() {
        Long userId = AuthUtils.requireUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(404, "用户不存在"));
        return ApiResponse.success(Map.of("points", user.getPoints()));
    }

    @PostMapping("/hint")
    public ApiResponse<Map<String, Object>> buyHint(@RequestBody BuyHintRequest request) {
        Long userId = AuthUtils.requireUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(404, "用户不存在"));

        InteractionPoint point = interactionPointRepository.findById(request.getInteractionId())
                .orElseThrow(() -> new BusinessException(404, "互动不存在"));

        int cost = point.getHintCost() != null ? point.getHintCost() : 50;
        if (user.getPoints() < cost) {
            throw new BusinessException(400, "积分不足，需要" + cost + "积分");
        }

        userRepository.addPoints(userId, -cost);

        return ApiResponse.success(Map.of(
            "hint", point.getHint() != null ? point.getHint() : "暂无提示",
            "remainingPoints", user.getPoints() - cost
        ));
    }

    @Data
    public static class BuyHintRequest {
        private Long interactionId;
    }
}
