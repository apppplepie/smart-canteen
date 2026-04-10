# AI 板块与 RAG 技术设计说明（SCS 项目）

## 1. 背景与目标

本项目 AI 板块的核心目标，不是单纯“接一个聊天接口”，而是构建一个可演进的检索增强智能能力底座。具体分为三个层次：

1. **语义检索能力**：让系统不仅能做关键词匹配，还能基于语义近邻检索历史帖子内容；
2. **RAG 架构能力**：把检索结果组织成上下文，供大模型生成更可信、更可追溯的回答；
3. **工程可落地能力**：在现有 `Spring Boot + MySQL + FastAPI` 结构中，优先保证可部署、可演示、可扩展。

从毕设工程角度，当前实现重点完成了 RAG 的“Retrieval（检索）”部分，并预留了“Generation（生成）”的对接位，形成可扩展闭环。

---

## 2. 什么是 RAG，为什么要用 RAG

RAG（Retrieval-Augmented Generation，检索增强生成）是将“外部知识检索”与“大模型生成”结合的技术范式。其核心思想是：  
**先检索，再作答**，以降低纯参数模型的幻觉风险，并提升答案与业务数据的一致性。

经典论文《Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks》（Lewis et al., 2020）提出了该范式并验证了效果：  
- 仅靠参数记忆的模型在时效性、细节真实性上存在短板；  
- 引入非参数记忆（向量索引）后，知识密集任务表现显著提升。  

