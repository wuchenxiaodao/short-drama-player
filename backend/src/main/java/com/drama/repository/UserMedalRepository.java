package com.drama.repository;

import com.drama.model.UserMedal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserMedalRepository extends JpaRepository<UserMedal, Long> {
    List<UserMedal> findByUserIdOrderByEarnedAtDesc(Long userId);
    boolean existsByUserIdAndMedalCode(Long userId, String medalCode);
}
