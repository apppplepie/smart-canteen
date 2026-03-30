package com.scs.controller;

import com.scs.dto.ApiResult;
import com.scs.service.SnapshotReportFacadeService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 食堂日快照 / AI 周期报告：只读已落库数据，不做业务表聚合。
 */
@RestController
@RequestMapping("/api/snapshots")
public class SnapshotReportController {

    private final SnapshotReportFacadeService facadeService;

    public SnapshotReportController(SnapshotReportFacadeService facadeService) {
        this.facadeService = facadeService;
    }

    /**
     * GET /api/snapshots/daily?scopeType=global&scopeId=0&page=1&size=20
     */
    @GetMapping(value = "/daily", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResult<Map<String, Object>> listDaily(
            @RequestParam(defaultValue = "global") String scopeType,
            @RequestParam(defaultValue = "0") long scopeId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResult.ok(facadeService.listDailySnapshots(scopeType, scopeId, page, size));
    }

    /**
     * GET /api/snapshots/ai-reports?scopeType=global&scopeId=0&reportType=&page=1&size=20
     */
    @GetMapping(value = "/ai-reports", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResult<Map<String, Object>> listAiReports(
            @RequestParam(defaultValue = "global") String scopeType,
            @RequestParam(defaultValue = "0") long scopeId,
            @RequestParam(required = false) String reportType,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResult.ok(facadeService.listAiReports(scopeType, scopeId, reportType, page, size));
    }
}
