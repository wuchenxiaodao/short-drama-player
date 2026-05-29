package com.drama.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/drama/recommend", "/api/drama/hot",
                    "/api/drama/new", "/api/drama/search").permitAll()
                .requestMatchers("/api/drama/*/detail").permitAll()
                .requestMatchers("/api/episode/*/playinfo").permitAll()
                .requestMatchers("/api/interaction/*/stats").permitAll()
                .requestMatchers("/api/comment/**").permitAll()
                .requestMatchers("/api/rating/stats", "/api/rating/user").permitAll()
                .requestMatchers("/api/online/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/h2-console/**").permitAll()
                .requestMatchers("/", "/preview.html", "/css/**", "/js/**", "/assets/**").permitAll()
                .requestMatchers("/videos/**").permitAll()
                .requestMatchers("/video").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .headers(headers -> headers.frameOptions(fo -> fo.sameOrigin()));
        return http.build();
    }
}
