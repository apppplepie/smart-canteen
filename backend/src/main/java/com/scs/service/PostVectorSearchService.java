package com.scs.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scs.entity.Post;
import com.scs.entity.PostVectorIndex;
import com.scs.repository.PostRepository;
import com.scs.repository.PostVectorIndexRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class PostVectorSearchService {

    private static final Logger log = LoggerFactory.getLogger(PostVectorSearchService.class);
    private static final int LOCAL_VECTOR_DIM = 64;
    private static final String FALLBACK_MODEL_NAME = "demo-hash-embedding-v1";
    private static final String AI_SERVICE_MODEL_NAME = "local-ai-embedding";

    private final PostRepository postRepository;
    private final PostVectorIndexRepository vectorIndexRepository;
    private final ObjectMapper objectMapper;
    private final String embeddingProvider;
    private final String aiServiceEmbeddingUrl;
    private final String openaiBaseUrl;
    private final String embeddingModel;
    private final String openaiApiKey;
    private final RestTemplate restTemplate = new RestTemplate();

    public PostVectorSearchService(PostRepository postRepository,
                                   PostVectorIndexRepository vectorIndexRepository,
                                   ObjectMapper objectMapper,
                                   @Value("${scs.vector.embedding.provider:openai}") String embeddingProvider,
                                   @Value("${scs.vector.embedding.ai-service-url:http://localhost:8000/api/embeddings}") String aiServiceEmbeddingUrl,
                                   @Value("${scs.vector.embedding.openai.base-url:https://api.openai.com}") String openaiBaseUrl,
                                   @Value("${scs.vector.embedding.model:text-embedding-3-large}") String embeddingModel,
                                   @Value("${scs.vector.embedding.openai.api-key:}") String openaiApiKey) {
        this.postRepository = postRepository;
        this.vectorIndexRepository = vectorIndexRepository;
        this.objectMapper = objectMapper;
        this.embeddingProvider = embeddingProvider;
        this.aiServiceEmbeddingUrl = aiServiceEmbeddingUrl;
        this.openaiBaseUrl = openaiBaseUrl;
        this.embeddingModel = embeddingModel;
        this.openaiApiKey = openaiApiKey;
    }

    public int rebuildAll() {
        log.info("[vector] rebuild start provider={}, model={}", embeddingProvider, embeddingModel);
        List<Post> posts = postRepository.findAll();
        int indexed = 0;
        try {
            for (Post post : posts) {
                String source = buildSourceText(post);
                if (source.isBlank()) {
                    continue;
                }
                EmbeddingResult embeddingResult = embeddingWithFallback(source);
                PostVectorIndex item = vectorIndexRepository.findByPostId(post.getId()).orElseGet(PostVectorIndex::new);
                item.setPostId(post.getId());
                item.setSourceText(source);
                item.setModelName(embeddingResult.modelName);
                item.setEmbeddingJson(toJson(embeddingResult.vector));
                vectorIndexRepository.save(item);
                indexed++;
            }
        } catch (DataAccessException e) {
            log.warn("[vector] rebuild skipped (DB): {}", e.getMostSpecificCause().getMessage());
            return 0;
        }
        log.info("[vector] rebuild done indexedCount={}", indexed);
        return indexed;
    }

    public List<Map<String, Object>> search(String query, int topK) {
        if (query == null || query.isBlank()) {
            return Collections.emptyList();
        }
        float[] q = embeddingWithFallback(query).vector;
        List<PostVectorIndex> indexRows;
        try {
            indexRows = vectorIndexRepository.findAll();
        } catch (DataAccessException e) {
            log.warn("[vector] search skipped (DB): {}", e.getMostSpecificCause().getMessage());
            return Collections.emptyList();
        }
        List<Scored> scoredList = new ArrayList<>();
        for (PostVectorIndex idx : indexRows) {
            float[] v = parseEmbedding(idx.getEmbeddingJson());
            if (v == null || v.length != q.length) {
                continue;
            }
            double score = cosine(q, v);
            scoredList.add(new Scored(idx.getPostId(), score, idx.getModelName()));
        }
        scoredList.sort((a, b) -> Double.compare(b.score, a.score));
        List<Long> ids = scoredList.stream()
                .limit(Math.max(1, topK))
                .map(s -> s.postId)
                .collect(Collectors.toList());
        if (ids.isEmpty()) {
            return Collections.emptyList();
        }
        Map<Long, Post> postMap = postRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Post::getId, p -> p));
        List<Map<String, Object>> result = new ArrayList<>();
        for (Scored s : scoredList) {
            if (!postMap.containsKey(s.postId)) {
                continue;
            }
            Post p = postMap.get(s.postId);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("postId", p.getId());
            row.put("title", p.getTitle());
            row.put("content", p.getContent());
            row.put("score", Math.round(s.score * 10000.0) / 10000.0);
            row.put("embeddingModel", s.modelName);
            result.add(row);
            if (result.size() >= Math.max(1, topK)) {
                break;
            }
        }
        return result;
    }

    private String buildSourceText(Post post) {
        String title = post.getTitle() == null ? "" : post.getTitle().trim();
        String content = post.getContent() == null ? "" : post.getContent().trim();
        return (title + " " + content).trim();
    }

    private String toJson(float[] embedding) {
        try {
            return objectMapper.writeValueAsString(embedding);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("serialize embedding failed", e);
        }
    }

    private float[] parseEmbedding(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            List<Double> list = objectMapper.readValue(json, new TypeReference<>() {
            });
            float[] v = new float[list.size()];
            for (int i = 0; i < list.size(); i++) {
                v[i] = list.get(i).floatValue();
            }
            return v;
        } catch (Exception e) {
            return null;
        }
    }

    private float[] embedding(String text) {
        float[] vector = new float[LOCAL_VECTOR_DIM];
        String norm = text.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
        if (norm.isBlank()) {
            return vector;
        }
        for (String token : tokenize(norm)) {
            int seed = token.hashCode();
            for (int i = 0; i < LOCAL_VECTOR_DIM; i++) {
                int mixed = seed ^ (i * 0x9E3779B9);
                float value = ((mixed & 0x7fffffff) % 1000) / 1000.0f;
                vector[i] += value;
            }
        }
        normalize(vector);
        return vector;
    }

    public Map<String, Object> runtimeInfo() {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("provider", embeddingProvider);
        info.put("configuredModel", embeddingModel);
        info.put("aiServiceUrl", aiServiceEmbeddingUrl);
        return info;
    }

    private EmbeddingResult embeddingWithFallback(String text) {
        if ("ai-service".equalsIgnoreCase(embeddingProvider)) {
            float[] local = embeddingByAiService(text);
            if (local != null && local.length > 0) {
                return new EmbeddingResult(local, AI_SERVICE_MODEL_NAME);
            }
        }
        if ("openai".equalsIgnoreCase(embeddingProvider)) {
            float[] online = embeddingByOpenAi(text);
            if (online != null && online.length > 0) {
                return new EmbeddingResult(online, embeddingModel);
            }
        }
        return new EmbeddingResult(embedding(text), FALLBACK_MODEL_NAME);
    }

    private float[] embeddingByOpenAi(String text) {
        String apiKey = openaiApiKey == null ? "" : openaiApiKey.trim();
        if (apiKey.isBlank()) {
            return null;
        }
        try {
            String url = (openaiBaseUrl == null ? "https://api.openai.com" : openaiBaseUrl).replaceAll("/$", "")
                    + "/v1/embeddings";
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", embeddingModel);
            body.put("input", text);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);
            String response = restTemplate.postForObject(url, request, String.class);
            if (response == null || response.isBlank()) {
                return null;
            }
            List<Double> values = objectMapper.convertValue(
                    objectMapper.readTree(response).path("data").path(0).path("embedding"),
                    new TypeReference<List<Double>>() {
                    });
            if (values.isEmpty()) {
                return null;
            }
            float[] v = new float[values.size()];
            for (int i = 0; i < values.size(); i++) {
                v[i] = values.get(i).floatValue();
            }
            normalize(v);
            return v;
        } catch (Exception e) {
            return null;
        }
    }

    private float[] embeddingByAiService(String text) {
        String url = aiServiceEmbeddingUrl == null ? "" : aiServiceEmbeddingUrl.trim();
        if (url.isBlank()) {
            return null;
        }
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("input", text);
            body.put("model", embeddingModel);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> request = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);
            String response = restTemplate.postForObject(url, request, String.class);
            if (response == null || response.isBlank()) {
                return null;
            }
            var node = objectMapper.readTree(response);
            List<Double> values;
            if (node.has("data")) {
                values = objectMapper.convertValue(
                        node.path("data").path(0).path("embedding"),
                        new TypeReference<List<Double>>() {
                        });
            } else {
                values = objectMapper.convertValue(
                        node.path("embedding"),
                        new TypeReference<List<Double>>() {
                        });
            }
            if (values == null || values.isEmpty()) {
                return null;
            }
            float[] v = new float[values.size()];
            for (int i = 0; i < values.size(); i++) {
                v[i] = values.get(i).floatValue();
            }
            normalize(v);
            return v;
        } catch (Exception e) {
            return null;
        }
    }

    private List<String> tokenize(String text) {
        List<String> tokens = new ArrayList<>();
        for (String t : text.split("[^\\p{IsAlphabetic}\\p{IsDigit}\\u4e00-\\u9fa5]+")) {
            if (!t.isBlank()) {
                tokens.add(t);
            }
        }
        if (tokens.isEmpty()) {
            tokens.add(text);
        }
        return tokens;
    }

    private void normalize(float[] v) {
        double sum = 0.0;
        for (float f : v) {
            sum += f * f;
        }
        double norm = Math.sqrt(sum);
        if (norm <= 1e-9) {
            return;
        }
        for (int i = 0; i < v.length; i++) {
            v[i] = (float) (v[i] / norm);
        }
    }

    private double cosine(float[] a, float[] b) {
        double dot = 0;
        for (int i = 0; i < a.length; i++) {
            dot += (double) a[i] * b[i];
        }
        return dot;
    }

    private static class Scored {
        private final Long postId;
        private final double score;
        private final String modelName;

        private Scored(Long postId, double score, String modelName) {
            this.postId = postId;
            this.score = score;
            this.modelName = modelName;
        }
    }

    private static class EmbeddingResult {
        private final float[] vector;
        private final String modelName;

        private EmbeddingResult(float[] vector, String modelName) {
            this.vector = vector;
            this.modelName = modelName;
        }
    }
}
