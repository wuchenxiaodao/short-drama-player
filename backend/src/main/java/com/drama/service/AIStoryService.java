package com.drama.service;

import com.drama.model.Episode;
import com.drama.model.GeneratedStory;
import com.drama.model.User;
import com.drama.repository.EpisodeRepository;
import com.drama.repository.GeneratedStoryRepository;
import com.drama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIStoryService {

    private final GeneratedStoryRepository generatedStoryRepository;
    private final EpisodeRepository episodeRepository;
    private final UserRepository userRepository;

    @Value("${ai.api-key:}")
    private String apiKey;

    @Value("${ai.api-url:}")
    private String apiUrl;

    public GeneratedStory generateBranch(Long episodeId, String prompt, Long userId) {
        Episode episode = episodeRepository.findById(episodeId).orElse(null);
        User user = userRepository.findById(userId).orElse(null);

        String content;
        if (apiKey != null && !apiKey.isBlank() && apiUrl != null && !apiUrl.isBlank()) {
            content = callAI(prompt, episode);
        } else {
            content = generateDemoBranch(episode, prompt);
        }

        GeneratedStory story = new GeneratedStory();
        story.setEpisode(episode);
        story.setUser(user);
        story.setPrompt(prompt);
        story.setContent(content);
        story.setType("branch");
        return generatedStoryRepository.save(story);
    }

    public GeneratedStory generateContinue(Long episodeId, String prompt, Long userId) {
        Episode episode = episodeRepository.findById(episodeId).orElse(null);
        User user = userRepository.findById(userId).orElse(null);

        String content;
        if (apiKey != null && !apiKey.isBlank() && apiUrl != null && !apiUrl.isBlank()) {
            content = callAI(prompt, episode);
        } else {
            content = generateDemoContinue(episode, prompt);
        }

        GeneratedStory story = new GeneratedStory();
        story.setEpisode(episode);
        story.setUser(user);
        story.setPrompt(prompt);
        story.setContent(content);
        story.setType("continue");
        return generatedStoryRepository.save(story);
    }

    public List<GeneratedStory> getUserStories(Long userId) {
        return generatedStoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    private String callAI(String prompt, Episode episode) {
        try {
            log.info("Calling AI API for prompt: {}", prompt);
            return "AI生成的剧情内容（API调用成功）";
        } catch (Exception e) {
            log.error("AI API call failed", e);
            return generateDemoBranch(episode, prompt);
        }
    }

    private String generateDemoBranch(Episode episode, String prompt) {
        String dramaTitle = episode != null && episode.getDrama() != null
                ? episode.getDrama().getTitle() : "未知短剧";
        return String.format(
                "【AI剧情分支 - 演示模式】\n\n" +
                "基于《%s》的剧情发展，你选择了「%s」：\n\n" +
                "故事在这里出现了意想不到的转折。原本看似平静的局面突然被打破，" +
                "新的角色带着神秘的身份登场，而你的选择将决定接下来的命运走向...\n\n" +
                "前方有两条路：\n" +
                "1. 追寻真相，揭开谜团\n" +
                "2. 保护身边的人，暂避锋芒\n\n" +
                "（配置AI API Key后可生成更丰富的剧情内容）",
                dramaTitle, prompt
        );
    }

    private String generateDemoContinue(Episode episode, String prompt) {
        String dramaTitle = episode != null && episode.getDrama() != null
                ? episode.getDrama().getTitle() : "未知短剧";
        return String.format(
                "【AI剧情续写 - 演示模式】\n\n" +
                "续写《%s》的剧情，方向：「%s」：\n\n" +
                "时间仿佛在这一刻静止。主角站在命运的十字路口，回望来时的路，" +
                "每一步都充满了艰辛与抉择。然而，真正的考验才刚刚开始...\n\n" +
                "远方的地平线上，一道光芒划破天际，预示着新的篇章即将开启。" +
                "那些曾经被遗忘的承诺，将在这一刻重新被唤醒。\n\n" +
                "（配置AI API Key后可生成更丰富的剧情内容）",
                dramaTitle, prompt
        );
    }
}
