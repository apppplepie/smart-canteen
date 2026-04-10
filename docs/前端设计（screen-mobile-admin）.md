# 前端设计（screen / mobile / admin）

这份材料对应三个前端子工程：**大屏 `screen`**、**移动端 H5 `mobile`**、**管理后台 `admin`**。技术栈上，`screen` 与 `mobile` 都是 **React + Vite + TypeScript**（样式以 Tailwind 为主）；`admin` 基于 **Vue 3 + Vite + TypeScript + Element Plus**。三端都通过环境变量指向 Spring Boot 的 `/api`，AI 对话统一走 **`/api/ai/chat`**，用 **`clientType`** 等字段区分端侧，和后端 `AiChatController` 的设计一致。

下面按你定的选题写：**大屏写 B**，**移动端 A+B 都写**，**后台写 B**；每节附一点源码，方便论文里「实现对照」。

---

## 1. screen（大屏）：多端统一 AI 入口（选题 B）

### 1.1 在写啥

大屏不是单独接 Python，而是和移动端、后台一样：**POST Spring Boot 的 `/api/ai/chat`**。大屏侧显式传 **`clientType: 'screen'`**，请求头里带 **`X-Client-Id: screen`**，方便后端把这类会话归到「大屏客户端」（与 `AiChatController` 里对 `clientId` / 无用户会话列表的逻辑对上号）。浮层里维护 **`conversationId`**，多轮对话会接着传，避免每次从零开话题。

未配置 `VITE_API_BASE_URL`（且未开同源代理）时，组件里会直接提示改 `.env`，避免 silent fail。

### 1.2 关键代码节选

常量、请求头、组装 `messages` + `clientType` + `conversationId` 并 `fetch`：

```9:109:screen/src/components/common/AIAssistant.tsx
const SCREEN_CLIENT_ID = 'screen';

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    aiAssistantInitialMessage,
  ]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const screenHeaders = (): HeadersInit => ({
    'Content-Type': 'application/json',
    'X-Client-Id': SCREEN_CLIENT_ID,
  });

  const startNewChat = () => {
    setConversationId(null);
    setMessages([aiAssistantInitialMessage]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    const baseUrl = getApiBaseUrl().replace(/\/$/, "");
    const sameOrigin = import.meta.env.VITE_API_SAME_ORIGIN === "true";
    if (!baseUrl && !sameOrigin) {
      setMessages(prev => [
        ...prev,
        { role: 'ai', text: '请配置 .env 中的 VITE_API_BASE_URL（Spring Boot 地址）后重启开发服务器。' },
      ]);
      setIsLoading(false);
      return;
    }

    const url = baseUrl ? `${baseUrl}/api/ai/chat` : "/api/ai/chat";

    // 对话由后端 Agent 处理（clientType=screen，可查 vendors 等），不再带前端假数据
    const apiMessages: { role: string; content: string }[] = [
      ...messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      })),
      { role: 'user', content: userMessage },
    ];

    const body: { messages: typeof apiMessages; conversationId?: number | null; clientType?: string } = {
      messages: apiMessages,
      clientType: 'screen',
    };
    if (conversationId != null) body.conversationId = conversationId;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: screenHeaders(),
        body: JSON.stringify(body),
      });

      const raw = await res.text();
      let data: { code?: number; data?: { content?: string; conversationId?: number }; message?: string; content?: string };
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }
      const content =
        (data?.data?.content ?? data?.content ?? '').trim() || '抱歉，我暂时无法回答这个问题。';
      const newConvId = data?.data?.conversationId;
      const isError = !res.ok || (data?.code !== undefined && data?.code !== 0);

      if (isError) {
        setMessages(prev => [
          ...prev,
          { role: 'ai', text: data?.message || '网络似乎有点问题，请稍后再试哦~' },
        ]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: content }]);
        if (newConvId != null) setConversationId(newConvId);
      }
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'ai', text: '网络似乎有点问题，请稍后再试哦~' }]);
    } finally {
      setIsLoading(false);
    }
  };
```

**论文里可一句话概括**：大屏与后端是「同一套聊天 API + 端类型标记」，不是第三套 AI 直连。

---

## 2. mobile（移动端）：A — 登录态、会话与请求头

