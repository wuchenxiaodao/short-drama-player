package com.drama.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.nio.file.*;
import java.util.regex.*;

@RestController
public class VideoController {

    @Value("${app.video.base-path:videos}")
    private String videoBasePath;

    @GetMapping("/videos/**")
    public void streamVideo(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String fullPath = request.getRequestURI();
        String videoPath = fullPath.substring("/videos/".length());

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
