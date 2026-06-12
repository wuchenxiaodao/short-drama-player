package com.drama.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final Environment environment;

    @Value("${cors.allowed-origins:http://localhost:*,http://127.0.0.1:*,http://10.0.2.2:*,http://172.16.*:*}")
    private String allowedOrigins;

    public SecurityConfig(JwtFilter jwtFilter, Environment environment) {
        this.jwtFilter = jwtFilter;
        this.environment = environment;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        final boolean h2Enabled;
        List<String> profiles = List.of(environment.getActiveProfiles());
        h2Enabled = profiles.contains("h2");

        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> {
                auth
                    .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()
                    .requestMatchers("/api/drama/recommend", "/api/drama/hot",
                        "/api/drama/new", "/api/drama/search").permitAll()
                    .requestMatchers("/api/drama/categories", "/api/drama/category/**").permitAll()
                    .requestMatchers("/api/drama/*/detail").permitAll()
                    .requestMatchers("/api/favorite/check/**").permitAll()
                    .requestMatchers("/api/episode/*/playinfo").permitAll()
                    .requestMatchers("/api/episode/*/streams").permitAll()
                    .requestMatchers("/api/interaction/*/stats").permitAll()
                    .requestMatchers("/api/interaction/episode/**").permitAll()
                    .requestMatchers("/api/interaction/answer").permitAll()
                    .requestMatchers("/api/interaction/stats/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/comment/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/danmaku/episode/**").permitAll()
                    .requestMatchers("/api/rating/stats").permitAll()
                    .requestMatchers("/api/eggs/catalog").permitAll()
                    .requestMatchers("/api/online/episode/*/count").permitAll()
                    .requestMatchers("/api/clips/flow", "/api/clips/drama/**").permitAll()
                    .requestMatchers("/api/video/placeholder/**").permitAll()
                    .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll();
                if (h2Enabled) {
                    auth.requestMatchers("/h2-console/**").permitAll();
                }
                auth
                    .requestMatchers("/", "/index.html", "/css/**", "/js/**", "/assets/**", "/covers/**").permitAll()
                    .requestMatchers("/videos/**").permitAll()
                    .anyRequest().authenticated();
            })
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .headers(headers -> headers.frameOptions(fo -> fo.sameOrigin()));
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        source.registerCorsConfiguration("/videos/**", config);
        return source;
    }
}
