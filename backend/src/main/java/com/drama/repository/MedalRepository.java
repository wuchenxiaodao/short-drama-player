package com.drama.repository;

import com.drama.model.Medal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MedalRepository extends JpaRepository<Medal, Long> {
    Optional<Medal> findByCode(String code);
}
