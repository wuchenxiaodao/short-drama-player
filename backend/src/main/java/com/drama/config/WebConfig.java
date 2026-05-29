package com.drama.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000", "http://localhost:8080")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String userDir = System.getProperty("user.dir");
        String videoPath = null;

        // Try multiple possible locations for videos directory
        String[] candidates = {
            userDir + File.separator + "videos",
            userDir + File.separator + ".." + File.separator + "videos",
            userDir + File.separator + "short-drama-player" + File.separator + "videos",
            userDir + File.separator + ".." + File.separator + "short-drama",
            userDir + File.separator + "short-drama"
        };
        for (String path : candidates) {
            File dir = new File(path);
            if (dir.isDirectory() && new File(dir, "北派寻宝笔记").isDirectory()) {
                try {
                    videoPath = dir.getCanonicalPath() + File.separator;
                } catch (Exception e) {
                    videoPath = path + File.separator;
                }
                break;
            }
        }
        if (videoPath == null) {
            videoPath = userDir + File.separator + "videos" + File.separator;
        }

        log.info("Video resource handler: /videos/** -> file:{}", videoPath);
        registry.addResourceHandler("/videos/**")
                .addResourceLocations("file:" + videoPath);

        // Serve preview.html from android assets
        String previewPath = null;
        String[] previewCandidates = {
            userDir + File.separator,
            userDir + File.separator + "android" + File.separator + "app" + File.separator + "src" + File.separator + "main" + File.separator + "assets" + File.separator,
            userDir + File.separator + ".." + File.separator + "android" + File.separator + "app" + File.separator + "src" + File.separator + "main" + File.separator + "assets" + File.separator
        };
        for (String path : previewCandidates) {
            if (new File(path + "preview.html").exists()) {
                previewPath = path;
                break;
            }
        }
        if (previewPath != null) {
            log.info("Preview handler: /preview.html -> file:{}", previewPath);
            registry.addResourceHandler("/preview.html")
                    .addResourceLocations("file:" + previewPath);
        }
    }
}
