package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.dto.LoginRequest;
import com.drama.dto.RegisterRequest;
import com.drama.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponse<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success("注册成功",
            authService.register(request.getUsername(), request.getPassword(), request.getNickname()));
    }

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success("登录成功",
            authService.login(request.getUsername(), request.getPassword()));
    }

    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> me(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ApiResponse.error(401, "请先登录");
        }
        // Token已在JwtFilter中验证，这里从SecurityContext获取
        Long userId = com.drama.common.AuthUtils.getCurrentUserId();
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }
        return ApiResponse.success(authService.getUserInfo(userId));
    }

    @GetMapping("/{userId}")
    public ApiResponse<Map<String, Object>> getUser(@PathVariable Long userId) {
        return ApiResponse.success(authService.getUserInfo(userId));
    }
}
