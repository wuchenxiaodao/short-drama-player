package com.drama.service;

import com.drama.common.BusinessException;
import com.drama.config.JwtUtil;
import com.drama.model.User;
import com.drama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public Map<String, Object> register(String username, String password, String nickname) {
        if (userRepository.existsByUsername(username)) {
            throw new BusinessException(400, "用户名已存在");
        }
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setNickname(nickname != null ? nickname : username);
        user.setPoints(0);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        return Map.of("userId", user.getId(), "nickname", user.getNickname(), "token", token);
    }

    public Map<String, Object> login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException(401, "用户名或密码错误"));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BusinessException(401, "用户名或密码错误");
        }
        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        return Map.of("userId", user.getId(), "nickname", user.getNickname(),
                      "username", user.getUsername(), "token", token);
    }

    public Map<String, Object> getUserInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(404, "用户不存在"));
        return Map.of("id", user.getId(), "username", user.getUsername(),
                      "nickname", user.getNickname(), "points", user.getPoints(),
                      "createdAt", user.getCreatedAt());
    }
}
