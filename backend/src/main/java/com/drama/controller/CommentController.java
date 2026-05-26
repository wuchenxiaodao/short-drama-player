package com.drama.controller;

import com.drama.dto.CommentRequest;
import com.drama.dto.CommentResponse;
import com.drama.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/comment")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/{interactionId}")
    public CommentResponse.PageResult getComments(
            @PathVariable Long interactionId,
            @RequestParam(defaultValue = "hot") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return commentService.getComments(interactionId, sort, page, size);
    }

    @GetMapping("/{interactionId}/count")
    public Map<String, Long> getCount(@PathVariable Long interactionId) {
        return Map.of("count", commentService.getCommentCount(interactionId));
    }

    @GetMapping("/replies/{parentCommentId}")
    public java.util.List<CommentResponse> getReplies(
            @PathVariable Long parentCommentId,
            @RequestParam(required = false) Long userId) {
        return commentService.getReplies(parentCommentId, userId);
    }

    @PostMapping
    public ResponseEntity<CommentResponse> postComment(@RequestBody CommentRequest request) {
        return ResponseEntity.ok(commentService.postComment(request));
    }

    @PostMapping("/{commentId}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable Long commentId,
            @RequestParam Long userId) {
        boolean liked = commentService.toggleLike(userId, commentId);
        return ResponseEntity.ok(Map.of("liked", liked));
    }
}
