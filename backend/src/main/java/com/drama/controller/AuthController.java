package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.dto.LoginRequest;
import com.drama.dto.RegisterRequest;
import com.drama.model.User;
import com.drama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;

    @PostMapping("/register")
    public ApiResponse<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            return ApiResponse.error(400, "用户名已存在");
        }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(request.getPassword());
        user.setNickname(request.getNickname() != null ? request.getNickname() : request.getUsername());
        user.setPoints(0);
        userRepository.save(user);
        return ApiResponse.success("注册成功", Map.of("userId", user.getId(), "nickname", user.getNickname()));
    }

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@RequestBody LoginRequest request) {
        return userRepository.findByUsername(request.getUsername())
                .filter(u -> u.getPassword().equals(request.getPassword()))
                .map(u -> ApiResponse.success("登录成功", Map.<String, Object>of("userId", u.getId(), "nickname", u.getNickname(), "username", u.getUsername())))
                .orElse(ApiResponse.error(401, "用户名或密码错误"));
    }

    @GetMapping("/{userId}")
    public ApiResponse<Map<String, Object>> getUser(@PathVariable Long userId) {
        return userRepository.findById(userId)
                .map(u -> ApiResponse.success(Map.<String, Object>of(
                        "id", u.getId(),
                        "username", u.getUsername(),
                        "nickname", u.getNickname(),
                        "points", u.getPoints(),
                        "createdAt", u.getCreatedAt())))
                .orElse(ApiResponse.error(404, "用户不存在"));
    }
}
