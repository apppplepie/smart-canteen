package com.scs.controller;

import com.scs.service.PostVectorSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/vector/posts")
public class PostVectorSearchController {

    private final PostVectorSearchService postVectorSearchService;

    public PostVectorSearchController(PostVectorSearchService postVectorSearchService) {
        this.postVectorSearchService = postVectorSearchService;
    }

    @PostMapping("/rebuild")
    public ResponseEntity<Map<String, Object>> rebuild() {
        int count = postVectorSearchService.rebuildAll();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", "vector index rebuilt");
        body.put("indexedCount", count);
        body.put("runtime", postVectorSearchService.runtimeInfo());
        return ResponseEntity.ok(body);
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> search(@RequestParam String query,
                                                      @RequestParam(defaultValue = "5") Integer topK) {
        int safeTopK = (topK == null || topK < 1) ? 5 : Math.min(topK, 20);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("query", query);
        body.put("topK", safeTopK);
        body.put("runtime", postVectorSearchService.runtimeInfo());
        body.put("results", postVectorSearchService.search(query, safeTopK));
        return ResponseEntity.ok(body);
    }
}
