# SCS AI Service (FastAPI)

供 Spring Boot 转调的 AI 服务，内部调用 DeepSeek；后续可接入 LangChain。

## 配置

- 复制 `.env.example` 为 `.env`，填写 `DEEPSEEK_API_KEY`。

## 运行

```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- 健康检查: `GET http://localhost:8000/health`
- 对话: `POST http://localhost:8000/chat`，body: `{ "messages": [ {"role":"user","content":"你好"} ] }`

## 与 Spring Boot 协作

- 前端只调 Spring Boot `POST /api/ai/chat`，Spring Boot 再请求本服务 `POST http://localhost:8000/chat`。
