package com.drama.service;

import com.drama.dto.PlayInfo;
import com.drama.model.Episode;
import com.drama.model.InteractionAnswer;
import com.drama.model.InteractionOption;
import com.drama.model.InteractionPoint;
import com.drama.model.WatchProgress;
import com.drama.repository.EpisodeRepository;
import com.drama.repository.InteractionAnswerRepository;
import com.drama.repository.InteractionPointRepository;
import com.drama.repository.WatchProgressRepository;
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
    private final InteractionAnswerRepository answerRepository;

    public PlayInfo getPlayInfo(Long episodeId, Long userId) {
        Episode episode = episodeRepository.findById(episodeId)
                .orElseThrow(() -> new com.drama.common.BusinessException(404, "剧集不存在"));

        PlayInfo playInfo = buildPlayInfo(episode);
        playInfo.setLastPositionMs(getLastPosition(userId, episodeId));
        playInfo.setInteractions(buildInteractionInfoList(episodeId, userId));

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

    private List<PlayInfo.InteractionInfo> buildInteractionInfoList(Long episodeId, Long userId) {
        List<InteractionPoint> points = interactionPointRepository.findWithOptionsByEpisodeId(episodeId);
        Map<Long, Long> userAnswers = userId != null ? getUserAnswerMap(userId, points) : Map.of();
        return points.stream()
                .map(p -> buildInteractionInfo(p, userAnswers))
                .collect(Collectors.toList());
    }

    private Map<Long, Long> getUserAnswerMap(Long userId, List<InteractionPoint> points) {
        List<Long> prerequisiteIds = points.stream()
                .filter(p -> p.getPrerequisite() != null)
                .map(p -> p.getPrerequisite().getId())
                .distinct()
                .collect(Collectors.toList());
        if (prerequisiteIds.isEmpty()) return Map.of();

        List<InteractionAnswer> answers = answerRepository.findByUserIdAndInteractionPointIdIn(userId, prerequisiteIds);
        return answers.stream()
                .collect(Collectors.toMap(a -> a.getInteractionPoint().getId(), InteractionAnswer::getSelectedOptionId));
    }

    private PlayInfo.InteractionInfo buildInteractionInfo(InteractionPoint point, Map<Long, Long> userAnswers) {
        PlayInfo.InteractionInfo info = new PlayInfo.InteractionInfo();
        info.setId(point.getId());
        info.setTimestampMs(point.getTimestampMs());
        info.setType(point.getInteractionType().name());
        info.setQuestionText(point.getQuestionText());

        if (point.getPrerequisite() != null) {
            info.setPrerequisiteId(point.getPrerequisite().getId());
            info.setPrerequisiteChoiceOptionId(point.getPrerequisiteChoiceOptionId());
            Long userChoice = userAnswers.get(point.getPrerequisite().getId());
            info.setPrerequisiteMet(userChoice != null && userChoice.equals(point.getPrerequisiteChoiceOptionId()));
        } else {
            info.setPrerequisiteMet(true);
        }

        info.setOptions(point.getOptions().stream().map(o -> {
            PlayInfo.InteractionInfo.OptionInfo opt = new PlayInfo.InteractionInfo.OptionInfo();
            opt.setId(o.getId());
            opt.setText(o.getOptionText());
            opt.setIsCorrect(o.getIsCorrect());
            opt.setNextInteractionId(o.getNextInteraction() != null ? o.getNextInteraction().getId() : null);
            opt.setFeedbackText(o.getFeedbackText());
            return opt;
        }).collect(Collectors.toList()));
        return info;
    }
}
