package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.dto.HighlightClipVO;
import com.drama.enums.ClipTag;
import com.drama.service.ClipService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clip")
public class ClipController {

    @Autowired
    private ClipService clipService;

    @GetMapping("/recommend")
    public ResponseEntity<ApiResponse<Page<HighlightClipVO>>> recommend(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<HighlightClipVO> result = clipService.getRecommendClips(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/tag/{tag}")
    public ResponseEntity<ApiResponse<Page<HighlightClipVO>>> byTag(
            @PathVariable ClipTag tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<HighlightClipVO> result = clipService.getClipsByTag(tag, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{clipId}")
    public ResponseEntity<ApiResponse<HighlightClipVO>> detail(@PathVariable Long clipId) {
        HighlightClipVO result = clipService.getClipDetail(clipId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/{clipId}/play")
    public ResponseEntity<ApiResponse<Void>> play(@PathVariable Long clipId) {
        clipService.recordPlay(clipId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{clipId}/click")
    public ResponseEntity<ApiResponse<Void>> click(
            @PathVariable Long clipId,
            @RequestParam(required = false) Long userId) {
        clipService.recordClick(clipId, userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{clipId}/like")
    public ResponseEntity<ApiResponse<Void>> like(
            @PathVariable Long clipId,
            @RequestParam(required = false) Long userId) {
        clipService.recordLike(clipId, userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
