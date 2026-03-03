package com.scs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scs.dto.ApiResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * 最简单：只接前端消息，原样转发给 FastAPI ai-service，把返回的 content 带回前端。
 * 前端 POST /api/ai/chat，body: { "messages": [ { "role", "content" } ] }
 */
@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    private static final Logger log = LoggerFactory.getLogger(AiChatController.class);

    private final String aiServiceBaseUrl;
    private final ObjectMapper objectMapper;

    public AiChatController(
            @Value("${ai.service.base-url:http://localhost:8000}") String aiServiceBaseUrl,
            ObjectMapper objectMapper) {
        this.aiServiceBaseUrl = aiServiceBaseUrl;
        this.objectMapper = objectMapper;
    }

    /** GET /api/ai 或 /api/ai/health 都能用来确认本服务是否生效，避免 404 */
    @GetMapping(value = {"", "/health"}, produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResult<Map<String, String>> health() {
        return ApiResult.ok(Map.of("service", "scs-backend", "ai", "ok", "chat", "POST /api/ai/chat"));
    }

    /** 浏览器直接打开 /api/ai/chat 会发 GET，返回此 JSON 而不是 405 Whitelabel */
    @GetMapping(value = "/chat", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResult<Map<String, String>> chatGet() {
        return ApiResult.ok(Map.of("message", "请用 POST 发送 messages，本接口不接受 GET"));
    }

    @PostMapping(value = "/chat", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResult<Map<String, String>> chat(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, String>> messages = (List<Map<String, String>>) body.get("messages");
        if (messages == null || messages.isEmpty()) {
            return ApiResult.fail(400, "messages 不能为空");
        }
        // 终端打印：消息条数 + 最后一条用户消息
        String lastUser = messages.stream()
                .filter(m -> "user".equals(m.get("role")))
                .reduce((a, b) -> b)
                .map(m -> m.get("content"))
                .orElse("");
        log.info("[AI chat] 收到消息数: {}, 最后一条(user): {}", messages.size(), lastUser);

        try {
            Map<String, Object> forwardBody = Map.of("messages", messages);
            String jsonBody = objectMapper.writeValueAsString(forwardBody);
            byte[] bodyBytes = jsonBody.getBytes(StandardCharsets.UTF_8);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setContentLength(bodyBytes.length);
            HttpEntity<byte[]> entity = new HttpEntity<>(bodyBytes, headers);
            RestTemplate restTemplate = new RestTemplate();
            String responseBody = restTemplate.postForObject(aiServiceBaseUrl + "/api/chat", entity, String.class);
            log.debug("[AI chat] FastAPI 响应长度: {}", responseBody != null ? responseBody.length() : 0);
            @SuppressWarnings("unchecked")
            Map<String, Object> response = responseBody != null ? objectMapper.readValue(responseBody, Map.class) : null;
            String content = response != null && response.get("content") != null
                    ? response.get("content").toString()
                    : "";
            log.info("[AI chat] 助手回复: {}", content.length() > 200 ? content.substring(0, 200) + "..." : content);
            return ApiResult.ok(Map.of("content", content));
        } catch (Exception e) {
            log.warn("[AI chat] 转发失败: {}", e.getMessage());
            return ApiResult.fail(502, "AI 服务不可用: " + e.getMessage());
        }
    }
}
