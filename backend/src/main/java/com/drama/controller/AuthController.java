package com.drama.controller;

import com.drama.dto.LoginRequest;
import com.drama.dto.RegisterRequest;
import com.drama.model.User;
import com.drama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.ok(Map.of("success", false, "message", "用户名已存在"));
        }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(request.getPassword());
        user.setNickname(request.getNickname() != null ? request.getNickname() : request.getUsername());
        user.setPoints(0);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("success", true, "userId", user.getId(), "nickname", user.getNickname()));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        return userRepository.findByUsername(request.getUsername())
                .filter(u -> u.getPassword().equals(request.getPassword()))
                .map(u -> ResponseEntity.ok(Map.<String, Object>of("success", true, "userId", u.getId(), "nickname", u.getNickname(), "username", u.getUsername())))
                .orElse(ResponseEntity.ok(Map.of("success", false, "message", "用户名或密码错误")));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getUser(@PathVariable Long userId) {
        return userRepository.findById(userId)
                .map(u -> ResponseEntity.ok(Map.<String, Object>of(
                        "id", u.getId(),
                        "username", u.getUsername(),
                        "nickname", u.getNickname(),
                        "points", u.getPoints(),
                        "createdAt", u.getCreatedAt())))
                .orElse(ResponseEntity.notFound().build());
    }
}
