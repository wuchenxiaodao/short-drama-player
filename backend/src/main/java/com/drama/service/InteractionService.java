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
        boolean alreadyAnswered = answerRepository
                .findByUserIdAndInteractionPointId(request.getUserId(), request.getInteractionId())
                .isPresent();
        if (alreadyAnswered) return false;

        InteractionPoint point = interactionPointRepository.findById(request.getInteractionId())
                .orElseThrow(() -> new RuntimeException("Interaction not found"));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        InteractionAnswer answer = new InteractionAnswer();
        answer.setUserId(request.getUserId());
        answer.setInteractionPoint(point);
        answer.setSelectedOptionId(request.getChoiceId());
        answerRepository.save(answer);

        if (redisTemplate != null) {
            String redisKey = "interaction:count:" + request.getInteractionId();
            redisTemplate.opsForHash().increment(redisKey, String.valueOf(request.getChoiceId()), 1);
            redisTemplate.expire(redisKey, 24, TimeUnit.HOURS);

            String totalKey = "interaction:total:" + request.getInteractionId();
            redisTemplate.opsForValue().increment(totalKey);
            redisTemplate.expire(totalKey, 24, TimeUnit.HOURS);
        }

        if (point.getCorrectOptionId() != null && point.getCorrectOptionId().equals(request.getChoiceId())) {
            user.setPoints(user.getPoints() + 10);
            userRepository.save(user);
        }

        // Collect egg for EGG type interactions
        if (point.getInteractionType() == InteractionPoint.InteractionType.EGG) {
            UserEgg egg = new UserEgg();
            egg.setUserId(request.getUserId());
            egg.setInteractionId(request.getInteractionId());
            egg.setEggContent(point.getQuestionText());
            userEggRepository.save(egg);
            user.setPoints(user.getPoints() + 5);
            userRepository.save(user);
        }

        return true;
    }

    public InteractionStats getStats(Long interactionId) {
        if (redisTemplate != null) {
            String countKey = "interaction:count:" + interactionId;
            String totalKey = "interaction:total:" + interactionId;

            Map<Object, Object> counts = redisTemplate.opsForHash().entries(countKey);
            String totalStr = redisTemplate.opsForValue().get(totalKey);
            long total = totalStr != null ? Long.parseLong(totalStr) : 0;

            if (total > 0) {
                InteractionStats stats = new InteractionStats();
                stats.setInteractionId(interactionId);
                stats.setTotalParticipants(total);
                Map<Long, InteractionStats.OptionStats> optionStats = new HashMap<>();
                for (Map.Entry<Object, Object> e : counts.entrySet()) {
                    long count = Long.parseLong(e.getValue().toString());
                    InteractionStats.OptionStats os = new InteractionStats.OptionStats();
                    os.setCount(count);
                    os.setPercentage(Math.round(count * 100.0 / total * 10.0) / 10.0);
                    optionStats.put(Long.parseLong(e.getKey().toString()), os);
                }
                stats.setOptionStats(optionStats);
                return stats;
            }
        }

        // Fallback to database
        List<Object[]> dbCounts = answerRepository.countByOption(interactionId);
        long total = answerRepository.countByInteractionPointId(interactionId);
        Map<Long, Long> dbMap = new HashMap<>();
        for (Object[] row : dbCounts) {
            dbMap.put((Long) row[0], (Long) row[1]);
        }
        InteractionStats stats = new InteractionStats();
        stats.setInteractionId(interactionId);
        stats.setTotalParticipants(total);
        Map<Long, InteractionStats.OptionStats> optionStats = new HashMap<>();
        for (Map.Entry<Long, Long> e : dbMap.entrySet()) {
            InteractionStats.OptionStats os = new InteractionStats.OptionStats();
            os.setCount(e.getValue());
            os.setPercentage(total > 0 ? Math.round(e.getValue() * 100.0 / total * 10.0) / 10.0 : 0);
            optionStats.put(e.getKey(), os);
        }
        stats.setOptionStats(optionStats);
        return stats;
    }
}
