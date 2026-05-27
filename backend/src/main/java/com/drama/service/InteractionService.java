package com.drama.service;

import com.drama.dto.AnswerRequest;
import com.drama.dto.InteractionStats;
import com.drama.model.InteractionAnswer;
import com.drama.model.InteractionPoint;
import com.drama.model.User;
import com.drama.model.UserEgg;
import com.drama.repository.InteractionAnswerRepository;
import com.drama.repository.InteractionPointRepository;
import com.drama.repository.UserEggRepository;
import com.drama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class InteractionService {

    private final InteractionPointRepository interactionPointRepository;
    private final InteractionAnswerRepository answerRepository;
    private final UserRepository userRepository;
    private final UserEggRepository userEggRepository;

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    @Transactional
    public boolean submitAnswer(AnswerRequest request) {
        if (isAlreadyAnswered(request.getUserId(), request.getInteractionId())) {
            return false;
        }

        InteractionPoint point = getInteractionPoint(request.getInteractionId());
        User user = getUser(request.getUserId());

        saveAnswer(request, point);
        updateRedisStats(request);
        processRewards(point, request, user);

        return true;
    }

    private boolean isAlreadyAnswered(Long userId, Long interactionId) {
        return answerRepository.findByUserIdAndInteractionPointId(userId, interactionId).isPresent();
    }

    private InteractionPoint getInteractionPoint(Long interactionId) {
        return interactionPointRepository.findById(interactionId)
                .orElseThrow(() -> new RuntimeException("Interaction not found"));
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private void saveAnswer(AnswerRequest request, InteractionPoint point) {
        InteractionAnswer answer = new InteractionAnswer();
        answer.setUserId(request.getUserId());
        answer.setInteractionPoint(point);
        answer.setSelectedOptionId(request.getChoiceId());
        answerRepository.save(answer);
    }

    private void updateRedisStats(AnswerRequest request) {
        if (redisTemplate == null) return;

        String redisKey = "interaction:count:" + request.getInteractionId();
        redisTemplate.opsForHash().increment(redisKey, String.valueOf(request.getChoiceId()), 1);
        redisTemplate.expire(redisKey, 24, TimeUnit.HOURS);

        String totalKey = "interaction:total:" + request.getInteractionId();
        redisTemplate.opsForValue().increment(totalKey);
        redisTemplate.expire(totalKey, 24, TimeUnit.HOURS);
    }

    private void processRewards(InteractionPoint point, AnswerRequest request, User user) {
        if (isCorrectAnswer(point, request.getChoiceId())) {
            addPoints(user, 10);
        }

        if (point.getInteractionType() == InteractionPoint.InteractionType.EGG) {
            collectEgg(request.getUserId(), request.getInteractionId(), point.getQuestionText());
            addPoints(user, 5);
        }
    }

    private boolean isCorrectAnswer(InteractionPoint point, Long choiceId) {
        return point.getCorrectOptionId() != null && point.getCorrectOptionId().equals(choiceId);
    }

    private void addPoints(User user, int points) {
        user.setPoints(user.getPoints() + points);
        userRepository.save(user);
    }

    private void collectEgg(Long userId, Long interactionId, String eggContent) {
        UserEgg egg = new UserEgg();
        egg.setUserId(userId);
        egg.setInteractionId(interactionId);
        egg.setEggContent(eggContent);
        userEggRepository.save(egg);
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
        List<Object[]> dbCounts = answerRepository.countByOption(interactionId);
        long total = answerRepository.countByInteractionPointId(interactionId);

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
}
