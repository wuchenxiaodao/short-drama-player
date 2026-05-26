package com.drama.dto;

import lombok.Data;

@Data
public class AnswerRequest {
    private Long userId;
    private Long interactionId;
    private Long choiceId;
}
