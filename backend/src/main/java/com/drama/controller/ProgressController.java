package com.drama.controller;

import com.drama.dto.ProgressReport;
import com.drama.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    @PostMapping("/report")
    public ResponseEntity<Map<String, Object>> report(@RequestBody ProgressReport report) {
        progressService.reportProgress(report);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
