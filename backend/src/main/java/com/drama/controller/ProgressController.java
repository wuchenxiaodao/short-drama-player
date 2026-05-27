package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.dto.ProgressReport;
import com.drama.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    @PostMapping("/report")
    public ApiResponse<Void> report(@RequestBody ProgressReport report) {
        progressService.reportProgress(report);
        return ApiResponse.success("进度已保存", null);
    }
}
