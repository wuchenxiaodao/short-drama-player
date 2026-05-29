package com.drama.service;

import com.drama.common.AuthUtils;
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

import java.util.*;
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
        if (comments.isEmpty()) {
            CommentResponse.PageResult result = new CommentResponse.PageResult();
            result.setComments(List.of());
            result.setTotal(0);
            result.setPage(page);
            return result;
        }

        List<Long> commentIds = comments.stream().map(Comment::getId).collect(Collectors.toList());

        Map<Long, Long> replyCountMap = new HashMap<>();
        List<Object[]> replyCounts = commentRepository.countRepliesByParentIds(commentIds);
        for (Object[] row : replyCounts) {
            replyCountMap.put((Long) row[0], (Long) row[1]);
        }

        List<Long> userIds = comments.stream().map(Comment::getUserId).distinct().collect(Collectors.toList());
        Map<Long, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        Long currentUserId = AuthUtils.getCurrentUserId();
        Set<Long> likedCommentIds = Set.of();
        if (currentUserId != null) {
            List<CommentLike> likes = commentLikeRepository.findByUserIdAndCommentIdIn(currentUserId, commentIds);
            likedCommentIds = likes.stream().map(CommentLike::getCommentId).collect(Collectors.toSet());
        }

        Set<Long> finalLiked = likedCommentIds;
        Map<Long, Long> finalReplyMap = replyCountMap;
        List<CommentResponse> responses = comments.stream()
                .map(c -> toResponse(c, userMap.get(c.getUserId()), finalLiked.contains(c.getId()), finalReplyMap.getOrDefault(c.getId(), 0L)))
                .collect(Collectors.toList());

        CommentResponse.PageResult result = new CommentResponse.PageResult();
        result.setComments(responses);
        result.setTotal(commentPage.getTotalElements());
        result.setPage(page);
        return result;
    }

    public List<CommentResponse> getReplies(Long parentCommentId, Long userId) {
        List<Comment> replies = commentRepository.findByParentCommentIdOrderByCreatedAtAsc(parentCommentId);
        if (replies.isEmpty()) return List.of();

        List<Long> userIds = replies.stream().map(Comment::getUserId).distinct().collect(Collectors.toList());
        Map<Long, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        Set<Long> likedCommentIds = Set.of();
        if (userId != null) {
            List<Long> commentIds = replies.stream().map(Comment::getId).collect(Collectors.toList());
            List<CommentLike> likes = commentLikeRepository.findByUserIdAndCommentIdIn(userId, commentIds);
            likedCommentIds = likes.stream().map(CommentLike::getCommentId).collect(Collectors.toSet());
        }

        Set<Long> finalLiked = likedCommentIds;
        return replies.stream()
                .map(r -> toResponse(r, userMap.get(r.getUserId()), finalLiked.contains(r.getId()), 0L))
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse postComment(CommentRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new com.drama.common.BusinessException(404, "用户不存在"));

        Comment comment = new Comment();
        comment.setUserId(userId);
        comment.setInteractionId(request.getInteractionId());
        comment.setContent(request.getContent());
        comment.setParentCommentId(request.getParentCommentId());
        commentRepository.save(comment);

        return toResponse(comment, user, false, 0L);
    }

    @Transactional
    public boolean toggleLike(Long userId, Long commentId) {
        var existing = commentLikeRepository.findByUserIdAndCommentId(userId, commentId);
        if (existing.isPresent()) {
            commentLikeRepository.delete(existing.get());
            commentRepository.decrementLikeCount(commentId);
            return false;
        } else {
            CommentLike like = new CommentLike();
            like.setUserId(userId);
            like.setCommentId(commentId);
            commentLikeRepository.save(like);
            commentRepository.incrementLikeCount(commentId);
            return true;
        }
    }

    public long getCommentCount(Long interactionId) {
        return commentRepository.countByInteractionId(interactionId);
    }

    private CommentResponse toResponse(Comment comment, User author, boolean isLiked, long replyCount) {
        CommentResponse resp = new CommentResponse();
        resp.setId(comment.getId());
        resp.setUserId(comment.getUserId());
        resp.setContent(comment.getContent());
        resp.setLikeCount(comment.getLikeCount());
        resp.setCreatedAt(comment.getCreatedAt());
        resp.setNickname(author != null ? author.getNickname() : "未知用户");
        resp.setIsLiked(isLiked);
        return resp;
    }
}
