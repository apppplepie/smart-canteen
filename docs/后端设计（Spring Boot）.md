# 后端设计（Spring Boot）

这份说明主要写清楚：智慧食堂（SCS）里 Java 后端具体干了什么。大方向上和 Python 的 ai-service 是分开的——Spring Boot 这边管数据库、REST 接口，还有把前端的聊天请求转给 FastAPI、以及帖子向量检索这一套；真正跑模型、部分 embedding 接口在独立 AI 服务里。

---

## 1. AI 对话编排

### 1.1 定位与数据流

模型不在 JVM 里跑，后端更像一层 BFF：接到前端的 `/api/ai/chat`，先把会话和消息写进表，再把整理好的上下文用 HTTP 丢给 FastAPI（配置项 `ai.service.base-url`），最后把助手回复落库再返回。这样前后端和 AI 服务边界比较清楚，出问题也好查日志。

一次请求大致是这样走的：先看 `messages` 有没有、再解析 `conversationId` 和 `userId`——后者可以从 body、`X-User-Id` 或 Bearer 里带出来的会话里推，几种方式都支持是为了兼容不同端。接着要么新建 `AiConversation`，要么按 id 取出来，把本轮用户话写进 `AiMessage`（role=user）。然后从库里拉出这一会话里所有 user/assistant 消息，按下面说的摘要规则拼好要转发的 `messages`，必要时带上 `context_summary`。转发地址是 `POST {ai-service}/api/chat`，body 里还会塞 `clientType`（admin / screen / mobile）、`userId`、`role` 之类，方便 Python 那边按端裁剪工具和权限。如果 FastAPI 正常返回，就把助手内容（以及可能的 `tool_calls`、`suggestions`）存下来；新会话会再调一次生成短标题。要是调用失败，错误也会写成一条 assistant 消息，避免前端历史和库里对不上。

### 1.2 会话摘要与上下文窗口

消息堆多了（超过最近 5 轮、也就是 10 条 user+assistant）就要做压缩：早先那一段会丢给 AI 服务的 `summarize` 接口，压成一段大约 500 字的小结，记在会话上的 `context_summary` 字段，并记下已经覆盖了多少条，免得重复算。真正发给大模型的是「小结 + 最近 5 轮」，token 能控住，最近的对话又还在。

### 1.3 和业务数据的衔接

新会话第一条用户消息可以走 `suggest-title`，把标题从「新对话」换成 8 个字以内的概括，失败就维持原样。另外如果 FastAPI 里工具返回了 `recommend_meal_card`，Java 这边会从 `tool_calls` 里抠出 `menu_item_id`，用 `MenuItem`、`Vendor` 拼一张菜品卡片（档口名、评分、图、位置这些）跟着 JSON 一起回前端，相当于对话能落到真实菜品上，不是纯文本飘在空中。

### 1.4 会话列表与历史查询

列表用 `GET /api/ai/conversations`，可以按用户筛，也考虑了没带用户、用 `clientId` 之类的场景。单条会话的消息是 `GET /api/ai/conversations/{id}/messages`，按顺序排，`suggestions` 和 `tool_calls` 会反序列化好再给前端。

### 1.5 关键代码摘录

类上的路由和「最近 5 轮」常量，和上面说的摘要策略是对上的（对应 `AiChatController`）：

```text
控制器路径: /api/ai
常量:
  RECENT_ROUNDS ← 5                    // 发给大模型的最近轮数
  RECENT_MESSAGE_COUNT ← RECENT_ROUNDS × 2   // 每轮 = 1 user + 1 assistant
```

用户消息入库之后，逻辑等价于下面伪代码：拉历史、判断要不要写 `context_summary`、截取最近若干条、组转发体，HTTP POST 到 FastAPI，再存助手消息；新会话顺便改标题，有推荐菜就组 `mealCard`（对应 `AiChatController` 内转发与落库流程）。

