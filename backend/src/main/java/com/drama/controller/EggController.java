package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.model.InteractionPoint;
import com.drama.model.UserEgg;
import com.drama.repository.InteractionPointRepository;
import com.drama.repository.UserEggRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/eggs")
@RequiredArgsConstructor
public class EggController {

    private final UserEggRepository userEggRepository;
    private final InteractionPointRepository interactionPointRepository;

    @GetMapping("/collection")
    public ApiResponse<EggCollectionResponse> getCollection() {
        Long userId = AuthUtils.requireUserId();

        List<InteractionPoint> allEggs = interactionPointRepository.findByInteractionType(InteractionPoint.InteractionType.EGG);
        List<UserEgg> userEggs = userEggRepository.findByUserId(userId);
        Set<Long> collectedIds = userEggs.stream()
                .map(UserEgg::getInteractionId)
                .collect(Collectors.toSet());

        Map<Long, List<EggInfo>> byDrama = new LinkedHashMap<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        for (InteractionPoint egg : allEggs) {
            Long dramaId = egg.getEpisode().getDrama().getId();
            String dramaTitle = egg.getEpisode().getDrama().getTitle();

            EggInfo info = new EggInfo();
            info.setId(egg.getId());
            info.setQuestionText(egg.getQuestionText());
            info.setCollected(collectedIds.contains(egg.getId()));
            info.setDramaId(dramaId);
            info.setDramaTitle(dramaTitle);

            if (info.isCollected()) {
                userEggs.stream()
                    .filter(ue -> ue.getInteractionId().equals(egg.getId()))
                    .findFirst()
                    .ifPresent(ue -> {
                        info.setEggContent(ue.getEggContent());
                        info.setCollectedAt(ue.getCollectedAt() != null ? ue.getCollectedAt().format(fmt) : null);
                    });
            }

            byDrama.computeIfAbsent(dramaId, k -> new ArrayList<>()).add(info);
        }

        EggCollectionResponse response = new EggCollectionResponse();
        response.setTotalEggs(allEggs.size());
        response.setCollectedEggs(collectedIds.size());
        response.setByDrama(byDrama);
        return ApiResponse.success(response);
    }

    @Data
    public static class EggInfo {
        private Long id;
        private String questionText;
        private boolean collected;
        private String eggContent;
        private String collectedAt;
        private Long dramaId;
        private String dramaTitle;
    }

    @Data
    public static class EggCollectionResponse {
        private int totalEggs;
        private int collectedEggs;
        private Map<Long, List<EggInfo>> byDrama;
    }
}
