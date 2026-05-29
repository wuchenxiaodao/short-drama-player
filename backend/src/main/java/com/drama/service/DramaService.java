package com.drama.service;

import com.drama.dto.DramaDetail;
import com.drama.dto.DramaSummary;
import com.drama.model.Drama;
import com.drama.model.Episode;
import com.drama.model.WatchProgress;
import com.drama.repository.DramaRepository;
import com.drama.repository.EpisodeRepository;
import com.drama.repository.RatingRepository;
import com.drama.repository.WatchProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DramaService {

    private final DramaRepository dramaRepository;
    private final EpisodeRepository episodeRepository;
    private final WatchProgressRepository watchProgressRepository;
    private final RatingRepository ratingRepository;

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    public Page<DramaSummary> getRecommended(int page, int size) {
        return mapToSummaryPage(dramaRepository.findTopRated(PageRequest.of(page, size)));
    }

    public Page<DramaSummary> getHot(int page, int size) {
        return mapToSummaryPage(dramaRepository.findByIsHotTrueOrderByViewCountDesc(PageRequest.of(page, size)));
    }

    public Page<DramaSummary> search(String keyword, int page, int size) {
        return mapToSummaryPage(dramaRepository.search(keyword, PageRequest.of(page, size)));
    }

    public Page<DramaSummary> getNew(int page, int size) {
        return mapToSummaryPage(dramaRepository.findByIsNewTrueOrderByCreatedAtDesc(PageRequest.of(page, size)));
    }

    public DramaDetail getDetail(Long dramaId, Long userId) {
        Drama drama = dramaRepository.findById(dramaId)
                .orElseThrow(() -> new RuntimeException("Drama not found: " + dramaId));

        incrementViewCount(dramaId);

        List<Episode> episodes = episodeRepository.findByDramaIdOrderByEpisodeNumberAsc(dramaId);
        Map<Long, Long> progressMap = getWatchProgress(userId, episodes);

        DramaDetail detail = buildDramaDetail(drama, episodes, progressMap);
        detail.setRelatedDramas(getRelatedDramas(drama));

        return detail;
    }

    private Map<Long, Long> getWatchProgress(Long userId, List<Episode> episodes) {
        Map<Long, Long> progressMap = new HashMap<>();
        if (userId == null) return progressMap;

        List<Long> episodeIds = episodes.stream().map(Episode::getId).collect(Collectors.toList());
        List<WatchProgress> progresses = watchProgressRepository.findByUserIdAndEpisodeIdIn(userId, episodeIds);
        for (WatchProgress p : progresses) {
            progressMap.put(p.getEpisodeId(), p.getPositionMs());
        }
        return progressMap;
    }

    private DramaDetail buildDramaDetail(Drama drama, List<Episode> episodes, Map<Long, Long> progressMap) {
        DramaDetail detail = new DramaDetail();
        detail.setId(drama.getId());
        detail.setTitle(drama.getTitle());
        detail.setDescription(drama.getDescription());
        detail.setCoverUrl(drama.getCoverUrl());
        detail.setCategory(drama.getCategory());
        detail.setTotalEpisodes(drama.getTotalEpisodes());
        detail.setRating(drama.getRating());
        detail.setRatingCount(ratingRepository.getRatingCount(drama.getId()));
        detail.setViewCount(drama.getViewCount());
        detail.setEpisodes(buildEpisodeInfoList(episodes, progressMap));
        return detail;
    }

    private List<DramaDetail.EpisodeInfo> buildEpisodeInfoList(List<Episode> episodes, Map<Long, Long> progressMap) {
        return episodes.stream().map(ep -> {
            DramaDetail.EpisodeInfo info = new DramaDetail.EpisodeInfo();
            info.setId(ep.getId());
            info.setEpisodeNumber(ep.getEpisodeNumber());
            info.setTitle(ep.getTitle());
            info.setDurationSeconds(ep.getDurationSeconds());
            info.setWatchPositionMs(progressMap.get(ep.getId()));
            info.setIsHot(ep.getEpisodeNumber() <= 3);
            return info;
        }).collect(Collectors.toList());
    }

    private List<DramaSummary> getRelatedDramas(Drama drama) {
        return dramaRepository.findByCategoryAndIdNot(
                drama.getCategory(), drama.getId(), PageRequest.of(0, 6))
                .stream().map(this::toSummary).collect(Collectors.toList());
    }

    private Page<DramaSummary> mapToSummaryPage(Page<Drama> dramaPage) {
        List<Long> dramaIds = dramaPage.getContent().stream().map(Drama::getId).collect(Collectors.toList());
        Map<Long, Long> ratingCountMap = new HashMap<>();
        if (!dramaIds.isEmpty()) {
            List<Object[]> counts = ratingRepository.countByDramaIds(dramaIds);
            for (Object[] row : counts) {
                ratingCountMap.put((Long) row[0], (Long) row[1]);
            }
        }
        Map<Long, Long> finalMap = ratingCountMap;
        return dramaPage.map(d -> toSummary(d, finalMap.getOrDefault(d.getId(), 0L)));
    }

    private DramaSummary toSummary(Drama d) {
        return toSummary(d, ratingRepository.getRatingCount(d.getId()));
    }

    private DramaSummary toSummary(Drama d, Long ratingCount) {
        DramaSummary s = new DramaSummary();
        s.setId(d.getId());
        s.setTitle(d.getTitle());
        s.setCoverUrl(d.getCoverUrl());
        s.setCategory(d.getCategory());
        s.setTotalEpisodes(d.getTotalEpisodes());
        s.setRating(d.getRating());
        s.setRatingCount(ratingCount);
        s.setViewCount(d.getViewCount());
        s.setIsNew(d.getIsNew());
        s.setIsHot(d.getIsHot());
        return s;
    }

    private void incrementViewCount(Long dramaId) {
        if (redisTemplate != null) {
            incrementViewCountWithRedis(dramaId);
        } else {
            dramaRepository.incrementViewCount(dramaId);
        }
    }

    private void incrementViewCountWithRedis(Long dramaId) {
        String key = "drama:view:" + dramaId;
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1) {
            redisTemplate.expire(key, 1, java.util.concurrent.TimeUnit.HOURS);
        }
        if (count != null && count % 100 == 0) {
            syncViewCountToDatabase(dramaId, 100L);
        }
    }

    private void syncViewCountToDatabase(Long dramaId, Long increment) {
        dramaRepository.findById(dramaId).ifPresent(d -> {
            d.setViewCount(d.getViewCount() + increment);
            dramaRepository.save(d);
        });
    }
}
