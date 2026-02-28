package com.scs.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "queue_entries")
public class QueueEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    @JsonIgnore
    private Vendor vendor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    @Transient
    private Long vendorId;
    @Transient
    private Long userId;

    @Column(name = "queue_number", nullable = false, length = 32)
    private String queueNumber;

    @Column(length = 32)
    private String status = "waiting";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "called_at")
    private LocalDateTime calledAt;

    @Column(name = "served_at")
    private LocalDateTime servedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Vendor getVendor() { return vendor; }
    public void setVendor(Vendor vendor) { this.vendor = vendor; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getQueueNumber() { return queueNumber; }
    public void setQueueNumber(String queueNumber) { this.queueNumber = queueNumber; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getCalledAt() { return calledAt; }
    public void setCalledAt(LocalDateTime calledAt) { this.calledAt = calledAt; }
    public LocalDateTime getServedAt() { return servedAt; }
    public void setServedAt(LocalDateTime servedAt) { this.servedAt = servedAt; }
    public Long getVendorId() { return vendorId != null ? vendorId : (vendor != null ? vendor.getId() : null); }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }
    public Long getUserId() { return userId != null ? userId : (user != null ? user.getId() : null); }
    public void setUserId(Long userId) { this.userId = userId; }
}
