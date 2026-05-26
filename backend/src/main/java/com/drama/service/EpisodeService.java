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

        PlayInfo playInfo = new PlayInfo();
        playInfo.setEpisodeId(episode.getId());
        playInfo.setVideoUrl(episode.getVideoUrl());
        playInfo.setDurationSeconds(episode.getDurationSeconds());

        if (userId != null) {
            watchProgressRepository.findByUserIdAndEpisodeId(userId, episodeId)
                    .ifPresent(p -> playInfo.setLastPositionMs(p.getPositionMs()));
        }

        List<InteractionPoint> points = interactionPointRepository.findByEpisodeIdOrderByTimestampMsAsc(episodeId);
        List<PlayInfo.InteractionInfo> interactions = points.stream().map(p -> {
            PlayInfo.InteractionInfo info = new PlayInfo.InteractionInfo();
            info.setId(p.getId());
            info.setTimestampMs(p.getTimestampMs());
            info.setType(p.getInteractionType().name());
            info.setQuestionText(p.getQuestionText());
            try {
                List<Map<String, Object>> options = objectMapper.readValue(
                        p.getOptionsJson(), new TypeReference<>() {});
                info.setOptions(options.stream().map(o -> {
                    PlayInfo.InteractionInfo.OptionInfo opt = new PlayInfo.InteractionInfo.OptionInfo();
                    opt.setId(((Number) o.get("id")).longValue());
                    opt.setText((String) o.get("text"));
                    return opt;
                }).collect(Collectors.toList()));
            } catch (Exception e) {
                info.setOptions(List.of());
            }
            return info;
        }).collect(Collectors.toList());
        playInfo.setInteractions(interactions);

        return playInfo;
    }
}
