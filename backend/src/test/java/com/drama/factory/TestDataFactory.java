package com.drama.factory;

import com.drama.model.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class TestDataFactory {

    public static Drama createDrama(Long id, String title) {
        Drama drama = new Drama();
        drama.setId(id);
        drama.setTitle(title);
        drama.setDescription("测试短剧描述");
        drama.setCoverUrl("/images/test.jpg");
        drama.setCategory("甜宠");
        drama.setTotalEpisodes(10);
        drama.setRating(8.5);
        drama.setViewCount(1000L);
        drama.setIsNew(true);
        drama.setIsHot(false);
        drama.setCreatedAt(LocalDateTime.now());
        drama.setUpdatedAt(LocalDateTime.now());
        return drama;
    }

    public static Episode createEpisode(Long id, Drama drama, int episodeNumber) {
        Episode episode = new Episode();
        episode.setId(id);
        episode.setDrama(drama);
        episode.setEpisodeNumber(episodeNumber);
        episode.setTitle("第" + episodeNumber + "集");
        episode.setVideoUrl("/videos/test.mp4");
        episode.setDurationSeconds(180);
        episode.setCreatedAt(LocalDateTime.now());
        return episode;
    }

    public static User createUser(Long id, String username) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setPassword("password123");
        user.setNickname(username + "的昵称");
        user.setAvatarUrl("/avatars/default.jpg");
        user.setPoints(100);
        user.setCreatedAt(LocalDateTime.now());
        return user;
    }

    public static InteractionPoint createInteractionPoint(Long id, Episode episode, long timestampMs) {
        InteractionPoint point = new InteractionPoint();
        point.setId(id);
        point.setEpisode(episode);
        point.setTimestampMs(timestampMs);
        point.setInteractionType(InteractionPoint.InteractionType.VOTE);
        point.setQuestionText("测试问题？");
        point.setOptions(new ArrayList<>());

        InteractionOption optA = new InteractionOption();
        optA.setId(1L);
        optA.setInteractionPoint(point);
        optA.setOptionIndex(1);
        optA.setOptionText("选项A");
        optA.setIsCorrect(true);
        point.getOptions().add(optA);

        InteractionOption optB = new InteractionOption();
        optB.setId(2L);
        optB.setInteractionPoint(point);
        optB.setOptionIndex(2);
        optB.setOptionText("选项B");
        optB.setIsCorrect(false);
        point.getOptions().add(optB);

        InteractionOption optC = new InteractionOption();
        optC.setId(3L);
        optC.setInteractionPoint(point);
        optC.setOptionIndex(3);
        optC.setOptionText("选项C");
        optC.setIsCorrect(false);
        point.getOptions().add(optC);

        return point;
    }

    public static Comment createComment(Long id, Long userId, Long interactionId) {
        Comment comment = new Comment();
        comment.setId(id);
        comment.setUserId(userId);
        comment.setInteractionId(interactionId);
        comment.setContent("测试评论内容");
        comment.setCreatedAt(LocalDateTime.now());
        comment.setLikeCount(0L);
        return comment;
    }

    public static Rating createRating(Long id, Long userId, Long dramaId) {
        Rating rating = new Rating();
        rating.setId(id);
        rating.setUserId(userId);
        rating.setDramaId(dramaId);
        rating.setScore(8);
        rating.setCreatedAt(LocalDateTime.now());
        return rating;
    }
}
