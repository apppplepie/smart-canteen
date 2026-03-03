/** 声明 vite 环境变量的类型（如果未声明则默认是 any） */
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_BASE_URL: string
  readonly VITE_ROUTER_HISTORY: "hash" | "html5"
  readonly VITE_PUBLIC_PATH: string
  /** AI 对话后端（Spring Boot），默认 http://localhost:8081 */
  readonly VITE_CHAT_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
