package com.scs.controller.v1;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scs.dto.ApiResult;
import com.scs.entity.*;
import com.scs.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.util.*;

/**
 * 统一提供所有表的增删改查，供 admin 使用。路径：/api/v1/data/{table}
 */
@RestController
@RequestMapping("/api/v1/data")
public class V1DataController {

    private final ObjectMapper objectMapper;
    private final UserRepository userRepo;
    private final VendorRepository vendorRepo;
    private final PostRepository postRepo;
    private final OrderRepository orderRepo;
    private final OrderItemRepository orderItemRepo;
    private final MenuItemRepository menuItemRepo;
    private final AgentRequestRepository agentRequestRepo;
    private final AuditLogRepository auditLogRepo;
    private final CallEventRepository callEventRepo;
    private final NutritionLogRepository nutritionLogRepo;
    private final QueueEntryRepository queueEntryRepo;
    private final RetainedSampleRepository retainedSampleRepo;
    private final SensorLogRepository sensorLogRepo;
    private final StockMovementRepository stockMovementRepo;
    private final TestReportRepository testReportRepo;
    private final AiConversationRepository aiConversationRepo;
    private final AiMessageRepository aiMessageRepo;

    private final Map<String, JpaRepository<?, Long>> repoMap = new HashMap<>();
    private final Map<String, Class<?>> entityClassMap = new HashMap<>();

    public V1DataController(ObjectMapper objectMapper,
                            UserRepository userRepo, VendorRepository vendorRepo,
                            PostRepository postRepo, OrderRepository orderRepo, OrderItemRepository orderItemRepo,
                            MenuItemRepository menuItemRepo, AgentRequestRepository agentRequestRepo,
                            AuditLogRepository auditLogRepo, CallEventRepository callEventRepo,
                            NutritionLogRepository nutritionLogRepo, QueueEntryRepository queueEntryRepo,
                            RetainedSampleRepository retainedSampleRepo, SensorLogRepository sensorLogRepo,
                            StockMovementRepository stockMovementRepo, TestReportRepository testReportRepo,
                            AiConversationRepository aiConversationRepo, AiMessageRepository aiMessageRepo) {
        this.objectMapper = objectMapper;
        this.userRepo = userRepo;
        this.vendorRepo = vendorRepo;
        this.postRepo = postRepo;
        this.orderRepo = orderRepo;
        this.orderItemRepo = orderItemRepo;
        this.menuItemRepo = menuItemRepo;
        this.agentRequestRepo = agentRequestRepo;
        this.auditLogRepo = auditLogRepo;
        this.callEventRepo = callEventRepo;
        this.nutritionLogRepo = nutritionLogRepo;
        this.queueEntryRepo = queueEntryRepo;
        this.retainedSampleRepo = retainedSampleRepo;
        this.sensorLogRepo = sensorLogRepo;
        this.stockMovementRepo = stockMovementRepo;
        this.testReportRepo = testReportRepo;
        this.aiConversationRepo = aiConversationRepo;
        this.aiMessageRepo = aiMessageRepo;
    }

    @PostConstruct
    void init() {
        put("users", userRepo, User.class);
        put("vendors", vendorRepo, Vendor.class);
        put("posts", postRepo, Post.class);
        put("orders", orderRepo, Order.class);
        put("order_items", orderItemRepo, OrderItem.class);
        put("menu_items", menuItemRepo, MenuItem.class);
        put("agent_requests", agentRequestRepo, AgentRequest.class);
        put("audit_logs", auditLogRepo, AuditLog.class);
        put("call_events", callEventRepo, CallEvent.class);
        put("nutrition_logs", nutritionLogRepo, NutritionLog.class);
        put("queue_entries", queueEntryRepo, QueueEntry.class);
        put("retained_samples", retainedSampleRepo, RetainedSample.class);
        put("sensor_logs", sensorLogRepo, SensorLog.class);
        put("stock_movements", stockMovementRepo, StockMovement.class);
        put("test_reports", testReportRepo, TestReport.class);
        put("ai_conversations", aiConversationRepo, AiConversation.class);
        put("ai_messages", aiMessageRepo, AiMessage.class);
    }

