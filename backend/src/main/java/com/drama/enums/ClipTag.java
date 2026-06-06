package com.drama.enums;

public enum ClipTag {
    SWEET("甜"),
    THRILL("刺激"),
    ANGRY("气愤"),
    SAD("虐心"),
    FUNNY("搞笑"),
    SHOCK("震惊");

    private final String label;

    ClipTag(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