### 2.1 在写啥

移动端在 **`App.tsx`** 里做了两件事和后端强相关：

1. **刷新后用本地 token 恢复登录**（仅当 `isApiConfigured()` 为真时），失败则 `clearStoredToken`，避免坏 token 一直占着。
2. **AI 助手 tab 未登录时只显示引导**，登录后才挂载 `AIAssistantTab`，这样对话、历史列表、Bearer 都能和「当前用户」对齐。

### 2.2 关键代码节选

Token 恢复与「未登录不能用 AI」：

```17:137:mobile/src/App.tsx
  // 刷新页面时用本地 token 恢复登录（仅后端已配置时）
  useEffect(() => {
    if (!isApiConfigured()) return;
    const token = getStoredToken();
    if (!token) return;
    getCurrentUser(token)
      .then((me) => {
        setUser({
          name: me.username,
          id: me.username,
          avatar: "https://picsum.photos/seed/u" + (me.id ?? me.username) + "/100/100",
          userId: me.id,
          token,
        });
      })
      .catch(() => {
        // token 失效则清除，保持未登录
        clearStoredToken();
      });
  }, []);

  const tabs = [
    { id: "ordering", label: "点餐", icon: Home },
    { id: "dynamics", label: "动态", icon: Compass },
    { id: "assistant", label: "AI助手", icon: Sparkles, isPrimary: true },
    { id: "online", label: "在线", icon: Store },
    { id: "profile", label: "我的", icon: UserIcon },
  ];
```

```122:137:mobile/src/App.tsx
            {activeTab === "assistant" && !user && (
              <div className="h-full flex flex-col items-center justify-center gap-6 px-8 bg-gray-50">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: THEME.colors.primary }}>
                  <Sparkles className="text-white" size={40} />
                </div>
                <p className="text-gray-600 text-center text-lg">请先登录后使用 AI 助手</p>
                <button
                  onClick={() => setActiveTab("profile")}
                  className="px-8 py-3 rounded-2xl text-white font-bold shadow-md hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: THEME.colors.primary }}
                >
                  去登录
                </button>
              </div>
            )}
            {activeTab === "assistant" && user && <AIAssistantTab user={user ?? undefined} />}
```

`AIAssistantTab` 里 **`authHeaders`** 把 `X-User-Id` 和 **`Authorization: Bearer`** 带给后端；**历史会话**走 `GET /api/ai/conversations`、**消息**走 `GET /api/ai/conversations/{id}/messages`：

```79:122:mobile/src/components/AIAssistantTab.tsx
  const authHeaders = (): HeadersInit => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (user?.userId != null) h["X-User-Id"] = String(user.userId);
    if (user?.token != null && user.token !== "") h["Authorization"] = `Bearer ${user.token}`;
    return h;
  };

  const fetchHistoryChats = async () => {
    if (!API_BASE_URL) return;
    try {
      const url = `${API_BASE_URL}/api/ai/conversations`;
      const res = await fetch(url, { headers: authHeaders() });
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : {};
      const list = (data?.data ?? []) as { id: number; title: string; updatedAt: string }[];
      setHistoryChats(list.map((c) => ({ id: c.id, title: c.title || "新对话", time: formatConversationTime(c.updatedAt) })));
    } catch (e) {
      console.warn("拉取历史对话失败", e);
    }
  };

  useEffect(() => {
    if (isDrawerOpen) fetchHistoryChats();
  }, [isDrawerOpen, user?.userId]);

  const startNewChat = () => {
    setConversationId(null);
    setMessages([{ ...WELCOME_MSG, id: Date.now().toString() }]);
  };

  const loadHistoryChat = async (chatId: number) => {
    if (!API_BASE_URL) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/conversations/${chatId}/messages`, { headers: authHeaders() });
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : {};
      const list = (data?.data ?? []) as { id: number; role: string; content: string; suggestions?: string[] }[];
      setMessages(list.map((m) => ({ id: String(m.id), role: m.role as "user" | "assistant", content: m.content || "", suggestions: m.suggestions })));
      setConversationId(chatId);
    } catch (e) {
      console.warn("加载对话失败", e);
    }
    setIsDrawerOpen(false);
  };
