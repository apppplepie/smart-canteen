package com.scs.controller;

import com.scs.dto.ApiResult;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 与 {@link AiChatController#ttsSynthesize} 等价，额外提供 POST /api/tts/synthesize，
 * 便于旧 Nginx 或前端只认短路径时转发；大屏亦可作为回退 URL。
 */
@RestController
@RequestMapping("/api")
public class AiTtsBridgeController {

    private final AiChatController aiChatController;

    public AiTtsBridgeController(AiChatController aiChatController) {
        this.aiChatController = aiChatController;
    }

    @PostMapping(
            value = "/tts/synthesize",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResult<Map<String, Object>> ttsSynthesize(@RequestBody Map<String, Object> body) {
        return aiChatController.ttsSynthesize(body);
    }
}
