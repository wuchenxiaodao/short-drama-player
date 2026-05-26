package com.drama.controller;

import com.drama.dto.AnswerRequest;
import com.drama.dto.InteractionStats;
import com.drama.service.InteractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/interaction")
@RequiredArgsConstructor
public class InteractionController {

    private final InteractionService interactionService;

    @PostMapping("/answer")
    public ResponseEntity<Map<String, Object>> answer(@RequestBody AnswerRequest request) {
        boolean success = interactionService.submitAnswer(request);
        if (success) {
            InteractionStats stats = interactionService.getStats(request.getInteractionId());
            return ResponseEntity.ok(Map.of("success", true, "stats", stats));
        }
        return ResponseEntity.ok(Map.of("success", false, "message", "Already answered"));
    }

    @GetMapping("/{id}/stats")
    public InteractionStats stats(@PathVariable Long id) {
        return interactionService.getStats(id);
    }
}
