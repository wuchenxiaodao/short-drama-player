package com.drama.service;

import com.drama.common.BusinessException;
import com.drama.dto.CommentRequest;
import com.drama.dto.CommentResponse;
import com.drama.factory.TestDataFactory;
import com.drama.model.Comment;
import com.drama.model.CommentLike;
import com.drama.model.User;
import com.drama.repository.CommentLikeRepository;
import com.drama.repository.CommentRepository;
import com.drama.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private CommentLikeRepository commentLikeRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CommentService commentService;

    private Comment testComment;
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = TestDataFactory.createUser(1L, "testuser");
        testComment = TestDataFactory.createComment(1L, 1L, 100L);
        testComment.setDramaId(10L);
    }

    @Test
    void testGetCommentsByDrama() {
        Page<Comment> commentPage = new PageImpl<>(List.of(testComment));
        when(commentRepository.findByDramaIdAndParentCommentIdIsNullOrderByCreatedAtDesc(eq(10L), any(PageRequest.class)))
                .thenReturn(commentPage);

        List<Object[]> replyCounts = new ArrayList<>();
        replyCounts.add(new Object[]{1L, 2L});
        when(commentRepository.countRepliesByParentIds(anyList())).thenReturn(replyCounts);

        when(userRepository.findAllById(anyList())).thenReturn(List.of(testUser));

        try (var mocked = mockStatic(com.drama.common.AuthUtils.class)) {
            mocked.when(com.drama.common.AuthUtils::getCurrentUserId).thenReturn(1L);
            when(commentLikeRepository.findByUserIdAndCommentIdIn(eq(1L), anyList())).thenReturn(List.of());

            CommentResponse.PageResult result = commentService.getDramaComments(10L, "latest", 0, 10);

            assertNotNull(result);
            assertEquals(1, result.getComments().size());
            assertEquals("测试评论内容", result.getComments().get(0).getContent());
            verify(commentRepository).findByDramaIdAndParentCommentIdIsNullOrderByCreatedAtDesc(eq(10L), any(PageRequest.class));
        }
    }

    @Test
    void testGetCommentsByDrama_HotSort() {
        Page<Comment> commentPage = new PageImpl<>(List.of(testComment));
        when(commentRepository.findByDramaIdAndParentCommentIdIsNullOrderByLikeCountDescCreatedAtDesc(eq(10L), any(PageRequest.class)))
                .thenReturn(commentPage);

        when(commentRepository.countRepliesByParentIds(anyList())).thenReturn(List.of());
        when(userRepository.findAllById(anyList())).thenReturn(List.of(testUser));

        try (var mocked = mockStatic(com.drama.common.AuthUtils.class)) {
            mocked.when(com.drama.common.AuthUtils::getCurrentUserId).thenReturn(null);

            CommentResponse.PageResult result = commentService.getDramaComments(10L, "hot", 0, 10);

            assertNotNull(result);
            verify(commentRepository).findByDramaIdAndParentCommentIdIsNullOrderByLikeCountDescCreatedAtDesc(eq(10L), any(PageRequest.class));
        }
    }

    @Test
    void testGetCommentsByDrama_EmptyResult() {
        Page<Comment> emptyPage = new PageImpl<>(List.of());
        when(commentRepository.findByDramaIdAndParentCommentIdIsNullOrderByCreatedAtDesc(eq(999L), any(PageRequest.class)))
                .thenReturn(emptyPage);

        try (var mocked = mockStatic(com.drama.common.AuthUtils.class)) {
            mocked.when(com.drama.common.AuthUtils::getCurrentUserId).thenReturn(null);

            CommentResponse.PageResult result = commentService.getDramaComments(999L, "latest", 0, 10);

            assertNotNull(result);
            assertEquals(0, result.getComments().size());
            assertEquals(0, result.getTotal());
        }
    }

    @Test
    void testPostComment() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
            Comment c = invocation.getArgument(0);
            c.setId(1L);
            return c;
        });

        CommentRequest request = new CommentRequest();
        request.setDramaId(10L);
        request.setContent("这是一条新评论");
        request.setParentCommentId(null);

        CommentResponse result = commentService.postComment(request, 1L);

        assertNotNull(result);
        assertEquals("这是一条新评论", result.getContent());
        assertEquals(1L, result.getUserId());
        assertEquals("testuser的昵称", result.getNickname());
        verify(commentRepository).save(any(Comment.class));
    }

    @Test
    void testPostComment_UserNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        CommentRequest request = new CommentRequest();
        request.setDramaId(10L);
        request.setContent("评论内容");

        assertThrows(BusinessException.class, () -> commentService.postComment(request, 999L));
    }

    @Test
    void testToggleCommentLike_Like() {
        when(commentLikeRepository.findByUserIdAndCommentId(1L, 1L)).thenReturn(Optional.empty());
        when(commentLikeRepository.save(any(CommentLike.class))).thenAnswer(invocation -> {
            CommentLike like = invocation.getArgument(0);
            like.setId(1L);
            return like;
        });

        boolean result = commentService.toggleLike(1L, 1L);

        assertTrue(result);
        verify(commentLikeRepository).save(any(CommentLike.class));
        verify(commentRepository).incrementLikeCount(1L);
    }

    @Test
    void testToggleCommentLike_Unlike() {
        CommentLike existingLike = new CommentLike();
        existingLike.setId(1L);
        existingLike.setUserId(1L);
        existingLike.setCommentId(1L);

        when(commentLikeRepository.findByUserIdAndCommentId(1L, 1L)).thenReturn(Optional.of(existingLike));

        boolean result = commentService.toggleLike(1L, 1L);

        assertFalse(result);
        verify(commentLikeRepository).delete(existingLike);
        verify(commentRepository).decrementLikeCount(1L);
    }

    @Test
    void testGetReplies() {
        Comment reply = new Comment();
        reply.setId(2L);
        reply.setUserId(1L);
        reply.setParentCommentId(1L);
        reply.setContent("这是一条回复");
        reply.setLikeCount(0L);
        reply.setCreatedAt(java.time.LocalDateTime.now());

        when(commentRepository.findByParentCommentIdOrderByCreatedAtAsc(1L)).thenReturn(List.of(reply));
        when(userRepository.findAllById(anyList())).thenReturn(List.of(testUser));
        when(commentLikeRepository.findByUserIdAndCommentIdIn(eq(1L), anyList())).thenReturn(List.of());

        List<CommentResponse> result = commentService.getReplies(1L, 1L);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("这是一条回复", result.get(0).getContent());
        verify(commentRepository).findByParentCommentIdOrderByCreatedAtAsc(1L);
    }

    @Test
    void testGetReplies_EmptyResult() {
        when(commentRepository.findByParentCommentIdOrderByCreatedAtAsc(999L)).thenReturn(List.of());

        List<CommentResponse> result = commentService.getReplies(999L, 1L);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetDramaCommentCount() {
        when(commentRepository.countByDramaId(10L)).thenReturn(5L);

        long count = commentService.getDramaCommentCount(10L);

        assertEquals(5L, count);
        verify(commentRepository).countByDramaId(10L);
    }
}
