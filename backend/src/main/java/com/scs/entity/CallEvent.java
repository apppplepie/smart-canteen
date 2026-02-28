package com.scs.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "call_events")
public class CallEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "queue_entry_id")
    @JsonIgnore
    private QueueEntry queueEntry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id")
    @JsonIgnore
    private Vendor vendor;

    @Transient
    private Long queueEntryId;
    @Transient
    private Long vendorId;

    @Column(name = "event_type", length = 32)
    private String eventType;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public QueueEntry getQueueEntry() { return queueEntry; }
    public void setQueueEntry(QueueEntry queueEntry) { this.queueEntry = queueEntry; }
    public Vendor getVendor() { return vendor; }
    public void setVendor(Vendor vendor) { this.vendor = vendor; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Long getQueueEntryId() { return queueEntryId != null ? queueEntryId : (queueEntry != null ? queueEntry.getId() : null); }
    public void setQueueEntryId(Long queueEntryId) { this.queueEntryId = queueEntryId; }
    public Long getVendorId() { return vendorId != null ? vendorId : (vendor != null ? vendor.getId() : null); }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }
}
