package com.drama.controller;

import com.drama.common.ApiResponse;
import com.drama.common.AuthUtils;
import com.drama.dto.ProgressReport;
import com.drama.service.ProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    @PostMapping("/report")
    public ApiResponse<Void> report(@Valid @RequestBody ProgressReport report) {
        Long userId = AuthUtils.requireUserId();
        progressService.reportProgress(report, userId);
        return ApiResponse.success("进度已保存", null);
    }
}
