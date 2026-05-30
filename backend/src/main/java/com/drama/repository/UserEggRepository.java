package com.drama.repository;

import com.drama.model.UserEgg;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserEggRepository extends JpaRepository<UserEgg, Long> {
    List<UserEgg> findByUserIdOrderByCollectedAtDesc(Long userId);
    List<UserEgg> findByUserId(Long userId);
    long countByUserId(Long userId);
}