```

---

## 3. mobile（移动端）：B — 工具结果结构化：餐品推荐卡片

### 3.1 在写啥

后端在 `AiChatController` 里会根据工具 **`recommend_meal_card`** 拼 **`mealCard`**（档口、菜名、评分、图等）。移动端在 **`AIAssistantTab`** 里解析 `data.mealCard`，校验字段齐全后塞进消息对象的 **`card: 'mealRecommendation'`** 和 **`cardPayload`**，由 **`MealRecommendationCard`** 组件渲染——这样不是纯 Markdown 一段字，而是**结构化业务卡片**，论文里可以叫「对话到菜单实体的可视化」。

### 3.2 关键代码节选

类型说明 + 发聊天时 `clientType: "mobile"` + 解析 `mealCard` 并合并进 assistant 消息：

```26:45:mobile/src/components/AIAssistantTab.tsx
/** 餐品推荐卡片：由后端根据 AI 工具 recommend_meal_card + 数据库菜品组装 */
export interface MealRecommendationCardPayload {
  merchantName: string;
  dishName: string;
  rating: number;
  time: string;
  image: string;
  locationLabel?: string;
  menuItemId?: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  /** 当为 mealRecommendation 时，在气泡内渲染 MealRecommendationCard，content 可作为说明文案 */
  card?: "mealRecommendation";
  cardPayload?: MealRecommendationCardPayload;
}
```

```169:249:mobile/src/components/AIAssistantTab.tsx
      const body: {
        messages: typeof apiMessages
        conversationId?: number | null
        userId?: number | null
        clientType?: string
      } = {
        messages: apiMessages,
        clientType: "mobile",
      };
      if (conversationId != null) body.conversationId = conversationId;
      if (user?.userId != null) body.userId = user.userId;

      const res = await fetch(url, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });

      const raw = await res.text();
      let data: {
        code?: number;
        data?: {
          content?: string;
          conversationId?: number;
          mealCard?: {
            menuItemId?: number;
            merchantName?: string;
            dishName?: string;
            rating?: number;
            time?: string;
            image?: string;
            locationLabel?: string;
          };
        };
        message?: string;
        content?: string;
      };
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(`响应不是 JSON，状态 ${res.status}，内容: ${raw.slice(0, 200)}`);
      }
      const content =
        (data?.data?.content ?? data?.content ?? "").trim() ||
        "前端取到了空值";
      const newConvId = data?.data?.conversationId;
      const rawMeal = data?.data?.mealCard;

      if (!res.ok) {
        throw new Error(data?.message ?? data?.content ?? `请求失败 ${res.status}`);
      }

      const mealCardPayload: MealRecommendationCardPayload | undefined =
        rawMeal &&
        rawMeal.merchantName &&
        rawMeal.dishName &&
        rawMeal.image &&
        typeof rawMeal.rating === "number" &&
        rawMeal.time
          ? {
              merchantName: rawMeal.merchantName,
              dishName: rawMeal.dishName,
              rating: rawMeal.rating,
              time: rawMeal.time,
              image: rawMeal.image,
              locationLabel: rawMeal.locationLabel,
              menuItemId: rawMeal.menuItemId,
            }
          : undefined;

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content,
        ...(mealCardPayload
          ? {
              card: "mealRecommendation" as const,
              cardPayload: mealCardPayload,
            }
          : {}),
      };
```

（具体卡片 UI 在 `mobile/src/components/MealRecommendationCard.tsx`，论文可附图说明。）

---

## 4. admin（管理后台）：B — Markdown 渲染与 XSS 过滤

### 4.1 在写啥

后台聊天页用 **`marked`** 把助手回复当 Markdown 转成 HTML，再用 **`DOMPurify.sanitize`** 白名单过滤，避免模型或用户内容里夹带脚本导致 **XSS**。同一文件里 **`sendMessage`** 对 Spring Boot 传 **`clientType: "admin"`** 和当前 **`role`**（来自 Pinia），和后端按角色裁剪工具/权限的叙述可以接起来。

### 4.2 关键代码节选

依赖、`authHeaders`、`sendMessage`  body、以及 `renderContent`：

```1:23:admin/src/pages/chat/index.vue
<script lang="ts" setup>
import { marked } from "marked"
import DOMPurify from "dompurify"
import { Delete, Promotion, Plus, Fold, Expand } from "@element-plus/icons-vue"
import { getToken } from "@@/utils/local-storage"
import { useUserStore } from "@/pinia/stores/user"

