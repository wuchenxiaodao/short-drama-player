package com.drama.repository;

import com.drama.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.points = u.points + :points WHERE u.id = :id")
    void addPoints(@org.springframework.data.repository.query.Param("id") Long id,
                   @org.springframework.data.repository.query.Param("points") int points);
}