参考资料：  
- [RAG 原始论文（arXiv:2005.11401）](https://arxiv.org/abs/2005.11401)  
- [Meta Research 页面](https://ai.meta.com/research/publications/retrieval-augmented-generation-for-knowledge-intensive-nlp-tasks)

---

## 3. RAG 的技术目的（本项目语境）

结合校园食堂业务，本项目引入 RAG 的目的可以归纳为：

- **提升问答可信度**：回答“投诉趋势、窗口问题、热帖反馈”时，以真实帖子为证据；
- **提升召回能力**：通过向量相似度捕捉同义表达，弥补关键词检索漏召回；
- **提升可解释性**：可输出被召回的帖子 `postId`、相似度 `score`、向量模型标识 `embeddingModel`；
- **为智能分析扩展打基础**：后续可以扩展到“反馈自动归因”“风险周报生成”“知识库问答”。

---

## 4. 当前系统的 RAG 架构映射

### 4.1 总体架构

当前系统采用双服务结构：

- **检索主服务**：`backend`（Spring Boot）负责索引构建、向量检索、结果聚合；
- **AI 能力服务**：`ai-service`（FastAPI）负责 Embedding 与 Agent 能力输出；
- **持久化层**：MySQL 中新增 `post_vector_index` 表作为向量索引存储；
- **模型供应策略**：支持 `ai-service`、`openai`、本地 fallback 三路 provider。

该设计具备“低耦合 + 可替换”特点：Embedding 提供方可以替换，而检索流程保持稳定。

### 4.2 消费端：谁在用检索接口

| 消费方 | 行为 | 说明 |
|--------|------|------|
| **移动端 · 本周 AI 小结** | 直连 Spring Boot `GET /api/vector/posts/search` | 用本周热帖/反馈与可选 `weekly_posts_digest` 话题拼查询，在周报详情展示「检索增强 · 关联讨论」；属**检索增强展示**，不经过 FastAPI `process_message`。实现见 `mobile/src/api/postVectorSearch.ts`、`mobile/src/lib/aiSummaryBuild.ts`、`AISummaryDetail`。 |
| **对话 Agent（ai-service）** | 当前**未**封装该 URL | 帖相关能力以 `list_posts`、`query_posts` 等列表/查表工具为主；若需「聊天里语义找帖」可后续增加 Tool。 |
| **admin / screen** | 无专用语义搜索 UI | 列表与筛选仍走 `/api/posts`；联调向量能力可直接调 `search` / `rebuild` API。 |

### 4.3 关键后端实现（代码摘选）

#### HTTP 接口：向量索引重建与语义检索

对外暴露 `POST /api/vector/posts/rebuild`（全量重建索引）与 `GET /api/vector/posts/search`（Top-K 检索），并在响应中附带 `runtime`，便于答辩时展示当前 Embedding 提供方与模型配置。

```java
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
```

#### 服务层：索引构建、检索打分、Provider 路由与降级

`rebuildAll` 遍历业务帖子，将标题与正文拼成 `sourceText`，经 `embeddingWithFallback` 得到向量后写入索引表；`search` 将查询向量化，与索引中向量做余弦相似度排序并回表取帖子字段；`embeddingWithFallback` 按配置优先走本地 AI 服务或 OpenAI，失败则回退到本地哈希向量，保证演示可用。

```java
public int rebuildAll() {
    log.info("[vector] rebuild start provider={}, model={}", embeddingProvider, embeddingModel);
    List<Post> posts = postRepository.findAll();
    int indexed = 0;
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
    log.info("[vector] rebuild done indexedCount={}", indexed);
    return indexed;
}

public List<Map<String, Object>> search(String query, int topK) {
    if (query == null || query.isBlank()) {
        return Collections.emptyList();
    }
    float[] q = embeddingWithFallback(query).vector;
    List<Scored> scoredList = new ArrayList<>();
    for (PostVectorIndex idx : vectorIndexRepository.findAll()) {
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

private double cosine(float[] a, float[] b) {
    double dot = 0;
    for (int i = 0; i < a.length; i++) {
        dot += (double) a[i] * b[i];
    }
    return dot;
}
```

#### 调用本地 FastAPI 的 Embedding 解析（兼容 OpenAI 风格 JSON）

```java
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
```

#### FastAPI 侧：`POST /api/embeddings`（演示用稳定向量 + 类 OpenAI 响应壳）

```python
@api_router.post("/embeddings")
async def embeddings(body: EmbeddingRequest):
    text = (body.input or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="input 不能为空")
    vector = await asyncio.to_thread(_hash_embedding, text, 256)
    model_name = (body.model or "local-ai-embedding").strip() or "local-ai-embedding"
    prompt_tokens = max(1, len(text))
    created = int(time.time())
    logging.info("[embeddings] provider=local-hash model=%s inputLen=%s dim=%s", model_name, len(text), len(vector))
    return {
        "id": f"embd-{hashlib.md5(text.encode('utf-8')).hexdigest()[:12]}",
        "object": "list",
        "created": created,
        "model": model_name,
        "data": [
            {
                "object": "embedding",
                "index": 0,
                "embedding": vector
            }
        ],
        "embedding": vector,
        "usage": {
            "prompt_tokens": prompt_tokens,
            "total_tokens": prompt_tokens
        }
    }
```

### 4.4 配置摘选（Embedding 提供方与 AI 服务地址）

配置层将向量提供方设为 `ai-service`，并指向本机 FastAPI 的 `/api/embeddings`；同时保留 OpenAI 兼容项，便于切换或对照实验。

```yaml
scs:
  images-dir: ${SCS_IMAGES_DIR:../images}
  vector:
    embedding:
      provider: ai-service
      model: text-embedding-3-large
      ai-service-url: http://localhost:8000/api/embeddings
      openai:
        base-url: https://api.openai.com
        api-key: ${OPENAI_API_KEY:}

ai:
  service:
    base-url: http://localhost:8000
```

说明：配置中的 `model` 名称可与业界常见 Embedding 模型命名对齐，便于文档叙述；在默认 `ai-service` 链路上，**实际向量为 `_hash_embedding` 生成的可复现伪向量（256 维）**，用于跑通索引与排序，不等同于神经语义嵌入；更换为真实嵌入模型后需 **rebuild** 索引。

**与 Java 降级的维度一致**：仅当 Spring 无法调用 `ai-service` / OpenAI 而落到 `demo-hash-embedding-v1` 时，Java 侧为 **64 维**哈希向量，与 256 维索引**不兼容**；生产与答辩环境应保持单一 provider 并重建索引。

---

## 5. 数据库设计与索引结构

### 5.1 建表 SQL（帖子向量索引）

```sql
-- 帖子向量索引（最小演示版）
CREATE TABLE IF NOT EXISTS `post_vector_index` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `post_id` bigint NOT NULL,
  `source_text` text NULL,
  `embedding_json` longtext NULL,
  `model_name` varchar(64) DEFAULT 'demo-hash-embedding-v1',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_post_vector_post_id` (`post_id`),
  CONSTRAINT `fk_post_vector_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='帖子向量索引';
```

字段含义简述：`post_id` 与业务帖子一一对应；`source_text` 为参与向量化的文本；`embedding_json` 存向量序列；`model_name` 记录产生该向量的模型标识；`updated_at` 支持后续增量重建；外键保证帖子删除时索引一并清理。

### 5.2 JPA 实体映射（与表结构一致）

```java
@Entity
@Table(name = "post_vector_index")
public class PostVectorIndex {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "post_id", nullable = false, unique = true)
    private Long postId;

    @Column(name = "source_text", columnDefinition = "TEXT")
    private String sourceText;

    @Column(name = "embedding_json", columnDefinition = "TEXT")
    private String embeddingJson;

    @Column(name = "model_name", length = 64)
    private String modelName;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpsert() {
        updatedAt = LocalDateTime.now();
    }
    // getters / setters 省略
}
```

这套设计属于“轻量向量索引表”方案，优点是落地快、维护成本低，适合中小规模毕设系统；当向量规模上升时，可平滑迁移至专用向量库。

---

## 6. 检索算法与工程实现细节

### 6.1 检索流程

1. 读取用户查询 `query`；  
2. 通过 provider 生成查询向量；  
3. 扫描 `post_vector_index` 中向量并计算余弦相似度；  
4. 取 Top-K；  
5. 回表到 `posts` 获取标题与正文，返回结构化结果。

### 6.2 相似度策略

使用余弦相似度（cosine similarity）：

- 对归一化向量，余弦相似度可等价为点积排序；
- 能较好描述“方向相近的语义向量”；
- 在语义检索场景中是主流选择。

参考：  
- [OpenAI Embeddings FAQ](https://help.openai.com/en/articles/6824809-embeddings-faq)  
- [OpenAI Cookbook: Semantic Text Search](https://developers.openai.com/cookbook/examples/semantic_text_search_using_embeddings)

### 6.3 稳定性与容错

多级容错在代码中体现为：优先 `ai-service`，其次 `openai`，最后本地 `embedding`；检索时若索引中向量维度与查询向量不一致则跳过该条，避免维度不匹配导致异常。

```java
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
```

```java
for (PostVectorIndex idx : vectorIndexRepository.findAll()) {
    float[] v = parseEmbedding(idx.getEmbeddingJson());
    if (v == null || v.length != q.length) {
        continue;
    }
    double score = cosine(q, v);
    scoredList.add(new Scored(idx.getPostId(), score, idx.getModelName()));
}
```

该策略保证了“演示环境可运行、生产思路可扩展”。

---

## 7. 从“语义检索”到“完整 RAG”的落地路线

当前系统已完成 **RAG 的 Retrieval 层**。完整 RAG 可分三步演进：

### 阶段 A：检索增强问答与展示

- **已落地（展示向）**：`GET /api/vector/posts/search` 输出 Top-K 证据；移动端「本周 AI 小结」已将检索结果作为**可点击证据列表**并入周报详情（见 §4.2）。
- **待扩展（生成向）**：在 `ai-service` 中新增组装提示词的接口（例如 `/api/rag/answer`），或将向量检索注册为 **Agent Tool**，把 Top-K 拼进 context 再调用聊天模型生成回答，即典型「检索 → 生成」闭环。

### 阶段 B：索引优化

- 文本分块（chunking）而非整帖向量；
- 增加元数据过滤（时间、窗口、反馈类型）；
- 增加重排器（reranker）提高前几条证据质量。

### 阶段 C：评测与治理

- 建立离线评测集（问题-证据-标准答案）；
- 评估 Recall@K、MRR、Faithfulness；
- 引入回答引用（citation）与拒答策略（无证据不回答）。

这一路线与业界 RAG 工程实践一致，可作为毕业设计后续工作展望。

参考：  
- [LangChain Retrieval 概览](https://docs.langchain.com/oss/python/langchain/retrieval)  
- [LangChain RAG Tutorial](https://python.langchain.com/docs/tutorials/rag)

---

## 8. 本方案的工程价值与学术表达建议

### 8.1 工程价值

- 在现有业务代码上低侵入引入语义检索；
- 保留对外部高阶模型 API 的兼容能力；
- 通过 `model_name`、`runtime`、`usage` 字段实现过程可观测；
- 具备从毕设 Demo 向生产架构迁移的清晰路径。

### 8.2 论文写作表达建议

可在论文中使用如下表述（须与 §9 边界一致）：

- “系统在帖子域构建向量索引与 Top-K 检索管线，并在移动端周报中引入检索增强模块，用于展示与本周讨论语义相近的关联帖，提高可解释性。”  
- “对话与深度生成侧预留与检索结果拼接的路径；当前默认嵌入为可复现哈希占位时，宜强调**检索流程与工程架构**而非夸大神经语义效果。”  
- “工程实现上采用可插拔 Embedding Provider，支持本地 AI 服务、外部 API 与降级策略；索引表记录 `model_name`，便于模型替换后重建与对照。”

---

## 9. 当前实现边界（如实说明更专业）

为保证工程可控与按期交付，当前版本仍有边界：

- 向量存储采用 MySQL `embedding_json`，大规模检索效率不及专用向量库；
- 默认 `ai-service` 嵌入为 **SHA256 分词哈希向量**，语义近似能力有限；Java 纯本地降级为另一套维度与算法，**勿与已建 256 维索引混用**，切换后必须 rebuild；
- 检索层已对接 **移动端周报展示**；**统一的服务端 `/api/rag/answer` 与 Agent 侧向量 Tool 尚未实现**，对话中的“找相似帖”仍依赖列表类工具而非向量接口；
- 缺少标准化离线评测集与 A/B 对比实验。

如实写明上述边界，反而有利于体现对 RAG 分层（检索 / 展示 / 生成）的理解；若终稿需要更强叙事，可写“检索管线已贯通，生成式 RAG 为展望”。

---

## 10. 结论

本项目 AI 板块已完成从“普通接口调用”到“RAG 可演进底座”的关键跨越：  
一方面具备真实可跑的语义检索与向量索引能力，另一方面形成了与外部模型、AI 服务、数据库索引协同的工程框架。  

该方案在毕业设计场景中兼顾了 **技术先进性、可解释性、工程可落地性**，并为后续升级到完整 RAG 问答系统提供了明确路径。

