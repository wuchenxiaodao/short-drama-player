package com.drama.model;

import java.io.Serializable;
import java.util.Objects;

public class WatchProgressId implements Serializable {
    private Long userId;
    private Long episodeId;

    public WatchProgressId() {}

    public WatchProgressId(Long userId, Long episodeId) {
        this.userId = userId;
        this.episodeId = episodeId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof WatchProgressId that)) return false;
        return Objects.equals(userId, that.userId) && Objects.equals(episodeId, that.episodeId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, episodeId);
    }
}
