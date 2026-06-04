package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.model.GeneratedStory;
import com.drama.service.AIStoryService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai-story")
@RequiredArgsConstructor
public class AIStoryController {

    private final AIStoryService aiStoryService;

    @PostMapping("/branch")
    public ApiResponse<GeneratedStory> generateBranch(@RequestBody StoryRequest request) {
        Long userId = AuthUtils.requireUserId();
        GeneratedStory story = aiStoryService.generateBranch(
                request.getEpisodeId(), request.getPrompt(), userId);
        return ApiResponse.success("分支剧情生成成功", story);
    }

    @PostMapping("/continue")
    public ApiResponse<GeneratedStory> generateContinue(@RequestBody StoryRequest request) {
        Long userId = AuthUtils.requireUserId();
        GeneratedStory story = aiStoryService.generateContinue(
                request.getEpisodeId(), request.getPrompt(), userId);
        return ApiResponse.success("续写剧情生成成功", story);
    }

    @GetMapping("/my")
    public ApiResponse<List<GeneratedStory>> myStories() {
        Long userId = AuthUtils.requireUserId();
        return ApiResponse.success(aiStoryService.getUserStories(userId));
    }

    @Data
    public static class StoryRequest {
        @NotNull
        private Long episodeId;

        @NotBlank
        private String prompt;
    }
}
