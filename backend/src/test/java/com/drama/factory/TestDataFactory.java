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

    public static InteractionPoint createInteractionPoint(Long id, Episode episode, int timestamp) {
        InteractionPoint point = new InteractionPoint();
        point.setId(id);
        point.setEpisode(episode);
        point.setTimestamp(timestamp);
        point.setType("VOTE");
        point.setQuestion("测试问题？");
        point.setOptions(List.of("选项A", "选项B", "选项C"));
        point.setCorrectAnswer("选项A");
        point.setPoints(10);
        return point;
    }

    public static Comment createComment(Long id, User user, InteractionPoint point) {
        Comment comment = new Comment();
        comment.setId(id);
        comment.setUser(user);
        comment.setInteractionPoint(point);
        comment.setContent("测试评论内容");
        comment.setCreatedAt(LocalDateTime.now());
        comment.setLikeCount(0);
        return comment;
    }

    public static Rating createRating(Long id, User user, Drama drama) {
        Rating rating = new Rating();
        rating.setId(id);
        rating.setUser(user);
        rating.setDrama(drama);
        rating.setScore(8);
        rating.setCreatedAt(LocalDateTime.now());
        return rating;
    }
}
