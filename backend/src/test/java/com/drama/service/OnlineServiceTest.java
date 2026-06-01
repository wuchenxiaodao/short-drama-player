package com.drama.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OnlineServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ZSetOperations<String, String> zSetOps;

    @InjectMocks
    private OnlineService onlineService;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForZSet()).thenReturn(zSetOps);
    }

    @Test
    void testHeartbeat_WithRedis() {
        when(redisTemplate.opsForZSet()).thenReturn(zSetOps);

        onlineService.heartbeat(1L, 100L);

        verify(zSetOps).add(startsWith("online:episode:"), eq("1"), anyDouble());
        verify(zSetOps).removeRangeByScore(startsWith("online:episode:"), anyDouble(), anyDouble());
    }

    @Test
    void testHeartbeat_WithoutRedis() {
        OnlineService localService = new OnlineService();

        localService.heartbeat(1L, 100L);

        long count = localService.getOnlineCount(100L);
        assertEquals(1, count);
    }

    @Test
    void testGetOnlineCount_WithRedis() {
        when(redisTemplate.opsForZSet()).thenReturn(zSetOps);
        when(zSetOps.zCard("online:episode:100")).thenReturn(5L);

        long count = onlineService.getOnlineCount(100L);

        assertEquals(5, count);
        verify(zSetOps).removeRangeByScore(eq("online:episode:100"), anyDouble(), anyDouble());
        verify(zSetOps).zCard("online:episode:100");
    }

    @Test
    void testGetOnlineCount_WithRedis_NullCount() {
        when(redisTemplate.opsForZSet()).thenReturn(zSetOps);
        when(zSetOps.zCard("online:episode:100")).thenReturn(null);

        long count = onlineService.getOnlineCount(100L);

        assertEquals(0, count);
    }

    @Test
    void testGetOnlineCount_WithoutRedis() {
        OnlineService localService = new OnlineService();

        localService.heartbeat(1L, 100L);
        localService.heartbeat(2L, 100L);
        localService.heartbeat(3L, 200L);

        assertEquals(2, localService.getOnlineCount(100L));
        assertEquals(1, localService.getOnlineCount(200L));
        assertEquals(0, localService.getOnlineCount(999L));
    }

    @Test
    void testGetOnlineCount_WithoutRedis_MultipleHeartbeatsSameUser() {
        OnlineService localService = new OnlineService();

        localService.heartbeat(1L, 100L);
        localService.heartbeat(1L, 100L);

        assertEquals(1, localService.getOnlineCount(100L));
    }
}
