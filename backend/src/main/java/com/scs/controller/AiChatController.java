package com.scs.controller;

import com.scs.dto.ApiResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * AI 对话代理：前端只调本接口，由本服务转调 FastAPI ai-service（DeepSeek）。
 */
@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    private final RestClient restClient;

    public AiChatController(@Value("${ai.service.base-url:http://localhost:8000}") String baseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    /**
     * 接收前端消息列表，转发给 ai-service，返回助手回复内容。
     * 请求体: { "messages": [ { "role": "system|user|assistant", "content": "..." } ] }
     * 响应: ApiResult&lt;Map&gt;，data 为 { "content": "..." }
     */
    @PostMapping(value = "/chat", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResult<Map<String, String>> chat(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, String>> messages = (List<Map<String, String>>) body.get("messages");
        if (messages == null || messages.isEmpty()) {
            return ApiResult.fail(400, "messages 不能为空");
        }
        Map<String, Object> request = Map.of("messages", messages);
        try {
            Map<?, ?> response = restClient.post()
                    .uri("/api/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(Map.class);
            if (response == null) {
                return ApiResult.fail(502, "AI 服务无有效响应");
            }
            Object content = response.get("content");
            String text = content != null ? content.toString() : "";
            return ApiResult.ok(Map.of("content", text));
        } catch (Exception e) {
            return ApiResult.fail(502, "AI 服务暂时不可用: " + e.getMessage());
        }
    }
}
