package com.drama.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CommentResponse {
    private Long id;
    private Long userId;
    private String nickname;
    private String content;
    private Long likeCount;
    private Boolean isLiked;
    private LocalDateTime createdAt;
    private List<CommentResponse> replies;

    @Data
    public static class PageResult {
        private List<CommentResponse> comments;
        private long total;
        private int page;
    }
}
