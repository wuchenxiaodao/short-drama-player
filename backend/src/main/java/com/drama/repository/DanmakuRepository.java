package com.drama.repository;

import com.drama.model.Danmaku;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DanmakuRepository extends JpaRepository<Danmaku, Long> {
    List<Danmaku> findByEpisodeIdAndPositionMsBetweenOrderByPositionMsAsc(
        Long episodeId, Long startMs, Long endMs);
    List<Danmaku> findTop200ByEpisodeIdOrderByPositionMsAsc(Long episodeId);
}
