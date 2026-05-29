package com.drama.dto;

import lombok.Data;

@Data
public class CommentRequest {
    private Long interactionId;
    private String content;
    private Long parentCommentId;
}
