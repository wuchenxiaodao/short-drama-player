package com.drama.dto;

import lombok.Data;
import java.util.Map;

@Data
public class InteractionStats {
    private Long interactionId;
    private Long totalParticipants;
    private Map<Long, OptionStats> optionStats;

    @Data
    public static class OptionStats {
        private Long count;
        private Double percentage;
    }
}
