package com.drama.service;

import com.drama.common.BusinessException;
import com.drama.config.JwtUtil;
import com.drama.model.User;
import com.drama.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @InjectMocks private AuthService authService;

    @Test
    void register_WhenUsernameNotExists_ShouldReturnToken() {
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded");
        when(jwtUtil.generateToken(any(), any())).thenReturn("jwt-token");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(1L);
            return u;
        });

        Map<String, Object> result = authService.register("newuser", "password123", "新人");

        assertNotNull(result.get("token"));
        assertEquals("jwt-token", result.get("token"));
    }

    @Test
    void register_WhenUsernameExists_ShouldThrow() {
        when(userRepository.existsByUsername("existing")).thenReturn(true);

        assertThrows(BusinessException.class, () ->
                authService.register("existing", "password123", null));
    }

    @Test
    void login_WhenValidCredentials_ShouldReturnToken() {
        User user = new User();
        user.setId(1L);
        user.setUsername("user1");
        user.setPassword("encoded");
        user.setNickname("User1");

        when(userRepository.findByUsername("user1")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encoded")).thenReturn(true);
        when(jwtUtil.generateToken(1L, "user1")).thenReturn("jwt-token");

        Map<String, Object> result = authService.login("user1", "password123");

        assertEquals("jwt-token", result.get("token"));
        assertEquals(1L, result.get("userId"));
    }

    @Test
    void login_WhenWrongPassword_ShouldThrow() {
        User user = new User();
        user.setPassword("encoded");

        when(userRepository.findByUsername("user1")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encoded")).thenReturn(false);

        assertThrows(BusinessException.class, () -> authService.login("user1", "wrong"));
    }

    @Test
    void login_WhenUserNotFound_ShouldThrow() {
        when(userRepository.findByUsername("nobody")).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> authService.login("nobody", "password"));
    }

    @Test
    void getUserInfo_WhenUserExists_ShouldReturnInfo() {
        User user = new User();
        user.setId(1L);
        user.setUsername("user1");
        user.setNickname("User1");
        user.setPoints(100);
        user.setCreatedAt(java.time.LocalDateTime.now());

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        Map<String, Object> result = authService.getUserInfo(1L);

        assertEquals(1L, result.get("id"));
        assertEquals(100, result.get("points"));
    }

    @Test
    void getUserInfo_WhenUserNotFound_ShouldThrow() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> authService.getUserInfo(999L));
    }
}