```text
算法: 转发 AI 并返回
输入: 已持久化的会话 conversation，客户端类型 clientType，用户 id/角色等

allMessages ← 按会话 id、排序字段取该会话全部消息
historyMaps ← 仅保留 role ∈ {user, assistant}，每条映射为 {role, content}

contextSummary ← conversation.contextSummary
summaryCount   ← conversation.contextSummaryMessageCount

若 |historyMaps| > RECENT_MESSAGE_COUNT 则
  oldCount ← |historyMaps| − RECENT_MESSAGE_COUNT
  若需重新摘要（小结为空或与 oldCount 不一致）则
    toSummarize ← historyMaps 的前 oldCount 条
    contextSummary ← 调用 AI 服务 summarize(toSummarize)
    若 contextSummary 非空则 写回会话的 context_summary 与覆盖条数并 save；否则打日志警告
  结束若
结束若

messagesToSend ← 若 |historyMaps| ≤ RECENT_MESSAGE_COUNT 则 全部 historyMaps
                 否则 仅最近 RECENT_MESSAGE_COUNT 条

forwardBody ← { messages: messagesToSend, clientType, 可选 userId、role、context_summary }
responseBody ← HTTP POST(aiServiceBaseUrl + "/api/chat", JSON(forwardBody))
response     ← 解析 JSON 为键值结构

content ← response["content"] 或空串
新建助手消息: role=assistant, content, sortOrder=nextOrder+1
若 response 含 tool_calls / suggestions 则 序列化写入对应字段
保存助手消息

若为新会话则 根据末条用户话调用 suggest-title 更新标题
保存会话

recommendedId ← 从 tool_calls 解析推荐菜品 id（若有）
mealCard ← buildMealCardPayload(recommendedId)  // 可能为空
返回 ApiResult.ok({ content, conversationId, 可选 mealCard })
```

写论文时这一块可以当「多服务里谁管会话状态、谁管模型」的例子来用，不必再堆概念词。

---

## 2. 帖子语义检索 / RAG 入口

### 2.1 功能角色

帖子这边做的是：标题和正文拼成一段索引文本，embedding 之后塞进 `PostVectorIndex`；用户搜的时候同一套方式给问句算向量，和库里存的向量比余弦相似度，取前 K 条再把 `Post` 详情带回去。后面如果要做完整 RAG，检索可以停在这一步，重排和生成交给 ai-service 或前端组合都行，看你怎么搭。

**消费方与集成现状（与代码对齐）**：

- **移动端「本周食堂圈 · AI 小结」**：在配置了后端 `VITE_API_BASE_URL` 等前提下，会由前端根据**本周热帖/反馈摘要**与（若存在）`GET /api/snapshots/ai-reports` 返回的 `weekly_posts_digest` 报告话题拼出检索查询，调用 **`GET /api/vector/posts/search`** 取 Top-K，在周报详情里展示「检索增强 · 关联讨论」（与「本周热帖」按帖子 id 去重）。实现上对应 `mobile/src/lib/aiSummaryBuild.ts`（`buildWeeklyRagQuery` 等）与 `mobile/src/api/postVectorSearch.ts`。若向量表未 rebuild 或查询失败，该区块可能为空，答辩演示前宜准备数据并执行一次 `POST /api/vector/posts/rebuild`。这是**检索结果进产品展示**，不是 Spring 再调大模型重写周报正文。
- **对话 Agent**（`/api/ai/chat` → FastAPI）：当前工具集走 `list_posts`、`query_*` 等 HTTP 工具，**没有**封装 `/api/vector/posts/search`；语义检索能力与聊天 Agent 是两条链路。
- **admin / screen**：常规帖子列表与筛选仍走 `/api/posts` 等；仓库内**无**独立「语义搜索框」对接向量接口，演示与联调可直接调上述 `search` API。

### 2.2 配置与嵌入提供方

`application.yml` 里 `scs.vector.embedding` 能切 `provider`。走 `ai-service` 就对齐 Python 暴露的 embedding URL；走 `openai` 则直接调官方 Embeddings，模型名比如 `text-embedding-3-large`，要配 key。两边都挂了的话代码里还有一层本地哈希向量顶着，至少本地能跑通，就是语义质量别指望。

**维度一致**：`ai-service` 的 `POST /api/embeddings` 当前实现为 **256 维**哈希向量；Java 侧仅当落到 `demo-hash-embedding-v1` 降级时为 **64 维**。索引里存的向量须与检索时使用的 provider/维度一致，否则 `PostVectorSearchService` 会跳过维度不匹配的行；**更换提供方后应执行 `POST /api/vector/posts/rebuild`**。

### 2.3 索引与检索实现要点

重建是 `rebuildAll` 扫全表帖子，文本空的就跳过，有内容的就算向量，按 `postId` 更新或插入索引行，向量 JSON 存在关系库里。搜的时候先给 query 做 embedding，再遍历索引表算相似度（向量归一化过的话余弦和点积一回事），排序后把帖子字段填进返回列表。HTTP 上是 `GET .../search` 带 `query` 和 `topK`（有上限），`POST .../rebuild` 全量重建；响应里会带 `runtime`，方便你看当前到底用的哪套 provider。

### 2.4 扩展与论文表述建议

