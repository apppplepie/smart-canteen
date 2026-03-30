package com.scs.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * AI 周期分析报告实体；由后续 AI 任务写入，当前不与发帖等业务表做真实聚合。
 */
@Entity
@Table(name = "ai_period_reports")
public class AiPeriodReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_type", nullable = false, length = 64)
    private String reportType;

    @Column(name = "period_type", nullable = false, length = 32)
    private String periodType = "weekly";

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "scope_type", nullable = false, length = 32)
    private String scopeType = "global";

    @Column(name = "scope_id", nullable = false)
    private Long scopeId = 0L;

    @Column(length = 256)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String executiveSummary;

    @Column(name = "full_analysis_markdown", columnDefinition = "MEDIUMTEXT")
    private String fullAnalysisMarkdown;

    @Column(name = "structured_payload_json", columnDefinition = "JSON")
    private String structuredPayloadJson;

    @Column(name = "input_stats_json", columnDefinition = "JSON")
    private String inputStatsJson;

    @Column(name = "source_post_ids_json", columnDefinition = "JSON")
    private String sourcePostIdsJson;

    @Column(name = "model_name", length = 64)
    private String modelName;

    @Column(name = "prompt_version", length = 64)
    private String promptVersion;

    @Column(name = "generation_status", nullable = false, length = 32)
    private String generationStatus = "success";

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    @Column(name = "notify_status", nullable = false, length = 32)
    private String notifyStatus = "none";

    @Column(name = "notify_channels_json", columnDefinition = "JSON")
    private String notifyChannelsJson;

    @Column(name = "notify_sent_at")
    private LocalDateTime notifySentAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "acknowledged_by_user_id", referencedColumnName = "id")
    @JsonIgnore
    private User acknowledgedByUser;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "visibility", nullable = false, length = 32)
    private String visibility = "admin_only";

    @Column(name = "pii_redacted", nullable = false)
    private Boolean piiRedacted = false;

    @PrePersist
    protected void onCreate() {
        if (generatedAt == null) {
            generatedAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getReportType() { return reportType; }
    public void setReportType(String reportType) { this.reportType = reportType; }
    public String getPeriodType() { return periodType; }
    public void setPeriodType(String periodType) { this.periodType = periodType; }
    public LocalDate getPeriodStart() { return periodStart; }
    public void setPeriodStart(LocalDate periodStart) { this.periodStart = periodStart; }
    public LocalDate getPeriodEnd() { return periodEnd; }
    public void setPeriodEnd(LocalDate periodEnd) { this.periodEnd = periodEnd; }
    public String getScopeType() { return scopeType; }
    public void setScopeType(String scopeType) { this.scopeType = scopeType; }
    public Long getScopeId() { return scopeId; }
    public void setScopeId(Long scopeId) { this.scopeId = scopeId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getExecutiveSummary() { return executiveSummary; }
    public void setExecutiveSummary(String executiveSummary) { this.executiveSummary = executiveSummary; }
    public String getFullAnalysisMarkdown() { return fullAnalysisMarkdown; }
    public void setFullAnalysisMarkdown(String fullAnalysisMarkdown) { this.fullAnalysisMarkdown = fullAnalysisMarkdown; }
    public String getStructuredPayloadJson() { return structuredPayloadJson; }
    public void setStructuredPayloadJson(String structuredPayloadJson) { this.structuredPayloadJson = structuredPayloadJson; }
    public String getInputStatsJson() { return inputStatsJson; }
    public void setInputStatsJson(String inputStatsJson) { this.inputStatsJson = inputStatsJson; }
    public String getSourcePostIdsJson() { return sourcePostIdsJson; }
    public void setSourcePostIdsJson(String sourcePostIdsJson) { this.sourcePostIdsJson = sourcePostIdsJson; }
    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }
    public String getPromptVersion() { return promptVersion; }
    public void setPromptVersion(String promptVersion) { this.promptVersion = promptVersion; }
    public String getGenerationStatus() { return generationStatus; }
    public void setGenerationStatus(String generationStatus) { this.generationStatus = generationStatus; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
    public String getNotifyStatus() { return notifyStatus; }
    public void setNotifyStatus(String notifyStatus) { this.notifyStatus = notifyStatus; }
    public String getNotifyChannelsJson() { return notifyChannelsJson; }
    public void setNotifyChannelsJson(String notifyChannelsJson) { this.notifyChannelsJson = notifyChannelsJson; }
    public LocalDateTime getNotifySentAt() { return notifySentAt; }
    public void setNotifySentAt(LocalDateTime notifySentAt) { this.notifySentAt = notifySentAt; }
    public User getAcknowledgedByUser() { return acknowledgedByUser; }
    public void setAcknowledgedByUser(User acknowledgedByUser) { this.acknowledgedByUser = acknowledgedByUser; }
    public LocalDateTime getAcknowledgedAt() { return acknowledgedAt; }
    public void setAcknowledgedAt(LocalDateTime acknowledgedAt) { this.acknowledgedAt = acknowledgedAt; }
    public String getVisibility() { return visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }
    public Boolean getPiiRedacted() { return piiRedacted; }
    public void setPiiRedacted(Boolean piiRedacted) { this.piiRedacted = piiRedacted; }
}
