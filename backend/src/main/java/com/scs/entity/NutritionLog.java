package com.scs.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "nutrition_logs")
public class NutritionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    @JsonIgnore
    private Order order;

    @Transient
    private Long userId;
    @Transient
    private Long orderId;

    private Integer calories;
    private Float protein;
    private Float fat;
    private Float carbs;

    @Column(name = "recorded_at")
    private LocalDateTime recordedAt;

    @PrePersist
    protected void onCreate() {
        if (recordedAt == null) recordedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }
    public Integer getCalories() { return calories; }
    public void setCalories(Integer calories) { this.calories = calories; }
    public Float getProtein() { return protein; }
    public void setProtein(Float protein) { this.protein = protein; }
    public Float getFat() { return fat; }
    public void setFat(Float fat) { this.fat = fat; }
    public Float getCarbs() { return carbs; }
    public void setCarbs(Float carbs) { this.carbs = carbs; }
    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; }
    public Long getUserId() { return userId != null ? userId : (user != null ? user.getId() : null); }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getOrderId() { return orderId != null ? orderId : (order != null ? order.getId() : null); }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
}
