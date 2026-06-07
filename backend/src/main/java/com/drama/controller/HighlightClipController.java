package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.dto.HighlightClipVO;
import com.drama.enums.ClipTag;
import com.drama.service.ClipService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clips")
@RequiredArgsConstructor
public class HighlightClipController {

    private final ClipService clipService;

    @GetMapping("/flow")
    public ApiResponse<Page<HighlightClipVO>> getClipFlow(
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 20));
        Page<HighlightClipVO> result;
        if (tag != null && !tag.isEmpty()) {
            try {
                result = clipService.getClipsByTag(ClipTag.valueOf(tag), pageable);
            } catch (IllegalArgumentException e) {
                result = clipService.getRecommendClips(pageable);
            }
        } else {
            result = clipService.getRecommendClips(pageable);
        }
        return ApiResponse.success(result);
    }

    @PostMapping("/{clipId}/play")
    public ApiResponse<Void> recordPlay(@PathVariable Long clipId) {
        clipService.recordPlay(clipId);
        return ApiResponse.success("播放记录已保存", null);
    }

    @PostMapping("/{clipId}/click")
    public ApiResponse<Void> recordClick(@PathVariable Long clipId) {
        Long userId = AuthUtils.getCurrentUserId();
        clipService.recordClick(clipId, userId);
        return ApiResponse.success("点击记录已保存", null);
    }

    @PostMapping("/{clipId}/like")
    public ApiResponse<Void> recordLike(@PathVariable Long clipId) {
        Long userId = AuthUtils.getCurrentUserId();
        clipService.recordLike(clipId, userId);
        return ApiResponse.success("点赞成功", null);
    }

    @GetMapping("/drama/{dramaId}")
    public ApiResponse<Page<HighlightClipVO>> getDramaClips(
            @PathVariable Long dramaId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageable = PageRequest.of(page, size);
        return ApiResponse.success(clipService.getClipsByDrama(dramaId, pageable));
    }
}