marked.setOptions({ gfm: true, breaks: true })

/** 带登录态的请求头（与 axios 的 request 一致：Bearer Token） */
function authHeaders(): HeadersInit {
  const token = getToken()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  return headers
}

const CHAT_API_BASE =
  (import.meta.env.VITE_CHAT_API_BASE_URL as string)?.replace(/\/$/, "")
  || (import.meta.env.VITE_API_SAME_ORIGIN === "true" ? "" : "http://localhost:8081")
const userStore = useUserStore()
/** 可选：用于拉取历史对话的用户 ID，不传则后端返回空列表 */
const AI_USER_ID = import.meta.env.VITE_AI_USER_ID ? Number(import.meta.env.VITE_AI_USER_ID) : null
```

```127:188:admin/src/pages/chat/index.vue
async function sendMessage() {
  const content = input.value.trim()
  if (!content || isLoading.value) return

  input.value = ""
  messages.value.push({ role: "user", content })
  messages.value.push({ role: "assistant", content: "" })
  isLoading.value = true
  scrollToBottom()

  const lastIndex = messages.value.length - 1

  try {
    const apiMessages = messages.value
      .slice(0, -1)
      .map(({ role, content: c }) => ({ role, content: c }))
    const body: {
      messages: typeof apiMessages
      conversationId?: number | null
      clientType?: string
      role?: string
    } = {
      messages: apiMessages,
      clientType: "admin",
      role: userStore.roles?.[0] ?? "guest"
    }
    if (conversationId.value != null) body.conversationId = conversationId.value

    const response = await fetch(`${CHAT_API_BASE.replace(/\/$/, "")}/api/ai/chat`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body)
    })

    const raw = await response.text()
    let data: { code?: number; data?: { content?: string; conversationId?: number }; message?: string }
    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {
      data = {}
    }

    const isError = !response.ok || (data?.code !== undefined && data?.code !== 0)
    if (isError) {
      messages.value[lastIndex].content = data?.message || "请求失败，请检查网络或后端服务后重试。"
      ElMessage.error("发送失败")
    } else {
      const text = (data?.data?.content ?? "").trim() || "抱歉，我暂时无法回答这个问题。"
      messages.value[lastIndex].content = text
      if (data?.data?.conversationId != null) {
        conversationId.value = data.data.conversationId
        currentHistoryId.value = data.data.conversationId
        fetchHistory()
      }
    }
  } catch {
    messages.value[lastIndex].content = "请求失败，请检查网络或后端服务后重试。"
    ElMessage.error("发送失败")
  } finally {
    isLoading.value = false
  }
}
```

```208:226:admin/src/pages/chat/index.vue
/**
 * 使用 marked 将 Markdown 转为 HTML，再用 DOMPurify 做 XSS 过滤后输出
 */
function renderContent(content: string): string {
  if (!content?.trim()) return ""
  const rawHtml = marked(content, { async: false }) as string
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      "p", "br", "span", "div",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "strong", "em", "b", "i", "u", "s", "a",
      "ul", "ol", "li",
      "pre", "code",
      "blockquote", "hr",
      "table", "thead", "tbody", "tr", "th", "td"
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"]
  })
}
```

---

## 文档与代码对照（速查）

| 选题 | 主要文件 |
|------|----------|
| screen · 大屏 AI（B） | `screen/src/components/common/AIAssistant.tsx` |
| mobile · 登录与请求头、历史（A） | `mobile/src/App.tsx`，`mobile/src/components/AIAssistantTab.tsx` |
| mobile · 餐品卡片（B） | `mobile/src/components/AIAssistantTab.tsx`，`mobile/src/components/MealRecommendationCard.tsx` |
| admin · Markdown + XSS（B） | `admin/src/pages/chat/index.vue` |

三端共用的 API 封装可在 `shared/api`（`mobile` 通过 `@scs/api` 引用）里对照；环境变量以各包内 `.env` / `vite` 配置为准。
