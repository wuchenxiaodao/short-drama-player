package com.drama.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AnswerRequest {
    @NotNull(message = "互动ID不能为空")
    private Long interactionId;
    @NotNull(message = "选项不能为空")
    private Long choiceId;
}
