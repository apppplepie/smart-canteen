package com.scs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scs.config.CurrentUserHolder;
import com.scs.dto.ApiResult;
import com.scs.entity.AiConversation;
import com.scs.entity.AiMessage;
import com.scs.entity.Vendor;
import com.scs.repository.AiConversationRepository;
import com.scs.repository.AiMessageRepository;
import com.scs.repository.MenuItemRepository;
import com.scs.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * AI 对话：前端 POST /api/ai/chat 发消息；Spring Boot 存库 → 转发 FastAPI → 存助手回复 → 返回。
 * 数据流：先存用户消息 → 调 FastAPI → 成功后再存助手消息并更新会话时间。
 * 超过 5 轮时：此前对话生成约 500 字小结落库，每次只带「小结 + 最近 5 轮」发给大模型。
 */
@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    private static final Logger log = LoggerFactory.getLogger(AiChatController.class);

    /** 发给大模型的最近轮数（每轮 = 1 user + 1 assistant） */
    private static final int RECENT_ROUNDS = 5;
    private static final int RECENT_MESSAGE_COUNT = RECENT_ROUNDS * 2;

    private final String aiServiceBaseUrl;
    private final ObjectMapper objectMapper;
    private final AiConversationRepository conversationRepo;
    private final AiMessageRepository messageRepo;
    private final UserRepository userRepo;
    private final MenuItemRepository menuItemRepo;

    public AiChatController(
            @Value("${ai.service.base-url:http://localhost:8000}") String aiServiceBaseUrl,
            ObjectMapper objectMapper,
            AiConversationRepository conversationRepo,
            AiMessageRepository messageRepo,
            UserRepository userRepo,
            MenuItemRepository menuItemRepo) {
        this.aiServiceBaseUrl = (aiServiceBaseUrl != null && !aiServiceBaseUrl.isBlank())
                ? aiServiceBaseUrl.trim().replaceAll("/$", "") : "http://localhost:8000";
        log.info("[AI] 使用 ai.service.base-url={}", this.aiServiceBaseUrl);
        this.objectMapper = objectMapper;
        this.conversationRepo = conversationRepo;
        this.messageRepo = messageRepo;
        this.userRepo = userRepo;
        this.menuItemRepo = menuItemRepo;
    }

    private static final String DEFAULT_MEAL_IMAGE =
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop";

    private static String formatPrepTimeMinutes(Integer prepTimeSeconds) {
        if (prepTimeSeconds == null || prepTimeSeconds <= 0) {
            return "约 10 分钟";
        }
        int minutes = (prepTimeSeconds + 59) / 60;
        return "约 " + minutes + " 分钟";
    }

    /**
     * 从 FastAPI 返回的 tool_calls 中解析最后一次 recommend_meal_card 的 menu_item_id。
     */
    private Long parseRecommendedMenuItemId(Object toolCallsObj) {
        if (!(toolCallsObj instanceof List<?> list) || list.isEmpty()) {
            return null;
        }
        for (int i = list.size() - 1; i >= 0; i--) {
            Object el = list.get(i);
            if (!(el instanceof Map<?, ?> tc)) {
                continue;
            }
            Object name = tc.get("name");
            if (name == null || !"recommend_meal_card".contentEquals(name.toString())) {
                continue;
            }
            Object argsObj = tc.get("args");
            if (!(argsObj instanceof Map<?, ?> args)) {
                continue;
            }
            Object mid = args.get("menu_item_id");
            if (mid == null) {
                mid = args.get("menuItemId");
            }
            if (mid == null) {
                continue;
            }
            try {
                if (mid instanceof Number n) {
                    return n.longValue();
                }
                return Long.parseLong(mid.toString().trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private Map<String, Object> buildMealCardPayload(Long menuItemId) {
        if (menuItemId == null) {
            return null;
        }
        return menuItemRepo.findByIdWithVendor(menuItemId)
                .filter(mi -> Boolean.TRUE.equals(mi.getIsAvailable()))
                .map(mi -> {
                    Vendor v = mi.getVendor();
                    String merchantName = v != null && v.getName() != null ? v.getName() : "食堂档口";
                    String location = v != null && v.getLocationLabel() != null && !v.getLocationLabel().isBlank()
                            ? v.getLocationLabel()
                            : "食堂";
                    double rating = 4.5;
                    if (v != null && v.getRatingAvg() != null) {
                        rating = Math.round(v.getRatingAvg() * 10.0) / 10.0;
                    }
                    String image = DEFAULT_MEAL_IMAGE;
                    if (mi.getImageUrl() != null && !mi.getImageUrl().isBlank()) {
                        image = mi.getImageUrl();
                    } else if (v != null && v.getImageUrl() != null && !v.getImageUrl().isBlank()) {
                        image = v.getImageUrl();
                    }
                    return Map.<String, Object>of(
                            "menuItemId", mi.getId(),
                            "merchantName", merchantName,
                            "dishName", mi.getName() != null ? mi.getName() : "推荐菜品",
                            "rating", rating,
                            "time", formatPrepTimeMinutes(mi.getPrepTimeSeconds()),
                            "image", image,
                            "locationLabel", location
                    );
                })
                .orElse(null);
    }

    @GetMapping(value = {"", "/health"}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResult<Map<String, String>> health() {
        return ApiResult.ok(Map.of("service", "scs-backend", "ai", "ok", "chat", "POST /api/ai/chat"));
    }

    @GetMapping(value = "/chat", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResult<Map<String, String>> chatGet() {
        return ApiResult.ok(Map.of("message", "请用 POST 发送 messages，本接口不接受 GET"));
    }

    /**
     * POST /api/ai/tts/synthesize — 转发 FastAPI 文本转语音（大屏豆包播报）。
     * body: { "text": "...", "voice": 可选, "speed": 可选 }
     */
    @PostMapping(value = "/tts/synthesize", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResult<Map<String, Object>> ttsSynthesize(@RequestBody Map<String, Object> body) {
        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<byte[]> entity = new HttpEntity<>(jsonBody.getBytes(StandardCharsets.UTF_8), headers);
            RestTemplate rest = new RestTemplate();
            String responseBody = rest.postForObject(aiServiceBaseUrl + "/api/tts/synthesize", entity, String.class);
            if (responseBody == null || responseBody.isBlank()) {
                return ApiResult.fail(502, "TTS 返回为空");
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> out = objectMapper.readValue(responseBody, Map.class);
            return ApiResult.ok(out);
        } catch (HttpStatusCodeException e) {
            String detail = parseFastApiDetail(e.getResponseBodyAsString());
            return ApiResult.fail(e.getStatusCode().value(), detail != null ? detail : e.getMessage());
        } catch (Exception e) {
            log.warn("[AI tts] 调用失败: {}", e.getMessage());
            return ApiResult.fail(502, "TTS 服务不可用: " + e.getMessage());
        }
    }

    /**
     * 调用 AI 服务将用户首条消息总结为 8 字以内标题；失败则返回 null（沿用「新对话」）。
     */
    private String fetchSuggestedTitle(String firstUserMessage) {
        if (firstUserMessage == null || firstUserMessage.isBlank()) return null;
        try {
            String jsonBody = objectMapper.writeValueAsString(Map.of("message", firstUserMessage));
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<byte[]> entity = new HttpEntity<>(jsonBody.getBytes(StandardCharsets.UTF_8), headers);
            RestTemplate rest = new RestTemplate();
            String responseBody = rest.postForObject(aiServiceBaseUrl + "/api/chat/suggest-title", entity, String.class);
            if (responseBody == null) return null;
            @SuppressWarnings("unchecked")
            Map<String, Object> map = objectMapper.readValue(responseBody, Map.class);
            Object title = map != null ? map.get("title") : null;
            if (title != null) {
                String s = title.toString().trim();
                if (s.length() > 8) s = s.substring(0, 8);
                return s.isBlank() ? null : s;
            }
        } catch (Exception e) {
            log.warn("[AI chat] suggest-title 调用失败: {}", e.getMessage());
        }
        return null;
    }

    /**
     * 调用 AI 服务将一段对话总结为约 500 字小结；失败则返回空字符串。
     */
    private String fetchConversationSummary(List<Map<String, String>> oldMessages) {
        if (oldMessages == null || oldMessages.isEmpty()) return "";
        try {
            String jsonBody = objectMapper.writeValueAsString(Map.of("messages", oldMessages));
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<byte[]> entity = new HttpEntity<>(jsonBody.getBytes(StandardCharsets.UTF_8), headers);
            RestTemplate rest = new RestTemplate();
            String responseBody = rest.postForObject(aiServiceBaseUrl + "/api/chat/summarize", entity, String.class);
            if (responseBody == null) {
                log.warn("[AI chat] summarize 返回 body 为空");
                return "";
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> map = objectMapper.readValue(responseBody, Map.class);
            Object summary = map != null ? map.get("summary") : null;
            String result = summary != null ? summary.toString().trim() : "";
            if (result.isEmpty()) {
                log.warn("[AI chat] summarize 返回无 summary 或为空, responseKeys={}", map != null ? map.keySet() : "null");
            } else {
                log.info("[AI chat] summarize 成功, 摘要长度={}", result.length());
            }
            return result;
        } catch (Exception e) {
            log.warn("[AI chat] summarize 调用失败: {}", e.getMessage());
            return "";
        }
    }

    /**
     * 从 FastAPI 错误响应体解析 detail（字符串或校验数组），用于返回给前端的错误信息。
     */
    private String parseFastApiDetail(String body) {
        if (body == null || body.isBlank()) return null;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> map = objectMapper.readValue(body, Map.class);
            Object detail = map.get("detail");
            if (detail == null) return null;
            if (detail instanceof String s) return s;
            if (detail instanceof List<?> list && !list.isEmpty()) {
                Object first = list.get(0);
                if (first instanceof Map<?, ?> m && m.get("msg") != null) return String.valueOf(m.get("msg"));
                return first.toString();
            }
            return detail.toString();
        } catch (Exception ignored) {
            return null;
        }
    }

    /**
     * POST /api/ai/chat
     * body: { "messages": [...], "conversationId": 可选, "userId": 可选 }
     * 流程：取/建会话 → 存用户消息 → 转发 FastAPI → 存助手消息 → 返回 content + conversationId
     */
    @PostMapping(value = "/chat", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResult<Map<String, Object>> chat(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        @SuppressWarnings("unchecked")
        List<Map<String, String>> messages = (List<Map<String, String>>) body.get("messages");
        if (messages == null || messages.isEmpty()) {
            return ApiResult.fail(400, "messages 不能为空");
        }

        Long conversationId = body.get("conversationId") != null ? ((Number) body.get("conversationId")).longValue() : null;
        Long userId = body.get("userId") != null ? ((Number) body.get("userId")).longValue() : null;
        // 未传 body.userId 时从请求头 X-User-Id 取
        if (userId == null && request != null) {
            String header = request.getHeader("X-User-Id");
            if (header != null && !header.isBlank()) {
                try {
                    userId = Long.parseLong(header.trim());
                } catch (NumberFormatException ignored) {
                }
            }
        }
        // 仍未传时：从全局解析的 token 取当前登录用户，用 username 查库得到 userId（兼容不传 token 的前端则 userId 保持 null）
        if (userId == null) {
            userId = CurrentUserHolder.getCurrentSessionUser(request)
                    .flatMap(su -> userRepo.findByUsername(su.username()).map(u -> u.getId()))
                    .orElse(null);
        }
        // clientType: admin | screen | mobile，供 AI 服务区分 Agent 与 Tool 白名单（admin 需 RBAC）
        String clientType = body.get("clientType") != null ? body.get("clientType").toString().trim().toLowerCase() : "mobile";
        if (!List.of("admin", "screen", "mobile").contains(clientType)) {
            clientType = "mobile";
        }
        // admin 时 role：请求体可带 role，否则按 userId 查库，再否则从当前会话用户取
        String role = body.get("role") != null ? body.get("role").toString().trim() : null;
        if (role == null && userId != null) {
            role = userRepo.findById(userId).map(u -> u.getRole() != null ? u.getRole() : "guest").orElse("guest");
        }
        if (role == null) {
            role = CurrentUserHolder.getCurrentSessionUser(request).map(su -> su.role()).orElse("guest");
        }

        String lastUserContent = messages.stream()
                .filter(m -> "user".equals(m.get("role")))
                .reduce((a, b) -> b)
                .map(m -> m.get("content"))
                .orElse("");
        log.info("[AI chat] 消息数: {}, conversationId: {}, 最后(user): {}", messages.size(), conversationId, lastUserContent);

        boolean isNewConversation = (conversationId == null);
        AiConversation conversation;
        if (!isNewConversation) {
            conversation = conversationRepo.findById(Objects.requireNonNull(conversationId)).orElse(null);
            if (conversation == null) {
                return ApiResult.fail(404, "会话不存在");
            }
        } else {
            conversation = new AiConversation();
            if (userId != null) {
                userRepo.findById(userId).ifPresent(conversation::setUser);
            }
            conversation.setTitle("新对话"); // 先占位，AI 回复后再用 suggest-title 更新为 8 字内标题
            conversation = conversationRepo.save(conversation);
        }

        int nextOrder = messageRepo.findMaxSortOrderByConversationId(conversation.getId()) + 1;
        AiMessage userMsg = new AiMessage();
        userMsg.setConversation(conversation);
        userMsg.setRole("user");
        userMsg.setContent(lastUserContent);
        userMsg.setSortOrder(nextOrder);
        messageRepo.save(userMsg);

        try {
            List<AiMessage> allMessages = messageRepo.findByConversation_IdOrderBySortOrderAscCreatedAtAsc(conversation.getId());
            List<Map<String, String>> historyMaps = allMessages.stream()
                    .filter(m -> "user".equals(m.getRole()) || "assistant".equals(m.getRole()))
                    .map(m -> Map.<String, String>of("role", m.getRole(), "content", m.getContent() != null ? m.getContent() : ""))
                    .collect(Collectors.toList());

            String contextSummary = conversation.getContextSummary();
            Integer summaryCount = conversation.getContextSummaryMessageCount();
            if (historyMaps.size() > RECENT_MESSAGE_COUNT) {
                int oldCount = historyMaps.size() - RECENT_MESSAGE_COUNT;
                if (contextSummary == null || contextSummary.isEmpty() || summaryCount == null || summaryCount != oldCount) {
                    log.info("[AI chat] 需要摘要: conversationId={}, 总消息数={}, 待摘要条数={}", conversation.getId(), historyMaps.size(), oldCount);
                    List<Map<String, String>> toSummarize = historyMaps.subList(0, oldCount);
                    contextSummary = fetchConversationSummary(toSummarize);
                    if (contextSummary != null && !contextSummary.isEmpty()) {
                        conversation.setContextSummary(contextSummary);
                        conversation.setContextSummaryMessageCount(oldCount);
                        conversationRepo.save(conversation);
                        log.info("[AI chat] 已生成并落库 context_summary, conversationId={}, 覆盖消息数={}", conversation.getId(), oldCount);
                    } else {
                        log.warn("[AI chat] 摘要生成为空或失败，未写入 context_summary, conversationId={}, 待摘要消息数={}", conversation.getId(), oldCount);
                    }
                }
            }

            List<Map<String, String>> messagesToSend = historyMaps.size() <= RECENT_MESSAGE_COUNT
                    ? historyMaps
                    : historyMaps.subList(historyMaps.size() - RECENT_MESSAGE_COUNT, historyMaps.size());

            Map<String, Object> forwardBody = new java.util.HashMap<>(Map.of("messages", messagesToSend, "clientType", clientType));
            if (userId != null) {
                forwardBody.put("userId", userId);
            }
            if (role != null && !role.isBlank()) {
                forwardBody.put("role", role);
            }
            if (contextSummary != null && !contextSummary.isEmpty()) {
                forwardBody.put("context_summary", contextSummary);
            }
            String jsonBody = objectMapper.writeValueAsString(forwardBody);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<byte[]> entity = new HttpEntity<>(jsonBody.getBytes(StandardCharsets.UTF_8), headers);
            String chatUrl = aiServiceBaseUrl + "/api/chat";
            log.info("[AI chat] 步骤 1/2 即将请求 FastAPI url={}, bodySize={}", chatUrl, jsonBody.length());
            RestTemplate restTemplate = new RestTemplate();
            String responseBody = restTemplate.postForObject(chatUrl, entity, String.class);
            log.info("[AI chat] 步骤 2/2 FastAPI 返回 responseLength={}", responseBody != null ? responseBody.length() : 0);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = responseBody != null ? objectMapper.readValue(responseBody, Map.class) : null;
            String content = response != null && response.get("content") != null
                    ? response.get("content").toString()
                    : "";

            AiMessage assistantMsg = new AiMessage();
            assistantMsg.setConversation(conversation);
            assistantMsg.setRole("assistant");
            assistantMsg.setContent(content);
            assistantMsg.setSortOrder(nextOrder + 1);
            if (response != null) {
                Object toolCallsObj = response.get("tool_calls");
                if (toolCallsObj != null && (toolCallsObj instanceof List<?> list) && !list.isEmpty()) {
                    try {
                        assistantMsg.setToolCalls(objectMapper.writeValueAsString(toolCallsObj));
                    } catch (Exception ignored) {}
                }
                Object suggestionsObj = response.get("suggestions");
                if (suggestionsObj != null && (suggestionsObj instanceof List<?> list) && !list.isEmpty()) {
                    try {
                        assistantMsg.setSuggestions(objectMapper.writeValueAsString(suggestionsObj));
                    } catch (Exception ignored) {}
                }
            }
            messageRepo.save(assistantMsg);

            if (isNewConversation) {
                String suggestedTitle = fetchSuggestedTitle(lastUserContent);
                if (suggestedTitle != null && !suggestedTitle.isBlank()) {
                    conversation.setTitle(suggestedTitle);
                }
            }
            conversationRepo.save(conversation);

            Long convId = conversation.getId();
            log.info("[AI chat] 助手回复已存库, conversationId={}", convId);

            Long recommendedId = parseRecommendedMenuItemId(response != null ? response.get("tool_calls") : null);
            Map<String, Object> mealCard = buildMealCardPayload(recommendedId);
            if (recommendedId != null && mealCard == null) {
                log.warn("[AI chat] recommend_meal_card menu_item_id={} 未找到可用菜品，忽略卡片", recommendedId);
            }

            Map<String, Object> data = new java.util.LinkedHashMap<>();
            data.put("content", content);
            data.put("conversationId", convId);
            if (mealCard != null) {
                data.put("mealCard", mealCard);
            }
            return ApiResult.ok(data);
        } catch (HttpStatusCodeException e) {
            int status = e.getStatusCode().value();
            String errorBody = e.getResponseBodyAsString();
            String message = parseFastApiDetail(errorBody);
            if (message == null) message = "AI 服务返回 " + status + ": " + (e.getMessage() != null ? e.getMessage() : errorBody);
            log.warn("[AI chat] FastAPI 错误 url={}, status={}, body={}, message={}", aiServiceBaseUrl + "/api/chat", status, errorBody, message);
            saveErrorMessage(conversation, nextOrder + 1, message);
            return ApiResult.fail(status >= 400 && status < 600 ? status : 502, message);
        } catch (Exception e) {
            String message = "AI 服务不可用: " + e.getMessage();
            log.warn("[AI chat] 连接失败 url={}, 错误: {} ({})", aiServiceBaseUrl + "/api/chat", e.getMessage(), e.getClass().getSimpleName());
            saveErrorMessage(conversation, nextOrder + 1, message);
            return ApiResult.fail(502, message);
        }
    }

    /** 将错误信息存为一条 assistant 消息，保证会话历史与用户所见一致 */
    private void saveErrorMessage(AiConversation conversation, int sortOrder, String message) {
        try {
            AiMessage errMsg = new AiMessage();
            errMsg.setConversation(conversation);
            errMsg.setRole("assistant");
            errMsg.setContent(message);
            errMsg.setSortOrder(sortOrder);
            messageRepo.save(errMsg);
            conversation.setTitle(conversation.getTitle());
            conversationRepo.save(conversation);
        } catch (Exception ex) {
            log.warn("[AI chat] 存库错误消息失败: {}", ex.getMessage());
        }
    }

    /**
     * GET /api/ai/conversations?userId= &amp; clientId= 会话列表，按 updated_at 倒序。
     * userId 优先取 query，未传时从请求头 X-User-Id 解析；都没有则可用 clientId（如 screen）取无用户会话列表。
     */
    @GetMapping(value = "/conversations", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResult<List<Map<String, Object>>> listConversations(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String clientId,
            HttpServletRequest request) {
        if (userId == null && request != null) {
            String header = request.getHeader("X-User-Id");
            if (header != null && !header.isBlank()) {
                try {
                    userId = Long.parseLong(header.trim());
                } catch (NumberFormatException ignored) {
                }
            }
        }
        if (userId == null) {
            userId = CurrentUserHolder.getCurrentSessionUser(request)
                    .flatMap(su -> userRepo.findByUsername(su.username()).map(u -> u.getId()))
                    .orElse(null);
        }
        if (clientId == null && request != null) {
            String h = request.getHeader("X-Client-Id");
            if (h != null && !h.isBlank()) clientId = h.trim();
        }
        List<AiConversation> list;
        if (userId != null) {
            list = conversationRepo.findByUser_IdOrderByUpdatedAtDesc(userId);
        } else if (clientId != null && !clientId.isBlank()) {
            list = conversationRepo.findByUser_IdIsNullOrderByUpdatedAtDesc();
        } else {
            list = List.of();
        }
        List<Map<String, Object>> data = list.stream().map(c -> Map.<String, Object>of(
                "id", c.getId(),
                "title", c.getTitle() != null ? c.getTitle() : "新对话",
                "updatedAt", c.getUpdatedAt().toString()
        )).collect(Collectors.toList());
        return ApiResult.ok(data);
    }

    /**
     * GET /api/ai/conversations/{id}/messages 某会话的消息列表，按 sort_order/created_at 正序
     */
    @GetMapping(value = "/conversations/{id}/messages", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResult<List<Map<String, Object>>> listMessages(@PathVariable Long id) {
        if (id == null) return ApiResult.fail(400, "会话 id 不能为空");
        Optional<AiConversation> conv = conversationRepo.findById(id);
        if (conv.isEmpty()) {
            return ApiResult.fail(404, "会话不存在");
        }
        List<AiMessage> messages = messageRepo.findByConversation_IdOrderBySortOrderAscCreatedAtAsc(id);
        List<Map<String, Object>> data = messages.stream()
                .filter(m -> "user".equals(m.getRole()) || "assistant".equals(m.getRole()))
                .map(m -> {
                    Map<String, Object> map = new java.util.HashMap<>(Map.of(
                            "id", m.getId(),
                            "role", m.getRole(),
                            "content", m.getContent() != null ? m.getContent() : ""
                    ));
                    if (m.getSuggestions() != null && !m.getSuggestions().isEmpty()) {
                        try {
                            @SuppressWarnings("unchecked")
                            List<String> sug = objectMapper.readValue(m.getSuggestions(), List.class);
                            map.put("suggestions", sug);
                        } catch (Exception ignored) {}
                    }
                    if (m.getToolCalls() != null && !m.getToolCalls().isEmpty()) {
                        try {
                            @SuppressWarnings("unchecked")
                            List<Map<String, Object>> tc = objectMapper.readValue(m.getToolCalls(), List.class);
                            map.put("tool_calls", tc);
                        } catch (Exception ignored) {}
                    }
                    return map;
                })
                .collect(Collectors.toList());
        return ApiResult.ok(data);
    }
}
