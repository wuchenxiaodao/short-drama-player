package com.drama.service;

import com.drama.dto.PlayInfo;
import com.drama.model.Episode;
import com.drama.model.InteractionPoint;
import com.drama.model.WatchProgress;
import com.drama.repository.EpisodeRepository;
import com.drama.repository.InteractionPointRepository;
import com.drama.repository.WatchProgressRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EpisodeService {

    private final EpisodeRepository episodeRepository;
    private final InteractionPointRepository interactionPointRepository;
    private final WatchProgressRepository watchProgressRepository;
    private final ObjectMapper objectMapper;

    public PlayInfo getPlayInfo(Long episodeId, Long userId) {
        Episode episode = episodeRepository.findById(episodeId)
                .orElseThrow(() -> new RuntimeException("Episode not found: " + episodeId));

        PlayInfo playInfo = buildPlayInfo(episode);
        playInfo.setLastPositionMs(getLastPosition(userId, episodeId));
        playInfo.setInteractions(buildInteractionInfoList(episodeId));

        return playInfo;
    }

    private PlayInfo buildPlayInfo(Episode episode) {
        PlayInfo playInfo = new PlayInfo();
        playInfo.setEpisodeId(episode.getId());
        playInfo.setVideoUrl(episode.getVideoUrl());
        playInfo.setDurationSeconds(episode.getDurationSeconds());
        return playInfo;
    }

    private Long getLastPosition(Long userId, Long episodeId) {
        if (userId == null) return null;
        return watchProgressRepository.findByUserIdAndEpisodeId(userId, episodeId)
                .map(WatchProgress::getPositionMs)
                .orElse(null);
    }

    private List<PlayInfo.InteractionInfo> buildInteractionInfoList(Long episodeId) {
        List<InteractionPoint> points = interactionPointRepository.findByEpisodeIdOrderByTimestampMsAsc(episodeId);
        return points.stream()
                .map(this::buildInteractionInfo)
                .collect(Collectors.toList());
    }

    private PlayInfo.InteractionInfo buildInteractionInfo(InteractionPoint point) {
        PlayInfo.InteractionInfo info = new PlayInfo.InteractionInfo();
        info.setId(point.getId());
        info.setTimestampMs(point.getTimestampMs());
        info.setType(point.getInteractionType().name());
        info.setQuestionText(point.getQuestionText());
        info.setOptions(parseOptions(point.getOptionsJson()));
        return info;
    }

    private List<PlayInfo.InteractionInfo.OptionInfo> parseOptions(String optionsJson) {
        try {
            List<Map<String, Object>> options = objectMapper.readValue(
                    optionsJson, new TypeReference<>() {});
            return options.stream().map(o -> {
                PlayInfo.InteractionInfo.OptionInfo opt = new PlayInfo.InteractionInfo.OptionInfo();
                opt.setId(((Number) o.get("id")).longValue());
                opt.setText((String) o.get("text"));
                return opt;
            }).collect(Collectors.toList());
        } catch (Exception e) {
            return List.of();
        }
    }
}
