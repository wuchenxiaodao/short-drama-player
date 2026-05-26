package com.drama.service;

import com.drama.dto.CommentRequest;
import com.drama.dto.CommentResponse;
import com.drama.model.Comment;
import com.drama.model.CommentLike;
import com.drama.model.User;
import com.drama.repository.CommentLikeRepository;
import com.drama.repository.CommentRepository;
import com.drama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final UserRepository userRepository;

    public CommentResponse.PageResult getComments(Long interactionId, String sort, int page, int size) {
        Page<Comment> commentPage;
        if ("latest".equals(sort)) {
            commentPage = commentRepository
                    .findByInteractionIdAndParentCommentIdIsNullOrderByCreatedAtDesc(interactionId, null, PageRequest.of(page, size));
        } else {
            commentPage = commentRepository
                    .findByInteractionIdAndParentCommentIdIsNullOrderByLikeCountDescCreatedAtDesc(interactionId, null, PageRequest.of(page, size));
        }

        List<Comment> comments = commentPage.getContent();
        List<Long> commentIds = comments.stream().map(Comment::getId).collect(Collectors.toList());

        // Batch load replies count
        Map<Long, Long> replyCountMap = comments.stream().collect(Collectors.toMap(
                Comment::getId,
                c -> commentRepository.countByInteractionId(interactionId) // simplified
        ));

        List<CommentResponse> responses = comments.stream().map(c -> toResponse(c, null)).collect(Collectors.toList());

        CommentResponse.PageResult result = new CommentResponse.PageResult();
        result.setComments(responses);
        result.setTotal(commentPage.getTotalElements());
        result.setPage(page);
        return result;
    }

    public List<CommentResponse> getReplies(Long parentCommentId, Long userId) {
        List<Comment> replies = commentRepository.findByParentCommentIdOrderByCreatedAtAsc(parentCommentId);
        return replies.stream().map(r -> toResponse(r, userId)).collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse postComment(CommentRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Comment comment = new Comment();
        comment.setUserId(request.getUserId());
        comment.setInteractionId(request.getInteractionId());
        comment.setContent(request.getContent());
        comment.setParentCommentId(request.getParentCommentId());
        commentRepository.save(comment);

        return toResponse(comment, request.getUserId());
    }

    @Transactional
    public boolean toggleLike(Long userId, Long commentId) {
        var existing = commentLikeRepository.findByUserIdAndCommentId(userId, commentId);
        if (existing.isPresent()) {
            commentLikeRepository.delete(existing.get());
            Comment comment = commentRepository.findById(commentId).orElse(null);
            if (comment != null) {
                comment.setLikeCount(Math.max(0, comment.getLikeCount() - 1));
                commentRepository.save(comment);
            }
            return false;
        } else {
            CommentLike like = new CommentLike();
            like.setUserId(userId);
            like.setCommentId(commentId);
            commentLikeRepository.save(like);
            Comment comment = commentRepository.findById(commentId).orElse(null);
            if (comment != null) {
                comment.setLikeCount(comment.getLikeCount() + 1);
                commentRepository.save(comment);
            }
            return true;
        }
    }

    public long getCommentCount(Long interactionId) {
        return commentRepository.countByInteractionId(interactionId);
    }

    private CommentResponse toResponse(Comment comment, Long currentUserId) {
        CommentResponse resp = new CommentResponse();
        resp.setId(comment.getId());
        resp.setUserId(comment.getUserId());
        resp.setContent(comment.getContent());
        resp.setLikeCount(comment.getLikeCount());
        resp.setCreatedAt(comment.getCreatedAt());

        userRepository.findById(comment.getUserId()).ifPresent(user -> resp.setNickname(user.getNickname()));

        if (currentUserId != null) {
            resp.setIsLiked(commentLikeRepository.findByUserIdAndCommentId(currentUserId, comment.getId()).isPresent());
        } else {
            resp.setIsLiked(false);
        }

        return resp;
    }
}
