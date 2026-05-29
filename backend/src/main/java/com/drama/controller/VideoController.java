package com.drama.controller;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
public class VideoController {

    @GetMapping(value = "/video", produces = "video/mp4")
    public ResponseEntity<Resource> serveVideo(@RequestParam String path) {
        try {
            if (path.contains("..") || path.contains("\\")) {
                return ResponseEntity.badRequest().build();
            }

            String userDir = System.getProperty("user.dir");
            String[][] bases = {
                { userDir, "..", "videos" },
                { userDir, "..", "short-drama" },
                { userDir, "videos" },
                { userDir, "short-drama" }
            };

            for (String[] parts : bases) {
                Path dirPath = Paths.get(parts[0], java.util.Arrays.copyOfRange(parts, 1, parts.length));
                Path filePath = dirPath.resolve(path).normalize();
                if (!filePath.startsWith(dirPath.normalize())) {
                    continue;
                }
                File file = filePath.toFile();
                if (file.exists() && file.isFile()) {
                    return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType("video/mp4"))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                        .body(new FileSystemResource(file));
                }
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error serving video", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
