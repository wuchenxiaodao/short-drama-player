package com.drama.service;

import com.drama.dto.HighlightClipVO;
import com.drama.model.Drama;
import com.drama.model.HighlightClip;
import com.drama.model.ClipInteraction;
import com.drama.enums.ClipTag;
import com.drama.repository.HighlightClipRepository;
import com.drama.repository.ClipInteractionRepository;
import com.drama.repository.DramaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClipService {

    private final HighlightClipRepository clipRepo;
    private final ClipInteractionRepository interactionRepo;
    private final DramaRepository dramaRepo;

    public Page<HighlightClipVO> getRecommendClips(Pageable pageable) {
        Page<HighlightClip> clips = clipRepo.findAll(pageable);
        List<HighlightClipVO> voList = clips.getContent().stream()
                .map(this::toVO)
                .collect(Collectors.toList());
        return new PageImpl<>(voList, pageable, clips.getTotalElements());
    }

    public Page<HighlightClipVO> getClipsByTag(ClipTag tag, Pageable pageable) {
        List<HighlightClip> all = clipRepo.findByTagOrderByHeatScoreDesc(tag);
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), all.size());
        List<HighlightClipVO> voList = all.subList(start, end).stream()
                .map(this::toVO)
                .collect(Collectors.toList());
        return new PageImpl<>(voList, pageable, all.size());
    }

    public Page<HighlightClipVO> getClipsByDrama(Long dramaId, Pageable pageable) {
        List<HighlightClip> all = clipRepo.findByDramaIdOrderByHeatScoreDesc(dramaId);
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), all.size());
        List<HighlightClipVO> voList = all.subList(start, end).stream()
                .map(this::toVO)
                .collect(Collectors.toList());
        return new PageImpl<>(voList, pageable, all.size());
    }

    public HighlightClipVO getClipDetail(Long clipId) {
        HighlightClip clip = clipRepo.findById(clipId)
                .orElseThrow(() -> new RuntimeException("片段不存在"));
        return toVO(clip);
    }

    @Transactional
    public void recordPlay(Long clipId) {
        HighlightClip clip = clipRepo.findById(clipId).orElse(null);
        if (clip != null) {
            clip.setPlayCount(clip.getPlayCount() + 1);
            clip.setHeatScore(clip.getHeatScore() + 1);
            clipRepo.save(clip);
        }
    }

    @Transactional
    public void recordClick(Long clipId, Long userId) {
        HighlightClip clip = clipRepo.findById(clipId).orElse(null);
        if (clip != null) {
            clip.setClickCount(clip.getClickCount() + 1);
            clip.setHeatScore(clip.getHeatScore() + 5);
            clipRepo.save(clip);

            ClipInteraction interaction = new ClipInteraction();
            interaction.setClipId(clipId);
            interaction.setUserId(userId);
            interaction.setAction("click");
            interactionRepo.save(interaction);
        }
    }

    @Transactional
    public void recordLike(Long clipId, Long userId) {
        HighlightClip clip = clipRepo.findById(clipId).orElse(null);
        if (clip != null) {
            clip.setHeatScore(clip.getHeatScore() + 3);
            clipRepo.save(clip);

            ClipInteraction interaction = new ClipInteraction();
            interaction.setClipId(clipId);
            interaction.setUserId(userId);
            interaction.setAction("like");
            interactionRepo.save(interaction);
        }
    }

    private HighlightClipVO toVO(HighlightClip clip) {
        HighlightClipVO vo = new HighlightClipVO();
        vo.setId(clip.getId());
        vo.setDramaId(clip.getDramaId());
        vo.setEpisodeId(clip.getEpisodeId());
        vo.setTitle(clip.getTitle());
        vo.setStartTime(clip.getStartTime());
        vo.setEndTime(clip.getEndTime());
        vo.setClipUrl(clip.getClipUrl());
        vo.setCoverUrl(clip.getCoverUrl());
        vo.setTag(clip.getTag() != null ? clip.getTag().name() : null);
        vo.setTagLabel(clip.getTag() != null ? clip.getTag().getLabel() : null);
        vo.setPlayCount(clip.getPlayCount());
        vo.setClickCount(clip.getClickCount());
        vo.setHeatScore(clip.getHeatScore());

        dramaRepo.findById(clip.getDramaId()).ifPresent(drama -> {
            vo.setDramaTitle(drama.getTitle());
            vo.setDramaCoverUrl(drama.getCoverUrl());
            vo.setDramaEpisodeCount(drama.getTotalEpisodes());
        });

        return vo;
    }
}