    private void put(String table, JpaRepository<?, Long> repo, Class<?> entityClass) {
        repoMap.put(table, repo);
        entityClassMap.put(table, entityClass);
    }

    @GetMapping("/{table}")
    public ApiResult<Map<String, Object>> list(
            @PathVariable String table,
            @RequestParam(defaultValue = "1") int currentPage,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        int pageIndex = Math.max(0, currentPage - 1);
        int pageSize = Math.min(100, size);
        var pageRequest = PageRequest.of(pageIndex, pageSize);
        if ("users".equals(table)) {
            var page = (keyword != null && !keyword.isBlank())
                    ? userRepo.findByIsDeletedFalseAndUsernameContainingOrPhoneContaining(keyword.trim(), keyword.trim(), pageRequest)
                    : userRepo.findByIsDeletedFalse(pageRequest);
            return ApiResult.ok(Map.<String, Object>of("list", page.getContent(), "total", page.getTotalElements()));
        }
        JpaRepository<?, Long> repo = repoMap.get(table);
        if (repo == null) return ApiResult.fail(404, "表不存在: " + table);
        var page = repo.findAll(pageRequest);
        return ApiResult.ok(Map.<String, Object>of("list", page.getContent(), "total", page.getTotalElements()));
    }

    @GetMapping("/{table}/{id}")
    public ApiResult<Object> get(@PathVariable String table, @PathVariable Long id) {
        JpaRepository<?, Long> repo = repoMap.get(table);
        if (repo == null) return ApiResult.fail(404, "表不存在: " + table);
        var opt = repo.findById(id);
        if (opt.isEmpty()) return ApiResult.fail(404, "记录不存在");
        return ApiResult.<Object>ok(opt.get());
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/{table}")
    public ApiResult<Object> create(@PathVariable String table, @RequestBody Map<String, Object> body) {
        JpaRepository<Object, Long> repo = (JpaRepository<Object, Long>) repoMap.get(table);
        Class<?> clazz = entityClassMap.get(table);
        if (repo == null || clazz == null) return ApiResult.fail(404, "表不存在: " + table);
        body.remove("id");
        Object entity = objectMapper.convertValue(body, clazz);
        resolveRelations(table, entity);
        Object saved = repo.save(entity);
        return ApiResult.ok(saved);
    }

    @SuppressWarnings("unchecked")
    @PutMapping("/{table}/{id}")
    public ApiResult<Object> update(@PathVariable String table, @PathVariable Long id, @RequestBody Map<String, Object> body) {
        JpaRepository<Object, Long> repo = (JpaRepository<Object, Long>) repoMap.get(table);
        Class<?> clazz = entityClassMap.get(table);
        if (repo == null || clazz == null) return ApiResult.fail(404, "表不存在: " + table);
        Object existing = repo.findById(id).orElse(null);
        if (existing == null) return ApiResult.fail(404, "记录不存在");
        body.put("id", id);
        Object entity = objectMapper.convertValue(body, clazz);
        copyTimestamp(table, existing, entity);
        resolveRelations(table, entity);
        Object saved = repo.save(entity);
        return ApiResult.ok(saved);
    }

    @DeleteMapping("/{table}/{id}")
    public ApiResult<Void> delete(@PathVariable String table, @PathVariable Long id) {
        if ("users".equals(table)) {
            userRepo.findById(id).ifPresent(u -> {
                u.setIsDeleted(true);
                userRepo.save(u);
            });
            return ApiResult.ok(null);
        }
        JpaRepository<?, Long> repo = repoMap.get(table);
        if (repo == null) return ApiResult.fail(404, "表不存在: " + table);
        if (!repo.existsById(id)) return ApiResult.fail(404, "记录不存在");
        repo.deleteById(id);
        return ApiResult.ok(null);
    }

    private void copyTimestamp(String table, Object existing, Object entity) {
        try {
            if (entity instanceof User u && existing instanceof User e) {
                u.setCreatedAt(e.getCreatedAt());
            } else if (entity instanceof Post p && existing instanceof Post e) {
                p.setCreatedAt(e.getCreatedAt());
            } else if (entity instanceof Order o && existing instanceof Order e) {
                o.setPlacedAt(e.getPlacedAt());
            } else if (entity instanceof OrderItem o && existing instanceof OrderItem e) {
                o.setCreatedAt(e.getCreatedAt());
            } else if (entity instanceof MenuItem m && existing instanceof MenuItem e) {
                m.setCreatedAt(e.getCreatedAt());
            } else if (entity instanceof AgentRequest a && existing instanceof AgentRequest e) {
                a.setCreatedAt(e.getCreatedAt());
            } else if (entity instanceof RetainedSample r && existing instanceof RetainedSample e) {
                r.setCreatedAt(e.getCreatedAt());
            } else if (entity instanceof StockMovement s && existing instanceof StockMovement e) {
                s.setCreatedAt(e.getCreatedAt());
            } else if (entity instanceof TestReport t && existing instanceof TestReport e) {
                t.setCreatedAt(e.getCreatedAt());
            } else if (entity instanceof AiConversation a && existing instanceof AiConversation e) {
                a.setCreatedAt(e.getCreatedAt());
                a.setUpdatedAt(e.getUpdatedAt());
            } else if (entity instanceof AiMessage a && existing instanceof AiMessage e) {
                a.setCreatedAt(e.getCreatedAt());
            }
        } catch (Exception ignored) {}
    }

    private void resolveRelations(String table, Object entity) {
        if (entity instanceof Post e) {
            if (e.getUserId() != null) userRepo.findById(e.getUserId()).ifPresent(e::setUser);
            if (e.getVendorId() != null) vendorRepo.findById(e.getVendorId()).ifPresent(e::setVendor);
        } else if (entity instanceof Order e) {
            if (e.getUserId() != null) userRepo.findById(e.getUserId()).ifPresent(e::setUser);
            if (e.getVendorId() != null) vendorRepo.findById(e.getVendorId()).ifPresent(e::setVendor);
        } else if (entity instanceof OrderItem e) {
            if (e.getOrderId() != null) orderRepo.findById(e.getOrderId()).ifPresent(e::setOrder);
            if (e.getMenuItemId() != null) menuItemRepo.findById(e.getMenuItemId()).ifPresent(e::setMenuItem);
        } else if (entity instanceof MenuItem e) {
            if (e.getVendorId() != null) vendorRepo.findById(e.getVendorId()).ifPresent(e::setVendor);
        } else if (entity instanceof AgentRequest e) {
            if (e.getUserId() != null) userRepo.findById(e.getUserId()).ifPresent(e::setUser);
        } else if (entity instanceof CallEvent e) {
            if (e.getVendorId() != null) vendorRepo.findById(e.getVendorId()).ifPresent(e::setVendor);
            if (e.getQueueEntryId() != null) queueEntryRepo.findById(e.getQueueEntryId()).ifPresent(e::setQueueEntry);
        } else if (entity instanceof NutritionLog e) {
            if (e.getUserId() != null) userRepo.findById(e.getUserId()).ifPresent(e::setUser);
            if (e.getOrderId() != null) orderRepo.findById(e.getOrderId()).ifPresent(e::setOrder);
        } else if (entity instanceof QueueEntry e) {
            if (e.getVendorId() != null) vendorRepo.findById(e.getVendorId()).ifPresent(e::setVendor);
            if (e.getUserId() != null) userRepo.findById(e.getUserId()).ifPresent(e::setUser);
        } else if (entity instanceof RetainedSample e) {
            if (e.getVendorId() != null) vendorRepo.findById(e.getVendorId()).ifPresent(e::setVendor);
        } else if (entity instanceof StockMovement e) {
            if (e.getVendorId() != null) vendorRepo.findById(e.getVendorId()).ifPresent(e::setVendor);
        } else if (entity instanceof TestReport e) {
            if (e.getVendorId() != null) vendorRepo.findById(e.getVendorId()).ifPresent(e::setVendor);
        } else if (entity instanceof AiConversation e) {
            if (e.getUserId() != null) userRepo.findById(e.getUserId()).ifPresent(e::setUser);
        } else if (entity instanceof AiMessage e) {
            if (e.getConversationId() != null) aiConversationRepo.findById(e.getConversationId()).ifPresent(e::setConversation);
        }
    }
}
