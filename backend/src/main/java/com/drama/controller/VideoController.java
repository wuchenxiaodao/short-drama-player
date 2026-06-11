package com.drama.controller;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.nio.file.*;
import java.util.regex.*;

@Slf4j
@RestController
public class VideoController {

    private String videoBasePath;

    @PostConstruct
    public void init() {
        String userDir = System.getProperty("user.dir");
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
                    videoBasePath = dir.getCanonicalPath();
                } catch (Exception e) {
                    videoBasePath = path;
                }
                break;
            }
        }
        if (videoBasePath == null) {
            videoBasePath = userDir + File.separator + "videos";
        }
        log.info("VideoController base path: {}", videoBasePath);
    }

    @GetMapping("/api/video/placeholder/{episodeNumber}")
    public void placeholderVideo(@PathVariable int episodeNumber, HttpServletResponse response) throws IOException {
        response.setContentType("video/mp4");
        response.setHeader("Accept-Ranges", "bytes");
        response.setStatus(HttpServletResponse.SC_OK);

        // 返回一个最小的有效 MP4 文件（黑色画面 + 时长标记），让浏览器不会报错
        byte[] placeholderMp4 = generatePlaceholderMp4();
        response.setContentLength(placeholderMp4.length);
        response.getOutputStream().write(placeholderMp4);
        response.getOutputStream().flush();
    }

    private byte[] generatePlaceholderMp4() {
        // 最小有效 MP4 (ftyp + moov)，浏览器能正常解析但不显示内容
        String hex = "0000001c6674797069736f6d0000000069736f6d69736f32"
                   + "6d7034310000000866726565000000546d6f6f760000004c"
                   + "6d76686400000000000000000000000000000000000003e8"
                   + "000000010000000000000000000000000001000000000000"
                   + "000000000000000000010000000000000000000000000000"
                   + "00010000000000000000000000";
        byte[] data = new byte[hex.length() / 2];
        for (int i = 0; i < data.length; i++) {
            data[i] = (byte) Integer.parseInt(hex.substring(i * 2, i * 2 + 2), 16);
        }
        return data;
    }

    @GetMapping("/videos/**")
    public void streamVideo(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String fullPath = request.getRequestURI();
        log.info("Video request: {}", fullPath);
        String videoPath = java.net.URLDecoder.decode(fullPath.substring("/videos/".length()), "UTF-8");
        log.info("Video path: {}", videoPath);

        Path basePath = Paths.get(videoBasePath).toAbsolutePath().normalize();
        Path filePath = basePath.resolve(videoPath).normalize();

        if (!filePath.startsWith(basePath)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        File file = filePath.toFile();
        if (!file.exists() || !file.isFile()) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        long fileLength = file.length();
        String range = request.getHeader("Range");

        if (range != null) {
            Range fullRange = parseRange(range, fileLength);
            if (fullRange != null) {
                response.setStatus(HttpServletResponse.SC_PARTIAL_CONTENT);
                response.setHeader("Content-Range", "bytes " + fullRange.start + "-" + fullRange.end + "/" + fileLength);
                response.setHeader("Content-Length", String.valueOf(fullRange.end - fullRange.start + 1));
                response.setHeader("Accept-Ranges", "bytes");

                String contentType = getContentType(videoPath);
                response.setContentType(contentType);

                try (RandomAccessFile raf = new RandomAccessFile(file, "r")) {
                    raf.seek(fullRange.start);
                    byte[] buffer = new byte[8192];
                    long remaining = fullRange.end - fullRange.start + 1;
                    while (remaining > 0) {
                        int toRead = (int) Math.min(buffer.length, remaining);
                        int bytesRead = raf.read(buffer, 0, toRead);
                        if (bytesRead <= 0) break;
                        response.getOutputStream().write(buffer, 0, bytesRead);
                        remaining -= bytesRead;
                    }
                }
                return;
            }
        }

        response.setStatus(HttpServletResponse.SC_OK);
        response.setHeader("Content-Length", String.valueOf(fileLength));
        response.setHeader("Accept-Ranges", "bytes");

        String contentType = getContentType(videoPath);
        response.setContentType(contentType);

        try (InputStream is = Files.newInputStream(file.toPath())) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                response.getOutputStream().write(buffer, 0, bytesRead);
            }
        }
    }

    private Range parseRange(String rangeHeader, long fileLength) {
        Pattern pattern = Pattern.compile("bytes=(\\d+)-(\\d*)");
        Matcher matcher = pattern.matcher(rangeHeader);
        if (matcher.matches()) {
            long start = Long.parseLong(matcher.group(1));
            String endStr = matcher.group(2);
            long end = endStr.isEmpty() ? fileLength - 1 : Long.parseLong(endStr);
            if (start <= end && start < fileLength) {
                end = Math.min(end, fileLength - 1);
                return new Range(start, end);
            }
        }
        return null;
    }

    private String getContentType(String path) {
        if (path.endsWith(".mp4")) return "video/mp4";
        if (path.endsWith(".webm")) return "video/webm";
        if (path.endsWith(".ogg")) return "video/ogg";
        return "application/octet-stream";
    }

    private static class Range {
        final long start;
        final long end;

        Range(long start, long end) {
            this.start = start;
            this.end = end;
        }
    }
}
