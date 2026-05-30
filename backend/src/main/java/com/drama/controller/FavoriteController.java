package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.dto.DramaSummary;
import com.drama.model.Favorite;
import com.drama.repository.FavoriteRepository;
import com.drama.service.DramaService;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorite")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteRepository favoriteRepository;
    private final DramaService dramaService;

    @PostMapping("/{dramaId}")
    @Transactional
    public ApiResponse<Map<String, Object>> toggleFavorite(@PathVariable Long dramaId) {
        Long userId = AuthUtils.requireUserId();
        var existing = favoriteRepository.findByUserIdAndDramaId(userId, dramaId);
        boolean favorited;
        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
            favorited = false;
        } else {
            Favorite fav = new Favorite();
            fav.setUserId(userId);
            fav.setDramaId(dramaId);
            favoriteRepository.save(fav);
            favorited = true;
        }
        return ApiResponse.success(Map.of("favorited", favorited, "dramaId", dramaId));
    }

    @GetMapping("/list")
    public ApiResponse<List<DramaSummary>> getFavorites() {
        Long userId = AuthUtils.requireUserId();
        List<Long> dramaIds = favoriteRepository.findDramaIdsByUserId(userId);
        List<DramaSummary> favorites = dramaIds.stream()
                .map(id -> dramaService.getDetail(id, userId))
                .filter(d -> d != null)
                .map(d -> {
                    DramaSummary s = new DramaSummary();
                    s.setId(d.getId());
                    s.setTitle(d.getTitle());
                    s.setCategory(d.getCategory());
                    s.setRating(d.getRating());
                    s.setViewCount(d.getViewCount());
                    s.setCoverUrl(d.getCoverUrl());
                    s.setTotalEpisodes(d.getTotalEpisodes());
                    return s;
                })
                .toList();
        return ApiResponse.success(favorites);
    }

    @GetMapping("/check/{dramaId}")
    public ApiResponse<Map<String, Object>> checkFavorite(@PathVariable Long dramaId) {
        Long userId = AuthUtils.getCurrentUserId();
        boolean favorited = userId != null && favoriteRepository.existsByUserIdAndDramaId(userId, dramaId);
        return ApiResponse.success(Map.of("favorited", favorited));
    }
}
