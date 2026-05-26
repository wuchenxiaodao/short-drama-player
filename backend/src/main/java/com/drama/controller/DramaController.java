package com.drama.controller;

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
    public Page<DramaSummary> recommend(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return dramaService.getRecommended(page, size);
    }

    @GetMapping("/hot")
    public Page<DramaSummary> hot(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return dramaService.getHot(page, size);
    }

    @GetMapping("/{id}/detail")
    public DramaDetail detail(
            @PathVariable Long id,
            @RequestParam(required = false) Long userId) {
        return dramaService.getDetail(id, userId);
    }

    @GetMapping("/search")
    public Page<DramaSummary> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return dramaService.search(keyword, page, size);
    }

    @GetMapping("/new")
    public Page<DramaSummary> newDramas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return dramaService.getNew(page, size);
    }
}
