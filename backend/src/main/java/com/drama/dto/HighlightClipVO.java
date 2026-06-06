package com.drama.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HighlightClipVO {
    private Long id;
    private Long dramaId;
    private Long episodeId;
    private String title;
    private Integer startTime;
    private Integer endTime;
    private String clipUrl;
    private String coverUrl;
    private String tag;
    private String tagLabel;
    private Integer playCount;
    private Integer clickCount;
    private Integer heatScore;
    private String dramaTitle;
    private String dramaCoverUrl;
    private Integer dramaEpisodeCount;
}