现在是 MySQL 里存向量、Java 里全表扫着比，数据量小或做课程/毕设原型够用；真要上规模，延迟和存储都会吃紧，论文里可以一笔带过：后面换成向量库加 ANN 是顺理成章的升级，和现在这套的关系写清楚就行，不必硬吹。若正文写「语义检索」，建议同时说明默认链路上 embedding 为**可复现哈希占位**时的效果边界，避免与商业嵌入模型混为一谈。

### 2.5 关键代码摘录

配置里顺带能看到端口、静态图目录、AI 基址和向量相关项（和聊天共用同一份 `ai.service` 思路），对应 `application.yml` 的语义可概括为：

```text
server.port ← 8081（示例；本地端口冲突时可改，前端 .env 与之后端一致）

scs.images-dir ← 环境变量或默认静态图根路径（映射 /api/images/...）

scs.vector.embedding:
  provider ← ai-service | openai | …
  model, ai-service-url, openai.base-url, openai.api-key 等按提供方填写

ai.service.base-url ← FastAPI 根地址（供 /api/ai/chat 等转调）
```

Controller 里重建和搜索各一个接口，`topK` 做了裁剪（对应 `PostVectorSearchController`）：

```text
POST /rebuild:
  count ← postVectorSearchService.rebuildAll()
  返回 JSON: { message: "vector index rebuilt", indexedCount: count, runtime: runtimeInfo() }

GET /search?query=&topK=:
  safeTopK ← clamp(topK 缺省为 5, 下限 1, 上限 20)
  返回 JSON: { query, topK: safeTopK, runtime: runtimeInfo(), results: search(query, safeTopK) }
```

Service 里重建、搜索的主循环如下；嵌入走 `embeddingWithFallback`，失败会逐级退（对应 `PostVectorSearchService`）。

```text
函数 rebuildAll() → 已索引条数
  遍历 postRepository 全部帖子
    source ← buildSourceText(post)
    若 source 为空则 跳过
    embeddingResult ← embeddingWithFallback(source)
    索引行 ← 按 postId 查找或新建，写入 sourceText、modelName、embeddingJson
    保存索引行；indexed++
  返回 indexed

函数 search(query, topK) → 结果列表
  若 query 为空则 返回空列表
  q ← embeddingWithFallback(query).vector
  scoredList ← 空
  遍历 vectorIndexRepository 全部索引行
    v ← 从 embeddingJson 解析向量
    若 v 为空或维度与 q 不一致则 跳过
    score ← cosine(q, v)           // 向量已归一化时等价于余弦相似度
    将 (postId, score, modelName) 加入 scoredList
  按 score 降序排序
  按排序顺序取 post 详情组装行: postId, title, content, score(四位小数), embeddingModel
  最多返回 topK 条（含维度过滤后可能不足）
  返回结果列表
```

`embeddingWithFallback` 与归一化后的 `cosine`（实现上就是点积）：

```text
函数 embeddingWithFallback(text) → (向量, 模型名)
  若 provider 为 ai-service 且 embeddingByAiService(text) 成功则 返回该向量与固定模型名
  若 provider 为 openai 且 embeddingByOpenAi(text) 成功则 返回该向量与配置的 model
  否则 返回本地哈希 embedding(text) 与降级模型名

函数 cosine(a, b) → 标量
  返回 Σ_i a[i] × b[i]    // 已归一化向量下即为余弦相似度
```

---

## 3. 领域模型与业务规则

### 3.1 技术栈与分层

Spring Boot + Spring Data JPA，库是 MySQL，连接池用的 Hikari。表结构没有交给 Hibernate 自动建，是 `ddl-auto: none`，自己用 SQL 管迁移。包结构比较常规：`controller` 对外、`entity`/`repository` 怼数据库、复杂一点的逻辑扔到 `service`，过滤器之类在 `config`。

### 3.2 核心业务域（按模块归纳）

下表只是帮助扫一眼模块，写论文时挑和题目相关的几块展开就行，没必要把每个表都背一遍。

| 域 | 说明 |
|----|------|
| 用户与认证 | `User`；`Authorization: Bearer` 走 `CurrentUserFilter` 解析后塞 request，很多接口允许匿名，带 token 才有当前用户。 |
| 档口与评价 | `Vendor`、`VendorReview`；评价在明细表，列表展示用的平均分、条数在第 4 节那种定时任务里更新。 |
| 社区内容 | `Post`、`PostComment`、`PostLike`；和帖子向量检索是一套。 |
| 失物与招领 | `LostItem`、`LostItemComment`、`FoundItem` 等。 |
| 食堂运营 | `MenuItem`、排队 `QueueEntry`、订单 `Order`/`OrderItem`、库存 `StockMovement`、留样 `RetainedSample`、营养记录等。 |
| 合规与原料 | `Material`、`MenuItemMaterial`、`AllergenDisclosure` 一类，和公示、过敏原相关。 |
| AI 会话 | `AiConversation`、`AiMessage`，只服务第 1 节的对话链路。 |
| 报表与快照 | `CanteenDailySnapshot`、`AiPeriodReport` 等有 Facade 只读查表；和订单/发帖实时汇总有没有全接上，以库里实际数据和代码注释为准，别写过头。 |

