package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.dto.DramaDetail;
import com.drama.dto.DramaSummary;
import com.drama.service.DramaService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drama")
@RequiredArgsConstructor
public class DramaController {

    private final DramaService dramaService;

    @GetMapping("/recommend")
    public ApiResponse<Page<DramaSummary>> recommend(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
        return ApiResponse.success(dramaService.getRecommended(page, size));
    }

    @GetMapping("/hot")
    public ApiResponse<Page<DramaSummary>> hot(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
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
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ApiResponse.success(dramaService.search(keyword, category, page, size));
    }

    @GetMapping("/new")
    public ApiResponse<Page<DramaSummary>> newDramas(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
        return ApiResponse.success(dramaService.getNew(page, size));
    }

    @GetMapping("/continue")
    public ApiResponse<List<DramaSummary>> continueWatching() {
        return ApiResponse.success(dramaService.getContinueWatching(AuthUtils.getCurrentUserId()));
    }

    @GetMapping("/categories")
    public ApiResponse<List<String>> categories() {
        return ApiResponse.success(dramaService.getCategories());
    }

    @GetMapping("/category/{category}")
    public ApiResponse<Page<DramaSummary>> byCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
        return ApiResponse.success(dramaService.getByCategory(category, page, size));
    }
}
