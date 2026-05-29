package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.dto.DramaDetail;
import com.drama.dto.DramaSummary;
import com.drama.service.DramaService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/drama")
@RequiredArgsConstructor
public class DramaController {

    private final DramaService dramaService;

    @GetMapping("/recommend")
    public ApiResponse<Page<DramaSummary>> recommend(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(dramaService.getRecommended(page, size));
    }

    @GetMapping("/hot")
    public ApiResponse<Page<DramaSummary>> hot(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(dramaService.getHot(page, size));
    }

    @GetMapping("/{id}/detail")
    public ApiResponse<DramaDetail> detail(@PathVariable Long id) {
        return ApiResponse.success(dramaService.getDetail(id, AuthUtils.getCurrentUserId()));
    }

    @GetMapping("/{id}")
    public ApiResponse<DramaDetail> detailShort(@PathVariable Long id) {
        return detail(id);
    }

    @GetMapping("/search")
    public ApiResponse<Page<DramaSummary>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(dramaService.search(keyword, page, size));
    }

    @GetMapping("/new")
    public ApiResponse<Page<DramaSummary>> newDramas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(dramaService.getNew(page, size));
    }
}