### 3.3 横切能力

静态资源根路径在 `scs.images-dir`，映射到 `/api/images/...` 那一套，细节看 `WebMvcConfig`、`ImageStaticController`。接口返回不少用 `ApiResult` 包一层，前端对接和写文档时格式统一一些。

### 3.4 关键代码摘录

可选登录场景下的 Bearer：只处理以 `/api` 开头的请求，token 坏了也不拦请求，只是没有当前用户——这样老页面没改也能用（对应 `CurrentUserFilter`）。

```text
过滤器 CurrentUserFilter（OncePerRequestFilter，高优先级）

shouldNotFilter(request):
  若 requestURI 非 /api 前缀则 返回 true（跳过本过滤器）

doFilterInternal(request, response, chain):
  authorization ← request 头 "Authorization"
  若 authorization 以 "Bearer " 开头则
    token ← 去掉前缀后 trim
    若 token 非空则
      sessionUser ← adminSessionService.get(token)
      request 属性 ← 当前会话用户（供 CurrentUserHolder 读取）
  // 无 token 或无效时不拦截，仅不注入用户
  chain.doFilter(request, response)
```

需要贴配置的话，§2.5 里那段 `application.yml` 可以一起引用，不用重复粘。

---

## 4. 定时聚合与数据一致性

### 4.1 场景：商家评分聚合

评价明细在 `vendor_reviews`，列表页往往要看平均分、有多少条评价。每次现算当然也行，就是访问量大时读路径会重；把结果冗余到 `vendors` 上，是典型的用写换读。

### 4.2 设计：物化聚合 + 定时任务

`VendorRatingAggregateService` 把聚合结果写回 `vendors.rating_avg`、`rating_count`。调度是 `@Scheduled` 每 5 分钟跑一次，另外 `@PostConstruct` 启动时再跑一遍，避免服务刚起来那一阵子数据和明细差太远。实现上是从仓库拉按商家分组好的平均分和条数，再逐条 `save`（事务标在定时方法上）。要注意这是最终一致：评价刚提交，可能要等几分钟才能在档口头上看成新平均分；完全没有评价的档口，代码里注释写了不会在这里批量清零，行为依赖初始值或第一次有评分之后才会被更新。

### 4.3 论文表述角度

这一块写「读多写少 + 定时批处理省掉查询时聚合」就够用；想拔高可以提一句：要更强一致可以在评价写入后异步触发一次聚合，或者上视图/触发器，和当前实现对比着写，比空泛谈「性能优化」实在。

### 4.4 关键代码摘录

将 `vendor_reviews` 聚合到 `vendors.rating_avg`、`rating_count` 的定时任务，逻辑等价于（对应 `VendorRatingAggregateService`）：

```text
服务 VendorRatingAggregateService

@PostConstruct onStartup():
  aggregateRatingsToVendors()

@Scheduled 每 5 分钟
@Transactional aggregateRatingsToVendors():
  rows ← reviewRepo 按商家分组的 (vendorId, 平均分, 条数)
  对 rows 中每一行:
    若 vendorRepo.findById(vendorId) 存在则
      更新 rating_avg、rating_count 并 save
  // 无任何评分的商家不在此批量清零；依赖初始值或首次有评分后更新
  若 rows 非空则 打 debug 日志（更新商家数）
```

---

## 文档与代码对照

方便查源码时对着看（章节号和上文一致）：

| 文档章节 | 主要代码位置（示例） |
|----------|----------------------|
| §1 AI 对话编排 | `AiChatController`，实体 `AiConversation`、`AiMessage` |
| §2 帖子语义检索 | `PostVectorSearchService`，`PostVectorSearchController`，`PostVectorIndex`；移动端周报对接见 `mobile/src/api/postVectorSearch.ts`、`mobile/src/lib/aiSummaryBuild.ts` |
| §3 领域模型 | `com.scs.entity` / `repository` / `controller` 各包 |
| §4 定时聚合 | `VendorRatingAggregateService` |

配置总入口：`backend/src/main/resources/application.yml`（库连接、AI、向量、`scs.images-dir` 等）。
