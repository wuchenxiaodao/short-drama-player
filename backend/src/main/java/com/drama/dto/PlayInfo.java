package com.drama.dto;

import lombok.Data;
import java.util.List;

@Data
public class PlayInfo {
    private Long episodeId;
    private String videoUrl;
    private Integer durationSeconds;
    private Long lastPositionMs;
    private List<InteractionInfo> interactions;

    @Data
    public static class InteractionInfo {
        private Long id;
        private Long timestampMs;
        private String type;
        private String questionText;
        private Long prerequisiteId;
        private Long prerequisiteChoiceOptionId;
        private Boolean prerequisiteMet;
        private List<OptionInfo> options;

        @Data
        public static class OptionInfo {
            private Long id;
            private String text;
            private Boolean isCorrect;
            private Long nextInteractionId;
            private String feedbackText;
        }
    }
}
