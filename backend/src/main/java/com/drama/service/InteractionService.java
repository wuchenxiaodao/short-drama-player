package com.drama.service;

import com.drama.dto.AnswerRequest;
import com.drama.dto.InteractionStats;
import com.drama.model.InteractionAnswer;
import com.drama.model.InteractionPoint;
import com.drama.model.InteractionStatsEntity;
import com.drama.model.User;
import com.drama.model.UserEgg;
import com.drama.repository.InteractionAnswerRepository;
import com.drama.repository.InteractionPointRepository;
import com.drama.repository.InteractionStatsRepository;
import com.drama.repository.UserEggRepository;
import com.drama.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InteractionService {

    private final InteractionPointRepository interactionPointRepository;
    private final InteractionAnswerRepository answerRepository;
    private final InteractionStatsRepository statsRepository;
    private final UserRepository userRepository;
    private final UserEggRepository userEggRepository;

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    @Transactional
    public boolean submitAnswer(AnswerRequest request, Long userId) {
        if (isAlreadyAnswered(userId, request.getInteractionId())) {
            return false;
        }

        InteractionPoint point = getInteractionPoint(request.getInteractionId());
        User user = getUser(userId);

        saveAnswer(request, point, userId);
        updateStats(request);
        processRewards(point, request, user);

        // Emoji processing
        if (point.getInteractionType() == InteractionPoint.InteractionType.EMOJI
            && request.getEmojiReaction() != null) {
            updateEmojiStats(point, request.getEmojiReaction(), request.getIsSend());
        }

        return true;
    }

    private boolean isAlreadyAnswered(Long userId, Long interactionId) {
        if (userId == null) return false;
        return answerRepository.findByUserIdAndInteractionPointId(userId, interactionId).isPresent();
    }

    private InteractionPoint getInteractionPoint(Long interactionId) {
        return interactionPointRepository.findById(interactionId)
                .orElseThrow(() -> new com.drama.common.BusinessException(404, "互动不存在"));
    }

    private User getUser(Long userId) {
        if (userId == null) return null;
        return userRepository.findById(userId)
                .orElseThrow(() -> new com.drama.common.BusinessException(404, "用户不存在"));
    }

    private void saveAnswer(AnswerRequest request, InteractionPoint point, Long userId) {
        if (userId == null) return;  // 未登录用户不保存答案，但仍更新统计
        InteractionAnswer answer = new InteractionAnswer();
        answer.setUserId(userId);
        answer.setInteractionPoint(point);
        answer.setSelectedOptionId(request.getChoiceId());
        answerRepository.save(answer);
    }

    private void updateStats(AnswerRequest request) {
        Optional<InteractionStatsEntity> existing = statsRepository.findByInteractionIdAndOptionId(
                request.getInteractionId(), request.getChoiceId());
        
        if (existing.isPresent()) {
            statsRepository.incrementCount(request.getInteractionId(), request.getChoiceId());
        } else {
            InteractionStatsEntity newStats = new InteractionStatsEntity();
            newStats.setInteractionId(request.getInteractionId());
            newStats.setOptionId(request.getChoiceId());
            newStats.setCount(1L);
            statsRepository.save(newStats);
        }

        if (redisTemplate != null) {
            String redisKey = "interaction:count:" + request.getInteractionId();
            redisTemplate.opsForHash().increment(redisKey, String.valueOf(request.getChoiceId()), 1);

            String totalKey = "interaction:total:" + request.getInteractionId();
            redisTemplate.opsForValue().increment(totalKey);
        }
    }

    private void updateRedisStats(AnswerRequest request) {
        if (redisTemplate != null) {
            String redisKey = "interaction:count:" + request.getInteractionId();
            redisTemplate.opsForHash().increment(redisKey, String.valueOf(request.getChoiceId()), 1);

            String totalKey = "interaction:total:" + request.getInteractionId();
            redisTemplate.opsForValue().increment(totalKey);
        }
    }

    private void processRewards(InteractionPoint point, AnswerRequest request, User user) {
        if (user == null) return;
        
        if (isCorrectAnswer(point, request.getChoiceId())) {
            addPoints(user, 10);
        }

        if (point.getInteractionType() == InteractionPoint.InteractionType.EGG) {
            collectEgg(user.getId(), request.getInteractionId(), point.getQuestionText());
            addPoints(user, 5);
        }
    }

    private boolean isCorrectAnswer(InteractionPoint point, Long choiceId) {
        return point.getOptions().stream()
                .anyMatch(o -> o.getId().equals(choiceId) && Boolean.TRUE.equals(o.getIsCorrect()));
    }

    private void addPoints(User user, int points) {
        userRepository.addPoints(user.getId(), points);
    }

    private void collectEgg(Long userId, Long interactionId, String eggContent) {
        UserEgg egg = new UserEgg();
        egg.setUserId(userId);
        egg.setInteractionId(interactionId);
        egg.setEggContent(eggContent);
        userEggRepository.save(egg);
    }

    private void updateEmojiStats(InteractionPoint point, String emojiReaction, Boolean isSend) {
        try {
            Map<String, Integer> reactions = new HashMap<>();
            if (point.getEmojiReactions() != null && !point.getEmojiReactions().isEmpty()) {
                ObjectMapper mapper = new ObjectMapper();
                reactions = mapper.readValue(point.getEmojiReactions(), new TypeReference<Map<String, Integer>>() {});
            }
            reactions.merge(emojiReaction, 1, Integer::sum);
            point.setEmojiReactions(new ObjectMapper().writeValueAsString(reactions));
            interactionPointRepository.save(point);
        } catch (Exception e) {
            // Don't fail the answer submission if emoji stats update fails
        }
    }

    public InteractionStats getStats(Long interactionId) {
        if (redisTemplate != null) {
            InteractionStats stats = getStatsFromRedis(interactionId);
            if (stats != null) return stats;
        }
        return getStatsFromDatabase(interactionId);
    }

    private InteractionStats getStatsFromRedis(Long interactionId) {
        String countKey = "interaction:count:" + interactionId;
        String totalKey = "interaction:total:" + interactionId;

        Map<Object, Object> counts = redisTemplate.opsForHash().entries(countKey);
        String totalStr = redisTemplate.opsForValue().get(totalKey);
        long total = totalStr != null ? Long.parseLong(totalStr) : 0;

        if (total <= 0) return null;

        InteractionStats stats = new InteractionStats();
        stats.setInteractionId(interactionId);
        stats.setTotalParticipants(total);
        stats.setOptionStats(buildOptionStatsFromRedis(counts, total));
        return stats;
    }

    private Map<Long, InteractionStats.OptionStats> buildOptionStatsFromRedis(Map<Object, Object> counts, long total) {
        Map<Long, InteractionStats.OptionStats> optionStats = new HashMap<>();
        for (Map.Entry<Object, Object> e : counts.entrySet()) {
            long count = Long.parseLong(e.getValue().toString());
            InteractionStats.OptionStats os = new InteractionStats.OptionStats();
            os.setCount(count);
            os.setPercentage(Math.round(count * 100.0 / total * 10.0) / 10.0);
            optionStats.put(Long.parseLong(e.getKey().toString()), os);
        }
        return optionStats;
    }

    private InteractionStats getStatsFromDatabase(Long interactionId) {
        List<Object[]> dbCounts = statsRepository.findCountsByInteractionId(interactionId);
        Long totalObj = statsRepository.sumCountsByInteractionId(interactionId);
        long total = totalObj != null ? totalObj : 0L;

        InteractionStats stats = new InteractionStats();
        stats.setInteractionId(interactionId);
        stats.setTotalParticipants(total);
        stats.setOptionStats(buildOptionStatsFromDatabase(dbCounts, total));
        return stats;
    }

    private Map<Long, InteractionStats.OptionStats> buildOptionStatsFromDatabase(List<Object[]> dbCounts, long total) {
        Map<Long, Long> dbMap = new HashMap<>();
        for (Object[] row : dbCounts) {
            dbMap.put((Long) row[0], (Long) row[1]);
        }

        Map<Long, InteractionStats.OptionStats> optionStats = new HashMap<>();
        for (Map.Entry<Long, Long> e : dbMap.entrySet()) {
            InteractionStats.OptionStats os = new InteractionStats.OptionStats();
            os.setCount(e.getValue());
            os.setPercentage(total > 0 ? Math.round(e.getValue() * 100.0 / total * 10.0) / 10.0 : 0);
            optionStats.put(e.getKey(), os);
        }
        return optionStats;
    }

    public Map<String, Object> getOverviewStats() {
        Map<String, Object> stats = new HashMap<>();
        long totalInteractions = answerRepository.count();
        long totalUsers = userRepository.count();
        stats.put("totalInteractions", totalInteractions);
        stats.put("participationRate", totalUsers > 0 ? Math.round(totalInteractions * 100.0 / totalUsers * 10.0) / 10.0 : 0);

        List<Object[]> typeCounts = interactionPointRepository.countByType();
        Map<String, Long> typeDist = new HashMap<>();
        for (Object[] row : typeCounts) {
            typeDist.put(row[0].toString(), (Long) row[1]);
        }
        stats.put("typeDistribution", typeDist);

        List<Object[]> topInteractions = answerRepository.findTop5Interactions(
                org.springframework.data.domain.PageRequest.of(0, 5));
        stats.put("topInteractions", topInteractions);

        return stats;
    }

    public Map<String, Object> getDramaStats(Long dramaId) {
        Map<String, Object> stats = new HashMap<>();
        List<InteractionPoint> points = interactionPointRepository.findByEpisodeDramaId(dramaId);
        stats.put("totalInteractionPoints", points.size());
        stats.put("typeDistribution", points.stream().collect(
                Collectors.groupingBy(p -> p.getInteractionType().name(), Collectors.counting())
        ));
        return stats;
    }
}
