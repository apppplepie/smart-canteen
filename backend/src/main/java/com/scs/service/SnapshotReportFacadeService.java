package com.scs.service;

import com.scs.entity.AiPeriodReport;
import com.scs.entity.CanteenDailySnapshot;
import com.scs.repository.AiPeriodReportRepository;
import com.scs.repository.CanteenDailySnapshotRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 仅查询快照表本身，不聚合 orders/posts 等业务数据（数据量少时也可先手工 INSERT 试接口）。
 */
@Service
public class SnapshotReportFacadeService {

    public static final String STUB_NOTE =
            "快照表已就绪；本接口只读库表，未接入订单/发帖/AI 生成任务。有数据时返回真实行，无数据时附带占位说明。";

    private final CanteenDailySnapshotRepository dailyRepo;
    private final AiPeriodReportRepository reportRepo;

    public SnapshotReportFacadeService(
            CanteenDailySnapshotRepository dailyRepo,
            AiPeriodReportRepository reportRepo) {
        this.dailyRepo = dailyRepo;
        this.reportRepo = reportRepo;
    }

    public Map<String, Object> listDailySnapshots(String scopeType, long scopeId, int page, int size) {
        int p = Math.max(0, page - 1);
        int s = Math.min(100, Math.max(1, size));
        Page<CanteenDailySnapshot> result =
                dailyRepo.findByScopeTypeAndScopeIdOrderBySnapshotDateDesc(scopeType, scopeId, PageRequest.of(p, s));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("stubNote", STUB_NOTE);
        out.put("placeholder", result.isEmpty());
        out.put("total", result.getTotalElements());
        out.put("items", result.getContent().stream().map(this::toDailyMap).collect(Collectors.toList()));
        return out;
    }

    public Map<String, Object> listAiReports(
            String scopeType, long scopeId, String reportType, int page, int size) {
        int p = Math.max(0, page - 1);
        int s = Math.min(100, Math.max(1, size));
        Page<AiPeriodReport> result;
        if (reportType != null && !reportType.isBlank()) {
            result = reportRepo.findByReportTypeAndScopeTypeAndScopeIdOrderByGeneratedAtDesc(
                    reportType.trim(), scopeType, scopeId, PageRequest.of(p, s));
        } else {
            result = reportRepo.findByScopeTypeAndScopeIdOrderByGeneratedAtDesc(
                    scopeType, scopeId, PageRequest.of(p, s));
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("stubNote", STUB_NOTE);
        out.put("placeholder", result.isEmpty());
        out.put("total", result.getTotalElements());
        out.put("items", result.getContent().stream().map(this::toReportMap).collect(Collectors.toList()));
        if (result.isEmpty()) {
            out.put("exampleReportTypes", List.of("weekly_posts_digest", "food_safety_scan", "feedback_trends"));
        }
        return out;
    }

    private Map<String, Object> toDailyMap(CanteenDailySnapshot e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", e.getId());
        m.put("snapshotDate", e.getSnapshotDate() != null ? e.getSnapshotDate().toString() : null);
        m.put("scopeType", e.getScopeType());
        m.put("scopeId", e.getScopeId());
        m.put("totalOrders", e.getTotalOrders());
        m.put("totalRevenue", e.getTotalRevenue());
        m.put("totalItemsSold", e.getTotalItemsSold());
        m.put("distinctDiners", e.getDistinctDiners());
        m.put("postsDynamicsCount", e.getPostsDynamicsCount());
        m.put("postsFeedbackCount", e.getPostsFeedbackCount());
        m.put("wordcloudCombinedJson", e.getWordcloudCombinedJson());
        m.put("topMenuItemsJson", e.getTopMenuItemsJson());
        m.put("topVendorsJson", e.getTopVendorsJson());
        m.put("computedAt", e.getComputedAt() != null ? e.getComputedAt().toString() : null);
        m.put("dataVersion", e.getDataVersion());
        return m;
    }

    private Map<String, Object> toReportMap(AiPeriodReport e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", e.getId());
        m.put("reportType", e.getReportType());
        m.put("periodType", e.getPeriodType());
        m.put("periodStart", e.getPeriodStart() != null ? e.getPeriodStart().toString() : null);
        m.put("periodEnd", e.getPeriodEnd() != null ? e.getPeriodEnd().toString() : null);
        m.put("scopeType", e.getScopeType());
        m.put("scopeId", e.getScopeId());
        m.put("title", e.getTitle());
        m.put("executiveSummary", e.getExecutiveSummary());
        m.put("structuredPayloadJson", e.getStructuredPayloadJson());
        m.put("generationStatus", e.getGenerationStatus());
        m.put("generatedAt", e.getGeneratedAt() != null ? e.getGeneratedAt().toString() : null);
        m.put("notifyStatus", e.getNotifyStatus());
        m.put("visibility", e.getVisibility());
        return m;
    }
}
