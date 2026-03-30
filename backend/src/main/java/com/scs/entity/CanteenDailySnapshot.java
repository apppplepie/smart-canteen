package com.scs.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 食堂日快照表实体；数据由后续定时任务写入，当前不与订单/发帖等业务表做实时聚合。
 */
@Entity
@Table(name = "canteen_daily_snapshots")
public class CanteenDailySnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Column(name = "scope_type", nullable = false, length = 32)
    private String scopeType = "global";

    @Column(name = "scope_id", nullable = false)
    private Long scopeId = 0L;

    @Column(name = "total_orders")
    private Integer totalOrders;

    @Column(name = "total_revenue", precision = 14, scale = 2)
    private BigDecimal totalRevenue;

    @Column(name = "total_items_sold")
    private Integer totalItemsSold;

    @Column(name = "distinct_diners")
    private Integer distinctDiners;

    @Column(name = "guest_orders")
    private Integer guestOrders;

    @Column(name = "avg_order_amount", precision = 10, scale = 2)
    private BigDecimal avgOrderAmount;

    @Column(name = "top_menu_items_json", columnDefinition = "JSON")
    private String topMenuItemsJson;

    @Column(name = "top_vendors_json", columnDefinition = "JSON")
    private String topVendorsJson;

    @Column(name = "menu_catalog_json", columnDefinition = "JSON")
    private String menuCatalogJson;

    @Column(name = "hourly_orders_json", columnDefinition = "JSON")
    private String hourlyOrdersJson;

    @Column(name = "reviews_new_count")
    private Integer reviewsNewCount;

    @Column(name = "reviews_avg_rating_that_day", precision = 3, scale = 2)
    private BigDecimal reviewsAvgRatingThatDay;

    @Column(name = "vendors_rating_leaderboard_json", columnDefinition = "JSON")
    private String vendorsRatingLeaderboardJson;

    @Column(name = "posts_dynamics_count")
    private Integer postsDynamicsCount;

    @Column(name = "posts_feedback_count")
    private Integer postsFeedbackCount;

    @Column(name = "posts_feedback_by_type_json", columnDefinition = "JSON")
    private String postsFeedbackByTypeJson;

    @Column(name = "post_comments_count")
    private Integer postCommentsCount;

    @Column(name = "post_likes_count")
    private Integer postLikesCount;

    @Column(name = "hot_posts_json", columnDefinition = "JSON")
    private String hotPostsJson;

    @Column(name = "wordcloud_combined_json", columnDefinition = "JSON")
    private String wordcloudCombinedJson;

    @Column(name = "wordcloud_version", length = 32)
    private String wordcloudVersion;

    @Column(name = "queue_tickets_issued")
    private Integer queueTicketsIssued;

    @Column(name = "queue_by_vendor_json", columnDefinition = "JSON")
    private String queueByVendorJson;

    @Column(name = "ai_conversations_new")
    private Integer aiConversationsNew;

    @Column(name = "ai_messages_count")
    private Integer aiMessagesCount;

    @Column(name = "nutrition_logs_count")
    private Integer nutritionLogsCount;

    @Column(name = "nutrition_totals_json", columnDefinition = "JSON")
    private String nutritionTotalsJson;

    @Column(name = "test_reports_new")
    private Integer testReportsNew;

    @Column(name = "stock_movements_count")
    private Integer stockMovementsCount;

    @Column(name = "computed_at")
    private LocalDateTime computedAt;

    @Column(name = "data_version", nullable = false)
    private Integer dataVersion = 1;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getSnapshotDate() { return snapshotDate; }
    public void setSnapshotDate(LocalDate snapshotDate) { this.snapshotDate = snapshotDate; }
    public String getScopeType() { return scopeType; }
    public void setScopeType(String scopeType) { this.scopeType = scopeType; }
    public Long getScopeId() { return scopeId; }
    public void setScopeId(Long scopeId) { this.scopeId = scopeId; }
    public Integer getTotalOrders() { return totalOrders; }
    public void setTotalOrders(Integer totalOrders) { this.totalOrders = totalOrders; }
    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
    public Integer getTotalItemsSold() { return totalItemsSold; }
    public void setTotalItemsSold(Integer totalItemsSold) { this.totalItemsSold = totalItemsSold; }
    public Integer getDistinctDiners() { return distinctDiners; }
    public void setDistinctDiners(Integer distinctDiners) { this.distinctDiners = distinctDiners; }
    public Integer getGuestOrders() { return guestOrders; }
    public void setGuestOrders(Integer guestOrders) { this.guestOrders = guestOrders; }
    public BigDecimal getAvgOrderAmount() { return avgOrderAmount; }
    public void setAvgOrderAmount(BigDecimal avgOrderAmount) { this.avgOrderAmount = avgOrderAmount; }
    public String getTopMenuItemsJson() { return topMenuItemsJson; }
    public void setTopMenuItemsJson(String topMenuItemsJson) { this.topMenuItemsJson = topMenuItemsJson; }
    public String getTopVendorsJson() { return topVendorsJson; }
    public void setTopVendorsJson(String topVendorsJson) { this.topVendorsJson = topVendorsJson; }
    public String getMenuCatalogJson() { return menuCatalogJson; }
    public void setMenuCatalogJson(String menuCatalogJson) { this.menuCatalogJson = menuCatalogJson; }
    public String getHourlyOrdersJson() { return hourlyOrdersJson; }
    public void setHourlyOrdersJson(String hourlyOrdersJson) { this.hourlyOrdersJson = hourlyOrdersJson; }
    public Integer getReviewsNewCount() { return reviewsNewCount; }
    public void setReviewsNewCount(Integer reviewsNewCount) { this.reviewsNewCount = reviewsNewCount; }
    public BigDecimal getReviewsAvgRatingThatDay() { return reviewsAvgRatingThatDay; }
    public void setReviewsAvgRatingThatDay(BigDecimal reviewsAvgRatingThatDay) { this.reviewsAvgRatingThatDay = reviewsAvgRatingThatDay; }
    public String getVendorsRatingLeaderboardJson() { return vendorsRatingLeaderboardJson; }
    public void setVendorsRatingLeaderboardJson(String vendorsRatingLeaderboardJson) { this.vendorsRatingLeaderboardJson = vendorsRatingLeaderboardJson; }
    public Integer getPostsDynamicsCount() { return postsDynamicsCount; }
    public void setPostsDynamicsCount(Integer postsDynamicsCount) { this.postsDynamicsCount = postsDynamicsCount; }
    public Integer getPostsFeedbackCount() { return postsFeedbackCount; }
    public void setPostsFeedbackCount(Integer postsFeedbackCount) { this.postsFeedbackCount = postsFeedbackCount; }
    public String getPostsFeedbackByTypeJson() { return postsFeedbackByTypeJson; }
    public void setPostsFeedbackByTypeJson(String postsFeedbackByTypeJson) { this.postsFeedbackByTypeJson = postsFeedbackByTypeJson; }
    public Integer getPostCommentsCount() { return postCommentsCount; }
    public void setPostCommentsCount(Integer postCommentsCount) { this.postCommentsCount = postCommentsCount; }
    public Integer getPostLikesCount() { return postLikesCount; }
    public void setPostLikesCount(Integer postLikesCount) { this.postLikesCount = postLikesCount; }
    public String getHotPostsJson() { return hotPostsJson; }
    public void setHotPostsJson(String hotPostsJson) { this.hotPostsJson = hotPostsJson; }
    public String getWordcloudCombinedJson() { return wordcloudCombinedJson; }
    public void setWordcloudCombinedJson(String wordcloudCombinedJson) { this.wordcloudCombinedJson = wordcloudCombinedJson; }
    public String getWordcloudVersion() { return wordcloudVersion; }
    public void setWordcloudVersion(String wordcloudVersion) { this.wordcloudVersion = wordcloudVersion; }
    public Integer getQueueTicketsIssued() { return queueTicketsIssued; }
    public void setQueueTicketsIssued(Integer queueTicketsIssued) { this.queueTicketsIssued = queueTicketsIssued; }
    public String getQueueByVendorJson() { return queueByVendorJson; }
    public void setQueueByVendorJson(String queueByVendorJson) { this.queueByVendorJson = queueByVendorJson; }
    public Integer getAiConversationsNew() { return aiConversationsNew; }
    public void setAiConversationsNew(Integer aiConversationsNew) { this.aiConversationsNew = aiConversationsNew; }
    public Integer getAiMessagesCount() { return aiMessagesCount; }
    public void setAiMessagesCount(Integer aiMessagesCount) { this.aiMessagesCount = aiMessagesCount; }
    public Integer getNutritionLogsCount() { return nutritionLogsCount; }
    public void setNutritionLogsCount(Integer nutritionLogsCount) { this.nutritionLogsCount = nutritionLogsCount; }
    public String getNutritionTotalsJson() { return nutritionTotalsJson; }
    public void setNutritionTotalsJson(String nutritionTotalsJson) { this.nutritionTotalsJson = nutritionTotalsJson; }
    public Integer getTestReportsNew() { return testReportsNew; }
    public void setTestReportsNew(Integer testReportsNew) { this.testReportsNew = testReportsNew; }
    public Integer getStockMovementsCount() { return stockMovementsCount; }
    public void setStockMovementsCount(Integer stockMovementsCount) { this.stockMovementsCount = stockMovementsCount; }
    public LocalDateTime getComputedAt() { return computedAt; }
    public void setComputedAt(LocalDateTime computedAt) { this.computedAt = computedAt; }
    public Integer getDataVersion() { return dataVersion; }
    public void setDataVersion(Integer dataVersion) { this.dataVersion = dataVersion; }
}
