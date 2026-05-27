package com.drama.service;

import com.drama.dto.AnswerRequest;
import com.drama.dto.InteractionStats;
import com.drama.factory.TestDataFactory;
import com.drama.model.*;
import com.drama.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InteractionServiceTest {

    @Mock
    private InteractionPointRepository interactionPointRepository;

    @Mock
    private InteractionAnswerRepository answerRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserEggRepository userEggRepository;

    @InjectMocks
    private InteractionService interactionService;

    private User testUser;
    private Drama testDrama;
    private Episode testEpisode;
    private InteractionPoint testPoint;
    private AnswerRequest testRequest;

    @BeforeEach
    void setUp() {
        testUser = TestDataFactory.createUser(1L, "testuser");
        testDrama = TestDataFactory.createDrama(1L, "测试短剧");
        testEpisode = TestDataFactory.createEpisode(1L, testDrama, 1);
        testPoint = TestDataFactory.createInteractionPoint(1L, testEpisode, 30);

        testRequest = new AnswerRequest();
        testRequest.setUserId(1L);
        testRequest.setInteractionId(1L);
        testRequest.setChoiceId(1L);
    }

    @Test
    void submitAnswer_WhenNotAlreadyAnswered_ShouldSaveAnswer() {
        // Arrange
        when(answerRepository.findByUserIdAndInteractionPointId(1L, 1L)).thenReturn(Optional.empty());
        when(interactionPointRepository.findById(1L)).thenReturn(Optional.of(testPoint));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // Act
        boolean result = interactionService.submitAnswer(testRequest);

        // Assert
        assertTrue(result);
        verify(answerRepository).save(any(InteractionAnswer.class));
    }

    @Test
    void submitAnswer_WhenAlreadyAnswered_ShouldReturnFalse() {
        // Arrange
        InteractionAnswer existingAnswer = new InteractionAnswer();
        when(answerRepository.findByUserIdAndInteractionPointId(1L, 1L)).thenReturn(Optional.of(existingAnswer));

        // Act
        boolean result = interactionService.submitAnswer(testRequest);

        // Assert
        assertFalse(result);
        verify(answerRepository, never()).save(any());
    }

    @Test
    void submitAnswer_WhenInteractionNotExists_ShouldThrowException() {
        // Arrange
        when(answerRepository.findByUserIdAndInteractionPointId(1L, 1L)).thenReturn(Optional.empty());
        when(interactionPointRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            interactionService.submitAnswer(testRequest);
        });
    }

    @Test
    void submitAnswer_WhenUserNotExists_ShouldThrowException() {
        // Arrange
        when(answerRepository.findByUserIdAndInteractionPointId(1L, 1L)).thenReturn(Optional.empty());
        when(interactionPointRepository.findById(1L)).thenReturn(Optional.of(testPoint));
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            interactionService.submitAnswer(testRequest);
        });
    }

    @Test
    void getStats_ShouldReturnStats() {
        // Arrange
        Object[] row = {1L, 50L};
        when(answerRepository.countByOption(1L)).thenReturn(Arrays.asList(row));
        when(answerRepository.countByInteractionPointId(1L)).thenReturn(100L);

        // Act
        InteractionStats result = interactionService.getStats(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getInteractionId());
        assertEquals(100L, result.getTotalParticipants());
        verify(answerRepository).countByOption(1L);
        verify(answerRepository).countByInteractionPointId(1L);
    }
}
