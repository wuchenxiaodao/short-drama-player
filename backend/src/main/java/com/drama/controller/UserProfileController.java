package com.drama.controller;

import com.drama.model.UserEgg;
import com.drama.model.UserMedal;
import com.drama.repository.UserEggRepository;
import com.drama.repository.UserMedalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserEggRepository eggRepository;
    private final UserMedalRepository medalRepository;

    @GetMapping("/{userId}/eggs")
    public List<UserEgg> getEggs(@PathVariable Long userId) {
        return eggRepository.findByUserIdOrderByCollectedAtDesc(userId);
    }

    @GetMapping("/{userId}/eggs/count")
    public Map<String, Long> getEggCount(@PathVariable Long userId) {
        return Map.of("count", eggRepository.countByUserId(userId));
    }

    @GetMapping("/{userId}/medals")
    public List<UserMedal> getMedals(@PathVariable Long userId) {
        return medalRepository.findByUserIdOrderByEarnedAtDesc(userId);
    }

    @GetMapping("/{userId}/medals/check/{medalCode}")
    public Map<String, Boolean> checkMedal(@PathVariable Long userId, @PathVariable String medalCode) {
        return Map.of("earned", medalRepository.existsByUserIdAndMedalCode(userId, medalCode));
    }
}
