package com.drama.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class OnlineService {

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    private static final String KEY_PREFIX = "online:episode:";
    private static final long HEARTBEAT_TTL_MS = 30_000;

    private final Map<Long, Map<Long, Long>> localOnline = new ConcurrentHashMap<>();
    private final ScheduledExecutorService cleaner = Executors.newSingleThreadScheduledExecutor();

    public OnlineService() {
        cleaner.scheduleAtFixedRate(this::cleanLocal, 10, 10, TimeUnit.SECONDS);
    }

    public void heartbeat(Long userId, Long episodeId) {
        if (redisTemplate != null) {
            String key = KEY_PREFIX + episodeId;
            redisTemplate.opsForSet().add(key, String.valueOf(userId));
            redisTemplate.expire(key, 30, TimeUnit.SECONDS);
        } else {
            localOnline.computeIfAbsent(episodeId, k -> new ConcurrentHashMap<>()).put(userId, System.currentTimeMillis());
        }
    }

    public long getOnlineCount(Long episodeId) {
        if (redisTemplate != null) {
            String key = KEY_PREFIX + episodeId;
            Long count = redisTemplate.opsForSet().size(key);
            return count != null ? count : 0;
        } else {
            Map<Long, Long> users = localOnline.get(episodeId);
            return users != null ? users.size() : 0;
        }
    }

    public Set<String> getOnlineUsers(Long episodeId) {
        if (redisTemplate != null) {
            String key = KEY_PREFIX + episodeId;
            return redisTemplate.opsForSet().members(key);
        } else {
            Map<Long, Long> users = localOnline.get(episodeId);
            if (users == null) return Collections.emptySet();
            Set<String> result = new HashSet<>();
            long now = System.currentTimeMillis();
            users.forEach((uid, ts) -> { if (now - ts < HEARTBEAT_TTL_MS) result.add(String.valueOf(uid)); });
            return result;
        }
    }

    private void cleanLocal() {
        long now = System.currentTimeMillis();
        localOnline.forEach((epId, users) -> users.values().removeIf(ts -> now - ts > HEARTBEAT_TTL_MS));
    }
}
