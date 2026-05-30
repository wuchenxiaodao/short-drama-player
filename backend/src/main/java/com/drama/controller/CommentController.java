package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.dto.CommentRequest;
import com.drama.dto.CommentResponse;
import com.drama.service.CommentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comment")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/{interactionId}")
    public ApiResponse<CommentResponse.PageResult> getComments(
            @PathVariable Long interactionId,
            @RequestParam(defaultValue = "hot") String sort,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ApiResponse.success(commentService.getComments(interactionId, sort, page, size));
    }

    @GetMapping("/{interactionId}/count")
    public ApiResponse<Map<String, Long>> getCount(@PathVariable Long interactionId) {
        return ApiResponse.success(Map.of("count", commentService.getCommentCount(interactionId)));
    }

    @GetMapping("/replies/{parentCommentId}")
    public ApiResponse<List<CommentResponse>> getReplies(@PathVariable Long parentCommentId) {
        Long userId = AuthUtils.getCurrentUserId();
        return ApiResponse.success(commentService.getReplies(parentCommentId, userId));
    }

    @GetMapping("/drama/{dramaId}")
    public ApiResponse<CommentResponse.PageResult> getDramaComments(
            @PathVariable Long dramaId,
            @RequestParam(defaultValue = "hot") String sort,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ApiResponse.success(commentService.getDramaComments(dramaId, sort, page, size));
    }

    @GetMapping("/drama/{dramaId}/count")
    public ApiResponse<Map<String, Long>> getDramaCommentCount(@PathVariable Long dramaId) {
        return ApiResponse.success(Map.of("count", commentService.getDramaCommentCount(dramaId)));
    }

    @PostMapping
    public ApiResponse<CommentResponse> postComment(@Valid @RequestBody CommentRequest request) {
        Long userId = AuthUtils.requireUserId();
        return ApiResponse.success(commentService.postComment(request, userId));
    }

    @PostMapping("/{commentId}/like")
    public ApiResponse<Map<String, Object>> toggleLike(@PathVariable Long commentId) {
        Long userId = AuthUtils.requireUserId();
        boolean liked = commentService.toggleLike(userId, commentId);
        return ApiResponse.success(Map.of("liked", liked));
    }
}
