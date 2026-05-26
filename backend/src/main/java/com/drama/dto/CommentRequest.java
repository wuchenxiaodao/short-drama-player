package com.drama.dto;

import lombok.Data;

@Data
public class CommentRequest {
    private Long userId;
    private Long interactionId;
    private String content;
    private Long parentCommentId;
}
